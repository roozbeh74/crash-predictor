/**
 * Time and date utility functions
 */

/**
 * Format date for display in Persian
 */
export function formatPersianDate(date, formatStr = 'yyyy/MM/dd HH:mm:ss') {
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        }).format(d).replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3');
    } catch (error) {
        return new Date(date).toLocaleString('fa-IR');
    }
}

/**
 * Format time for display
 */
export function formatTime(date) {
    return formatPersianDate(date, 'HH:mm:ss');
}

/**
 * Format date without time
 */
export function formatDate(date) {
    return formatPersianDate(date, 'yyyy/MM/dd');
}

/**
 * Format date and time
 */
export function formatDateTime(date) {
    return formatPersianDate(date, 'yyyy/MM/dd HH:mm');
}

/**
 * Get current time in Persian
 */
export function getCurrentPersianTime() {
    return formatPersianDate(new Date(), 'HH:mm:ss');
}

/**
 * Get current date in Persian
 */
export function getCurrentPersianDate() {
    return formatPersianDate(new Date(), 'yyyy/MM/dd');
}

/**
 * Get current datetime in Persian
 */
export function getCurrentPersianDateTime() {
    return formatPersianDate(new Date(), 'yyyy/MM/dd HH:mm:ss');
}

/**
 * Group crash data by hour
 */
export function groupByHour(data) {
    const hourlyData = {};
    for (const entry of data) {
        const date = new Date(entry.timestamp);
        const hour = date.getHours().toString().padStart(2, '0');
        if (!hourlyData[hour]) hourlyData[hour] = [];
        hourlyData[hour].push(entry.multiplier);
    }
    return hourlyData;
}

/**
 * Calculate average multiplier for each hour
 */
export function calculateHourlyAverages(data) {
    const hourlyData = groupByHour(data);
    const averages = {};
    for (const [hour, multipliers] of Object.entries(hourlyData)) {
        const sum = multipliers.reduce((a, b) => a + b, 0);
        averages[hour] = sum / multipliers.length;
    }
    return averages;
}

/**
 * Calculate win rate for each hour
 */
export function calculateHourlyWinRates(data, threshold = 1.5) {
    const hourlyData = groupByHour(data);
    const winRates = {};
    for (const [hour, multipliers] of Object.entries(hourlyData)) {
        const wins = multipliers.filter(m => m >= threshold).length;
        winRates[hour] = {
            wins,
            total: multipliers.length,
            rate: (wins / multipliers.length) * 100
        };
    }
    return winRates;
}

/**
 * Find best hours for playing
 */
export function findBestHours(data, threshold = 1.5, minGames = 5) {
    const winRates = calculateHourlyWinRates(data, threshold);
    const bestHours = [];
    for (const [hour, stats] of Object.entries(winRates)) {
        if (stats.total >= minGames) {
            bestHours.push({ hour, winRate: stats.rate, gamesPlayed: stats.total, wins: stats.wins });
        }
    }
    bestHours.sort((a, b) => b.winRate - a.winRate);
    return bestHours;
}

/**
 * Find worst hours for playing
 */
export function findWorstHours(data, threshold = 1.5, minGames = 5) {
    const winRates = calculateHourlyWinRates(data, threshold);
    const worstHours = [];
    for (const [hour, stats] of Object.entries(winRates)) {
        if (stats.total >= minGames) {
            worstHours.push({ hour, winRate: stats.rate, gamesPlayed: stats.total, wins: stats.wins });
        }
    }
    worstHours.sort((a, b) => a.winRate - b.winRate);
    return worstHours;
}

/**
 * Find most active hours
 */
export function findMostActiveHours(data) {
    const hourlyData = groupByHour(data);
    const activeHours = [];
    for (const [hour, multipliers] of Object.entries(hourlyData)) {
        activeHours.push({ hour, gameCount: multipliers.length });
    }
    activeHours.sort((a, b) => b.gameCount - a.gameCount);
    return activeHours;
}

/**
 * Generate time-based recommendations
 */
export function generateTimeRecommendations(data) {
    if (data.length === 0) {
        return { bestHours: [], worstHours: [], recommendation: 'داده کافی برای تحلیل وجود ندارد' };
    }
    
    const bestHours = findBestHours(data, 1.5, 5);
    const worstHours = findWorstHours(data, 1.5, 5);
    
    let recommendation = '';
    if (bestHours.length > 0) {
        const topHours = bestHours.slice(0, 3).map(h => `${h.hour}:00`).join('، ');
        recommendation += `بهترین ساعت‌ها: ${topHours}. `;
    }
    if (worstHours.length > 0) {
        const bottomHours = worstHours.slice(0, 3).map(h => `${h.hour}:00`).join('، ');
        recommendation += `بدترین ساعت‌ها: ${bottomHours}.`;
    }
    
    return { bestHours, worstHours, recommendation };
}

/**
 * Check if current time is in best hours
 */
export function isCurrentTimeInBestHours(bestHours) {
    const currentHour = new Date().getHours().toString();
    return bestHours.some(h => h.hour === currentHour);
}

/**
 * Get time until next best hour
 */
export function getTimeUntilNextBestHour(bestHours) {
    const currentHour = new Date().getHours();
    const bestHourNumbers = bestHours.map(h => parseInt(h.hour));
    
    let nextHour = null;
    for (let h = currentHour + 1; h < 24; h++) {
        if (bestHourNumbers.includes(h)) {
            nextHour = h;
            break;
        }
    }
    if (nextHour === null && bestHourNumbers.length > 0) {
        nextHour = Math.min(...bestHourNumbers);
    }
    
    if (nextHour === null) return { hours: 0, minutes: 0, isNow: false };
    
    let hours = nextHour - currentHour;
    if (hours < 0) hours += 24;
    
    if (bestHourNumbers.includes(currentHour)) {
        return { hours: 0, minutes: 0, isNow: true };
    }
    
    return { hours, minutes: 0, isNow: false };
}
