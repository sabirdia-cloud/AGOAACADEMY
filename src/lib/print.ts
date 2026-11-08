export const printElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // Copy all styles from the main document
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
  styles.forEach(style => {
    doc.head.appendChild(style.cloneNode(true));
  });

  // Add some print-specific styles to the iframe
  const printStyle = doc.createElement('style');
  printStyle.textContent = `
    @page { margin: 0; size: auto; }
    body { background: white !important; color: black !important; margin: 0; padding: 0; }
    .print-container { display: block !important; width: 100% !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  `;
  doc.head.appendChild(printStyle);

  doc.body.innerHTML = element.outerHTML;
  doc.body.dir = 'rtl';

  // Wait for images and fonts to load
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 1000);
};
