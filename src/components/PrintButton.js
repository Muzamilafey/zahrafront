import React from 'react';
import { PrintIcon } from './Icons';

const PrintButton = ({ targetId, label = 'Print', className = '', disabled = false }) => {
  const handleClick = (e) => {
    e.preventDefault();
    try {
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          const newWin = window.open('', '_blank', 'noopener,noreferrer');
          if (!newWin) {
            // Fallback to default print
            window.print();
            return;
          }

          // Build a simple document copying styles
          newWin.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Print</title>');

          // clone stylesheets and inline styles
          const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(node => node.outerHTML).join('\n');
          newWin.document.write(styles);
          newWin.document.write('</head><body>');

          // use cloned markup
          newWin.document.write(el.outerHTML);
          newWin.document.write('</body></html>');
          newWin.document.close();
          newWin.focus();

          // give the browser a moment to render resources
          setTimeout(() => {
            newWin.print();
            newWin.close();
          }, 500);
          return;
        }
      }

      // default if no target or element not found
      window.print();
    } catch (err) {
      console.error('Print failed', err);
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={
        `inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`
      }
    >
      <PrintIcon className="-ml-0.5 mr-2 h-4 w-4" />
      <span>{label}</span>
    </button>
  );
};

export default PrintButton;
