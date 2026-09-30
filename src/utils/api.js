/**
 * API and data utilities
 */

import { saveCrashData, loadCrashData, saveLastFetch, loadLastFetch, isDataStale } from './storage.js';

/**
 * Generate sample crash data for demonstration
 */
export function generateSampleCrashData(count = 100) {
    const data = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
        const timestamp = now - (count - i) * 30 * 1000;
        
        const rand = Math.random();
        let multiplier;
        
        if (rand < 0.5) {
            multiplier = 1 + Math.random();
        } else if (rand < 0.75) {
            multiplier = 2 + Math.random() * 3;
        } else if (rand < 0.9) {
            multiplier = 5 + Math.random() * 5;
        } else {
            multiplier = 10 + Math.random() * 90;
        }
        
        data.push({
            id: `crash_${count - i}`,
            multiplier: parseFloat(multiplier.toFixed(2)),
            timestamp: new Date(timestamp).toISOString(),
            gameId: count - i
        });
    }
    
    return data;
}

/**
 * Load crash data (from storage or generate sample)
 */
export async function loadCrashDataAsync(forceRefresh = false) {
    if (!forceRefresh && !isDataStale()) {
        const cachedData = loadCrashData();
        if (cachedData.length > 0) {
            return cachedData;
        }
    }
    
    try {
        const data = generateSampleCrashData(100);
        saveCrashData(data);
        saveLastFetch(Date.now());
        return data;
    } catch (error) {
        const cachedData = loadCrashData();
        if (cachedData.length > 0) {
            return cachedData;
        }
        return generateSampleCrashData(50);
    }
}

/**
 * Import crash data from JSON file
 */
export async function importCrashData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!Array.isArray(data)) {
                    reject(new Error('Invalid data format: expected array'));
                    return;
                }
                const crashData = data.map((item, index) => ({
                    id: `imported_${index}`,
                    multiplier: typeof item === 'number' ? item : item.multiplier || item.value || 1,
                    timestamp: item.timestamp || new Date().toISOString(),
                    gameId: item.gameId || index
                }));
                saveCrashData(crashData);
                saveLastFetch(Date.now());
                resolve(crashData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Export crash data to JSON
 */
export function exportCrashData() {
    const data = loadCrashData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    return blob;
}

/**
 * Export crash data as CSV
 */
export function exportCrashDataAsCSV() {
    const data = loadCrashData();
    const headers = ['Game ID', 'Multiplier', 'Timestamp'];
    const rows = data.map(item => [
        item.gameId || item.id || '',
        item.multiplier || '',
        item.timestamp || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Download a file
 */
export function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export and download crash data
 */
export function exportAndDownload(format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (format === 'json') {
        downloadFile(exportCrashData(), `crash_data_${timestamp}.json`);
    } else if (format === 'csv') {
        downloadFile(exportCrashDataAsCSV(), `crash_data_${timestamp}.csv`);
    }
}
