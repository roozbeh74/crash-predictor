/**
 * AI prediction and pattern analysis utilities
 */

/**
 * Simple prediction using moving average
 */
export function predictWithMovingAverage(data, windowSize = 5, forecastSteps = 1) {
    const predictions = [];
    for (let i = 0; i < forecastSteps; i++) {
        const window = data.slice(-windowSize);
        const avg = window.reduce((a, b) => a + b, 0) / window.length;
        predictions.push(avg);
    }
    return predictions;
}

/**
 * Calculate statistical features
 */
export function calculateStatistics(data) {
    if (data.length === 0) {
        return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, range: 0, count: 0 };
    }
    
    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / data.length;
    const median = sorted.length % 2 === 0 
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    return { mean, median, stdDev, min, max, range, count: data.length };
}

/**
 * Detect anomalies in crash data
 */
export function detectAnomalies(data, threshold = 2) {
    const stats = calculateStatistics(data);
    const anomalies = [];
    
    for (let i = 0; i < data.length; i++) {
        const zScore = Math.abs((data[i] - stats.mean) / (stats.stdDev || 1));
        if (zScore > threshold) {
            anomalies.push({
                index: i,
                value: data[i],
                zScore,
                type: data[i] > stats.mean ? 'high' : 'low'
            });
        }
    }
    return anomalies;
}

/**
 * Find repeating patterns in crash data
 */
export function findRepeatingPatterns(data, patternLength = 3) {
    const patterns = [];
    const patternMap = new Map();
    
    for (let i = 0; i <= data.length - patternLength; i++) {
        const pattern = data.slice(i, i + patternLength);
        const patternKey = pattern.join(',');
        
        if (!patternMap.has(patternKey)) {
            patternMap.set(patternKey, { pattern, occurrences: [], count: 0 });
        }
        
        const entry = patternMap.get(patternKey);
        entry.occurrences.push(i);
        entry.count++;
    }
    
    for (const [key, entry] of patternMap) {
        if (entry.count >= 2) {
            patterns.push({
                pattern: entry.pattern,
                count: entry.count,
                occurrences: entry.occurrences,
                frequency: entry.count / data.length
            });
        }
    }
    
    patterns.sort((a, b) => b.frequency - a.frequency);
    return patterns;
}

/**
 * Calculate similarity between two arrays
 */
export function calculateSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    const sumDiff = a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
    const range = Math.max(...a, ...b) - Math.min(...a, ...b) || 1;
    const normalizedDiff = sumDiff / (a.length * range);
    return 1 - Math.min(normalizedDiff, 1);
}

/**
 * Find similar patterns (fuzzy matching)
 */
export function findSimilarPatterns(data, patternLength = 3, threshold = 0.9) {
    const patterns = [];
    for (let i = 0; i <= data.length - patternLength; i++) {
        const pattern = data.slice(i, i + patternLength);
        for (let j = i + 1; j <= data.length - patternLength; j++) {
            const other = data.slice(j, j + patternLength);
            const similarity = calculateSimilarity(pattern, other);
            if (similarity >= threshold) {
                patterns.push({ pattern1: pattern, pattern2: other, similarity, index1: i, index2: j });
            }
        }
    }
    return patterns;
}

/**
 * Analyze trends in crash data
 */
export function analyzeTrends(data, windowSize = 5) {
    const trends = { increasing: [], decreasing: [], stable: [] };
    
    for (let i = 0; i <= data.length - windowSize; i++) {
        const window = data.slice(i, i + windowSize);
        const start = window[0];
        const end = window[windowSize - 1];
        const change = ((end - start) / start) * 100;
        
        if (change > 5) {
            trends.increasing.push({ startIndex: i, endIndex: i + windowSize - 1, startValue: start, endValue: end, change });
        } else if (change < -5) {
            trends.decreasing.push({ startIndex: i, endIndex: i + windowSize - 1, startValue: start, endValue: end, change });
        } else {
            trends.stable.push({ startIndex: i, endIndex: i + windowSize - 1, startValue: start, endValue: end, change });
        }
    }
    return trends;
}

