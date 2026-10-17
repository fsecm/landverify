/**
 * Export Utility (utils/export.js)
 * Converts deeds data to CSV string and manages browser file downloads.
 */

/**
 * Escapes a field for CSV format (RFC 4180).
 * Wraps in double quotes if it contains commas, double quotes, or newlines.
 * Double quotes are escaped by doubling them ("").
 * 
 * @param {string|number|null|undefined} val - Field value
 * @returns {string} Escaped CSV string
 */
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts an array of deed objects into a RFC 4180-compliant CSV string.
 * Prepends the UTF-8 Byte Order Mark (\uFEFF) to guarantee Unicode / Bangla font
 * compatibility in Microsoft Excel and LibreOffice Calc.
 * 
 * @param {Array<Object>} deeds - Array of deed records
 * @returns {string} Formatted CSV string
 */
export function deedsToCSV(deeds) {
  if (!deeds || !Array.isArray(deeds) || deeds.length === 0) {
    return '';
  }

  const headers = [
    'Deed No',
    'Plot ID',
    'Seller Name',
    'Buyer Name',
    'Deed Date',
    'Sub-Registry Office',
    'Consideration (BDT)',
    'File Name',
    'SHA-256 Hash',
    'QR Token',
    'Registration Date'
  ];

  const headerRow = headers.map(h => `"${h}"`).join(',');

  const rows = deeds.map((deed) => {
    return [
      escapeCsvValue(deed.deedNo),
      escapeCsvValue(deed.plotId),
      escapeCsvValue(deed.seller),
      escapeCsvValue(deed.buyer),
      escapeCsvValue(deed.deedDate),
      escapeCsvValue(deed.subRegistryOffice || 'Mirpur Sub-Registry'),
      escapeCsvValue(deed.considerationAmountBDT || 0),
      escapeCsvValue(deed.fileName),
      escapeCsvValue(deed.fileHash),
      escapeCsvValue(deed.qrToken),
      escapeCsvValue(deed.createdAt)
    ].join(',');
  });

  // \uFEFF ensures Excel renders UTF-8 correctly
  return '\uFEFF' + [headerRow, ...rows].join('\r\n');
}

/**
 * Triggers a browser download of a CSV text string as a .csv file.
 * 
 * @param {string} csvString - The raw CSV string
 * @param {string} [filename] - Optional filename (defaults to timestamped name)
 */
export function triggerCSVDownload(csvString, filename) {
  if (!csvString) {
    console.warn('No data to download.');
    return;
  }

  const defaultFilename = `landverify_deeds_${new Date().toISOString().split('T')[0]}.csv`;
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download of a deeds CSV export.
 * @param {Array<Object>} deeds - Array of deed records
 * @param {string} [filename] - Optional filename
 */
export function downloadDeedsCSV(deeds, filename) {
  const csvData = deedsToCSV(deeds);
  if (!csvData) {
    console.warn('No deed records available to export.');
    return;
  }
  const defaultFilename = `landverify_deeds_${new Date().toISOString().split('T')[0]}.csv`;
  triggerCSVDownload(csvData, filename || defaultFilename);
}

/**
 * Converts an array of alert objects into a RFC 4180-compliant CSV string.
 * @param {Array<Object>} alerts - Array of alert records
 * @returns {string} Formatted CSV string
 */
export function alertsToCSV(alerts) {
  if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
    return '';
  }

  const headers = [
    'Alert ID',
    'Plot ID',
    'Alert Type',
    'Status',
    'Description',
    'Related Deed ID',
    'Created Date'
  ];

  const headerRow = headers.map(h => `"${h}"`).join(',');

  const rows = alerts.map((alert) => {
    return [
      escapeCsvValue(alert.id),
      escapeCsvValue(alert.plotId),
      escapeCsvValue(alert.type),
      escapeCsvValue(alert.status),
      escapeCsvValue(alert.description),
      escapeCsvValue(alert.deedId || 'N/A'),
      escapeCsvValue(alert.createdAt)
    ].join(',');
  });

  return '\uFEFF' + [headerRow, ...rows].join('\r\n');
}

/**
 * Triggers a browser download of an alerts CSV export.
 * @param {Array<Object>} alerts - Array of alert records
 * @param {string} [filename] - Optional filename
 */
export function downloadAlertsCSV(alerts, filename) {
  const csvData = alertsToCSV(alerts);
  if (!csvData) {
    alert('No alert records available to export.');
    return;
  }
  const defaultFilename = `landverify_alerts_${new Date().toISOString().split('T')[0]}.csv`;
  triggerCSVDownload(csvData, filename || defaultFilename);
}

