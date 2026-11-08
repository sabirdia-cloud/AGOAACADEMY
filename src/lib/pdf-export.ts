import jsPDF from 'jspdf';
import { toJpeg, toPng } from 'html-to-image';

export const exportToPDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Ensure fonts are fully loaded so Arabic text (Tajawal) renders beautifully
    await document.fonts.ready;
    // Small delay to ensure any images/QR codes are fully rendered
    await new Promise(resolve => setTimeout(resolve, 800));

    let pdf: jsPDF;

    if ((elementId === 'player-card' || elementId.includes('card')) && !elementId.includes('container') && !elementId.includes('batch')) {
      const subCards = Array.from(element.querySelectorAll('.print-card-page')) as HTMLElement[];
      
      if (subCards.length > 0) {
        // Multi-page card export (e.g. Front & Back)
        const formatSize: [number, number] = elementId.includes('staff') ? [90, 55] : [90, 60];
        pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: formatSize });
        
        for (let i = 0; i < subCards.length; i++) {
          if (i > 0) pdf.addPage();
          const cardEl = subCards[i];
          const imgData = await toJpeg(cardEl, {
            quality: 1.0,
            pixelRatio: 3, // High print resolution
            cacheBust: true,
            style: { transform: 'scale(1)', transformOrigin: 'top left' }
          });
          pdf.addImage(imgData, 'JPEG', 0, 0, 90, formatSize[1]);
        }
      } else {
        // Single card export
        const imgData = await toJpeg(element, {
          quality: 1.0,
          pixelRatio: 3,
          cacheBust: true,
          style: { transform: 'scale(1)', transformOrigin: 'top left' }
        });
        const height = elementId.includes('staff') ? 55 : 60;
        pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [90, height] });
        pdf.addImage(imgData, 'JPEG', 0, 0, 90, height);
      }
    } else {
      // Find all individual A4 pages inside the element
      let pages = Array.from(element.querySelectorAll('[style*="297mm"]')) as HTMLElement[];
      if (pages.length === 0) {
        pages = [element as HTMLElement];
      }

      pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        const pageEl = pages[i];
        
        // Create high-quality image from each specific page
        // html-to-image perfectly preserves Arabic ligatures AND CSS layout
        const imgData = await toJpeg(pageEl, {
          quality: 1.0,
          backgroundColor: '#ffffff',
          pixelRatio: 2, // Equivalent to scale: 2
          cacheBust: true,
          style: { transform: 'scale(1)', transformOrigin: 'top left' }
        });

        // Exact A4 dimensions in mm
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
    }

    // Download the PDF
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
  }
};

export const exportToPNG = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const imgData = await toPng(element, {
      quality: 1.0,
      pixelRatio: 3, // High resolution
      cacheBust: true,
      style: { transform: 'scale(1)', transformOrigin: 'top left' }
    });

    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = imgData;
    link.click();
  } catch (error) {
    console.error('Error generating PNG:', error);
    alert('حدث خطأ أثناء إنشاء الصورة.');
  }
};

