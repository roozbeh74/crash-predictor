/**
 * LocalStorage utility functions
 */

const STORAGE_PREFIX = 'crashPredictor_';

/**
 * Save data to localStorage
 */
export function saveToStorage(key, value) {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Load data from localStorage
 */
export function loadFromStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(STORAGE_PREFIX + key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
    CRASH_DATA: 'crashData',
    PREDICTIONS: 'predictions',
    LAST_FETCH: 'lastFetch'
};

/**
 * Save crash data
 */
export function saveCrashData(data) {
    saveToStorage(STORAGE_KEYS.CRASH_DATA, data);
}

/**
 * Load crash data
 */
export function loadCrashData() {
    return loadFromStorage(STORAGE_KEYS.CRASH_DATA, []);
}

/**
 * Save predictions
 */
export function savePredictions(predictions) {
    saveToStorage(STORAGE_KEYS.PREDICTIONS, predictions);
}

/**
 * Load predictions
 */
export function loadPredictions() {
    return loadFromStorage(STORAGE_KEYS.PREDICTIONS, []);
}

/**
 * Save last fetch timestamp
 */
export function saveLastFetch(timestamp) {
    saveToStorage(STORAGE_KEYS.LAST_FETCH, timestamp);
}

/**
 * Load last fetch timestamp
 */
export function loadLastFetch() {
    return loadFromStorage(STORAGE_KEYS.LAST_FETCH, 0);
}

/**
 * Check if data is stale
 */
export function isDataStale(minutes = 30) {
    const lastFetch = loadLastFetch();
    const now = Date.now();
    return (now - lastFetch) > (minutes * 60 * 1000);
}
