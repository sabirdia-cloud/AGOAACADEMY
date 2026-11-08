import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Trophy, User, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface DigitalIDCardProps {
    player: any;
    academySettings: any;
}

export const DigitalIDCard: React.FC<DigitalIDCardProps> = ({ player, academySettings }) => {
    const qrValue = player.qr_code || `PLAYER:${player.player_id}`;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-[340px] mx-auto aspect-[1/1.6] bg-zinc-950 rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-zinc-800 flex flex-col font-tajawal rtl"
            dir="rtl"
        >
            {/* Top Branding Section */}
            <div className="h-2/5 bg-emerald-600 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                    <Trophy className="w-64 h-64 rotate-12" />
                </div>
                
                {/* Academy Logo & Name */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="h-20 w-20 bg-white rounded-full p-2 shadow-xl border-4 border-emerald-500/50">
                        {academySettings?.logo_url ? (
                            <img src={academySettings.logo_url} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                            <Shield className="h-full w-full text-emerald-600" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-white font-black text-xl leading-tight">
                            {academySettings?.name || "أكاديمية كرة القدم"}
                        </h2>
                        <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">
                            بطاقة لاعب معتمدة • {academySettings?.current_season || '2024/2025'}
                        </p>
                    </div>
                </div>
                
                {/* Wave Decor */}
                <div className="absolute -bottom-1 left-0 right-0 h-12 bg-zinc-950 rounded-t-[3rem]" />
            </div>

            {/* Content Section */}
            <div className="flex-1 px-8 pb-8 pt-2 flex flex-col items-center text-center space-y-6">
                {/* Player Profile Photo */}
                <div className="relative -mt-16">
                    <div className="h-32 w-32 rounded-[2rem] bg-zinc-800 border-4 border-zinc-950 shadow-2xl overflow-hidden ring-1 ring-zinc-700">
                        {player.photo_url ? (
                            <img src={player.photo_url} alt={player.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-zinc-700">
                                <User className="h-16 w-16" />
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-zinc-950 text-white">
                        <Trophy className="h-4 w-4" />
                    </div>
                </div>

                {/* Player Name & Category */}
                <div>
                    <h3 className="text-2xl font-black text-white">{player.name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20">
                            {player.category}
                        </span>
                        <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-[10px] font-black border border-zinc-700">
                            ID: #{player.player_id}
                        </span>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="flex-1 w-full flex flex-col items-center justify-center space-y-4">
                    <div className="bg-white p-3 rounded-3xl shadow-xl border-4 border-emerald-500/30">
                        <QRCodeSVG 
                            value={qrValue} 
                            size={120}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        امسح الرمز لتسجيل الحضور
                    </p>
                </div>

                {/* Card Footer Info */}
                <div className="w-full grid grid-cols-2 gap-4 border-t border-zinc-900 pt-4">
                    <div className="text-right space-y-1">
                        <div className="flex items-center gap-1 text-[8px] text-zinc-500 font-black uppercase">
                            <Calendar className="h-2.5 w-2.5" /> مركز اللعب
                        </div>
                        <p className="text-xs font-black text-zinc-200">{player.position || 'غير محدد'}</p>
                    </div>
                    <div className="text-left space-y-1">
                        <div className="flex items-center gap-1 justify-end text-[8px] text-zinc-500 font-black uppercase">
                             تاريخ الصلاحية <Clock className="h-2.5 w-2.5" />
                        </div>
                        <p className="text-xs font-black text-emerald-500">جوان 2025</p>
                    </div>
                </div>
            </div>
            
            {/* Aesthetic bottom bar */}
            <div className="h-2 w-full bg-emerald-600" />
        </motion.div>
    );
};

const Clock = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
);
