import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { QrCode, UserCheck } from "lucide-react";

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
    players?: any[];
}

export function QRScannerModal({ isOpen, onClose, onScan, players }: QRScannerModalProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scannedPlayerName, setScannedPlayerName] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setScannedPlayerName(null);
            return;
        }

        const handleDecodedText = (decodedText: string) => {
            let foundName: string | null = null;
            if (players && players.length > 0) {
                // Helper to compute expected QR code
                const computeQR = (p: any): string => {
                    if (p.qr_code) return p.qr_code;
                    const idStr = String(p.player_id || "").padStart(5, '0');
                    const dateStr = p.birth_date
                        ? p.birth_date.split('-').reverse().join('')
                        : '00000000';
                    return idStr + dateStr;
                };

                const cleanText = decodedText.trim();
                const pByQR = players.find(p => p.qr_code && p.qr_code === cleanText);
                
                const pByID = cleanText.startsWith("PLAYER:")
                    ? players.find(p => String(p.player_id) === cleanText.split(":")[1].replace(/\D/g, ''))
                    : null;
                
                const pByURL = cleanText.includes("/player/")
                    ? players.find(p => {
                        const parts = cleanText.split("/player/")[1]?.split("/");
                        const idPart = parts?.find(s => /^\d+$/.test(s.replace(/\D/g, '')))?.replace(/\D/g, '');
                        return idPart && String(p.player_id) === idPart;
                      })
                    : null;

                const pByComputed = !pByQR && !pByID && !pByURL
                    ? players.find(p => computeQR(p) === cleanText)
                    : null;
                
                const pByNum = !pByQR && !pByID && !pByURL && !pByComputed && /^\d+$/.test(cleanText)
                    ? players.find(p => String(p.player_id) === cleanText)
                    : null;

                const foundPlayer = pByQR || pByID || pByURL || pByComputed || pByNum;
                if (foundPlayer) {
                    foundName = foundPlayer.name;
                    setScannedPlayerName(foundName);
                }
            }

            if (foundName) {
                setTimeout(() => {
                    if (onScan) onScan(foundName!);
                    if (onClose) onClose();
                    setScannedPlayerName(null);
                }, 300);
            } else {
                if (onScan) onScan(decodedText);
                if (onClose) onClose();
            }
        };

        // --- External Barcode Scanner Logic ---
        let buffer = '';
        let lastTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            
            // If the time between keystrokes is too long (> 50ms), it's probably manual typing
            if (currentTime - lastTime > 50) {
                buffer = '';
            }
            lastTime = currentTime;

            if (e.key === 'Enter') {
                if (buffer.length > 0) {
                    if (scannerRef.current) {
                        scannerRef.current.clear().catch(() => {});
                    }
                    handleDecodedText(buffer);
                    buffer = '';
                    e.preventDefault();
                }
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // ----------------------------------------

        // Delay initialization slightly to ensure the DOM element is present
        const timer = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                    /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    scanner.clear().catch(() => { }); // Visual stop
                    handleDecodedText(decodedText);
                },
                (error) => {
                    // console.warn(error);
                }
            );

            scannerRef.current = scanner;
        }, 300);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, [isOpen, players, onClose, onScan]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="مسح رمز QR">
            <div className="flex flex-col items-center justify-center space-y-4 py-4 min-h-[300px]">
                {scannedPlayerName ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-300 py-10">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                            <UserCheck className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-50">{scannedPlayerName}</h2>
                        <p className="text-emerald-500 font-medium">تم العثور على اللاعب بنجاح</p>
                    </div>
                ) : (
                    <>
                        <div id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"></div>

                        <div className="text-center space-y-2">
                            <p className="text-zinc-400 text-sm px-4">
                                وجه الكاميرا نحو رمز QR الخاص باللاعب للمسح التلقائي.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                <QrCode className="h-3 w-3" />
                                يدعم الكاميرا والماسح الخارجي
                            </div>
                        </div>

                        <div className="w-full pt-4 flex justify-center">
                            <Button variant="outline" onClick={onClose} className="border-zinc-800 text-zinc-400">
                                إغلاق الكاميرا
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
