// src/services/export.js

/**
 * Converts an array of objects to CSV format
 * @param {Array} data - Array of objects
 * @param {Array} headers - Array of { key, label } objects
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers) => {
  // Build header row
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  
  // Build data rows
  const rows = data.map(item => {
    return headers.map(h => {
      let value = item[h.key];
      // Handle null/undefined
      if (value === null || value === undefined) return '""';
      // Handle dates
      if (value instanceof Date || (typeof value === 'string' && value.includes('T'))) {
        value = new Date(value).toLocaleString();
      }
      // Escape double quotes
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""');
      }
      return `"${value}"`;
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
};

/**
 * Triggers a download of a CSV file
 * @param {string} csvData - CSV string
 * @param {string} filename - Filename (without extension)
 */
export const downloadCSV = (csvData, filename) => {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};