/**
 * Find clusters in crash data
 */
export function findClusters(data, k = 3) {
    if (data.length === 0) return [];
    
    const centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push(data[Math.floor(Math.random() * data.length)]);
    }
    
    const clusters = Array(k).fill().map(() => []);
    
    for (const value of data) {
        const distances = centroids.map(c => Math.abs(value - c));
        const closest = distances.indexOf(Math.min(...distances));
        clusters[closest].push(value);
    }
    
    return clusters.map((cluster, i) => ({
        centroid: centroids[i],
        values: cluster,
        count: cluster.length,
        mean: cluster.reduce((a, b) => a + b, 0) / cluster.length
    }));
}

/**
 * Generate prediction confidence score
 */
export function calculateConfidence(data, prediction) {
    if (data.length === 0) return 50;
    const stats = calculateStatistics(data);
    const zScore = Math.abs((prediction - stats.mean) / (stats.stdDev || 1));
    
    if (zScore <= 1) return 90 - (zScore * 10);
    else if (zScore <= 2) return 70 - ((zScore - 1) * 20);
    else return Math.max(10, 50 - ((zScore - 2) * 20));
}

/**
 * Generate prediction using neural network (simplified for browser)
 */
export async function generateAIPrediction(data, forecastSteps = 1) {
    if (data.length < 5) {
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        return { predictions: Array(forecastSteps).fill(avg), confidence: 50, method: 'average' };
    }
    
    try {
        // Use brain.js for neural network prediction
        if (typeof brain !== 'undefined') {
            const net = new brain.NeuralNetwork({
                hiddenLayers: [5, 5],
                activation: 'relu'
            });
            
            // Prepare training data
            const trainingData = [];
            const windowSize = Math.min(5, data.length);
            
            for (let i = 0; i < data.length - windowSize; i++) {
                trainingData.push({
                    input: data.slice(i, i + windowSize),
                    output: [data[i + windowSize]]
                });
            }
            
            net.train(trainingData, {
                iterations: 1000,
                errorThresh: 0.05,
                log: false
            });
            
            const currentInput = data.slice(-windowSize);
            const prediction = net.run(currentInput)[0];
            const confidence = calculateConfidence(data, prediction);
            
            return {
                predictions: Array(forecastSteps).fill(prediction),
                confidence,
                method: 'neural-network'
            };
        } else {
            // Fallback to moving average
            const windowSize = 5;
            const window = data.slice(-windowSize);
            const avg = window.reduce((a, b) => a + b, 0) / window.length;
            return {
                predictions: Array(forecastSteps).fill(avg),
                confidence: 60,
                method: 'moving-average'
            };
        }
    } catch (error) {
        console.error('AI prediction error:', error);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        return { predictions: Array(forecastSteps).fill(avg), confidence: 50, method: 'average' };
    }
}

/**
 * Generate ensemble prediction
 */
export async function generateEnsemblePrediction(data, forecastSteps = 1) {
    if (data.length < 5) {
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        return { predictions: Array(forecastSteps).fill(avg), confidence: 50, methods: ['average'], ensemble: avg };
    }
    
    try {
        const predictions = await generateAIPrediction(data, forecastSteps);
        const movingAvg = predictWithMovingAverage(data, 5, forecastSteps);
        
        const ensemble = (predictions.predictions[0] + movingAvg[0]) / 2;
        const confidence = (predictions.confidence + 70) / 2;
        
        return {
            predictions: Array(forecastSteps).fill(ensemble),
            confidence,
            methods: ['neural-network', 'moving-average'],
            ensemble,
            individual: {
                neuralNetwork: predictions.predictions[0],
                movingAverage: movingAvg[0]
            }
        };
    } catch (error) {
        console.error('Ensemble prediction error:', error);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        return { predictions: Array(forecastSteps).fill(avg), confidence: 50, methods: ['average'], ensemble: avg };
    }
}
