/**
 * exportUtils.ts
 * High-fidelity client-side utility functions for exporting and printing data 
 * to professional PDF layouts (via styled silent print iframes) and Excel-compatible CSV files.
 */

// Helper to escape CSV cell contents
function cleanCSVCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers a browser download of a dynamically generated CSV file representing the table.
 * CSV opens natively in Microsoft Excel, Google Sheets, and other spreadsheet programs.
 */
export function exportToCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const headerLine = headers.map(cleanCSVCell).join(',');
  const rowLines = rows.map(row => row.map(cleanCSVCell).join(','));
  const csvContent = [headerLine, ...rowLines].join('\n');
  
  // Create circular binary stream / blob with BOM for UTF-8 compatibility in Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a clean, professional, enterprise-grade print stylesheet and layout 
 * in a hidden iframe to isolate the data and trigger a perfect system Print to PDF.
 * This completely isolates the printable document from the parent app wrapper, 
 * avoiding sidebar/button clutter.
 */
export function printData(title: string, headers: string[], rows: string[][], summarySectionHTML?: string) {
  // Create hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'print-data-iframe';
  iframe.style.position = 'absolute';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Could not construct isolated print document.');
    return;
  }
  
  const timestamp = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
  
  const tableHeadersHTML = headers.map(h => `<th style="padding: 10px 8px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; color: #475569; background-color: #f8fafc;">${h}</th>`).join('');
  const tableRowsHTML = rows.map((r, idx) => {
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const cellsHTML = r.map(cell => `<td style="padding: 10px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${cell}</td>`).join('');
    return `<tr style="background-color: ${bgColor};">${cellsHTML}</tr>`;
  }).join('');
  
  const fullHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 0;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #6366f1;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .company-name {
          font-size: 18px;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.025em;
        }
        .subtitle {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }
        .document-title {
          font-size: 16px;
          font-weight: 700;
          color: #6366f1;
          margin-top: 6px;
        }
        .meta-info {
          text-align: right;
          font-size: 10px;
          color: #64748b;
          line-height: 1.4;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 25px;
        }
        .summary-block {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 20px;
        }
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }
        tr {
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company-name">AAA Import &amp; Export</div>
          <div class="subtitle">Store &amp; Sales management System  &bull; Store registry</div>
          <div class="document-title">${title}</div>
        </div>
        <div class="meta-info">
          <div><strong>Date Generated:</strong> ${timestamp}</div>
          <div><strong>Status:</strong> Approved Ledger</div>
          <div><strong>Scope:</strong> Entry Records</div>
        </div>
      </div>
      
      ${summarySectionHTML ? `<div class="summary-block">${summarySectionHTML}</div>` : ''}
      
      <table class="report-table">
        <thead>
          <tr>${tableHeadersHTML}</tr>
        </thead>
        <tbody>
          ${tableRowsHTML}
        </tbody>
      </table>
      
      <div class="footer">
        <div>&copy; 2026 AAA Import &amp; Export. Confidential Company Record.</div>
        <div>Page 1 of 1</div>
      </div>
      
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 300);
        });
      </script>
    </body>
    </html>
  `;
  
  iframeDoc.open();
  iframeDoc.write(fullHTML);
  iframeDoc.close();
  
  // Auto remove iframe after 3 seconds
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 3000);
}
