import { createElement } from '../utils/dom.js';
import { loadCrashData } from '../utils/storage.js';
import { findRepeatingPatterns, calculateStatistics, detectAnomalies, findClusters, analyzeTrends } from '../utils/ai.js';
import { formatMultiplier } from '../utils/dom.js';
import { formatPersianDateTime } from '../utils/time.js';

export default function PatternAnalyzer() {
    const container = createElement('div');
    
    let crashData = loadCrashData();
    let isAnalyzing = false;
    let analysisResult = null;
    let chartContainer = null;
    let patternChart = null;
    
    function render() {
        container.innerHTML = '';
        
        const card = createElement('div', { className: 'card' });
        card.innerHTML = `
            <div class="card-header">
                <h2 class="card-title">تحلیل الگوها</h2>
                <div class="flex gap-sm">
                    <span class="badge badge-info">${crashData.length} رکورد</span>
                    ${analysisResult ? '<span class="badge badge-success">تحلیل شده</span>' : ''}
                </div>
            </div>
            <div class="card-body gap-lg">
                <div class="flex flex-wrap gap-md items-center">
                    <button class="btn btn-primary" onclick="analyzePatterns()" ${isAnalyzing || crashData.length < 10 ? 'disabled' : ''}>
                        ${isAnalyzing ? 'در حال تحلیل...' : 'تحلیل کن'}
                    </button>
                </div>
                
                ${analysisResult ? `
                    <div class="mt-lg">
                        <h3 class="text-lg font-semibold mb-md">آمار کلی</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-md">
                            <div class="stat-card">
                                <div class="stat-value">${formatMultiplier(analysisResult.stats.mean)}</div>
                                <div class="stat-label">میانگین</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${formatMultiplier(analysisResult.stats.median)}</div>
                                <div class="stat-label">میانه</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${analysisResult.stats.stdDev.toFixed(2)}</div>
                                <div class="stat-label">انحراف معیار</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${formatMultiplier(analysisResult.stats.min)}</div>
                                <div class="stat-label">حداقل</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${formatMultiplier(analysisResult.stats.max)}</div>
                                <div class="stat-label">حداکثر</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${analysisResult.stats.count}</div>
                                <div class="stat-label">تعداد</div>
                            </div>
                        </div>
                    </div>
                    
                    ${analysisResult.anomalies.length > 0 ? `
                        <div class="mt-lg">
                            <h3 class="text-lg font-semibold mb-md">ناهنجاری‌ها (${analysisResult.anomalies.length} مورد)</h3>
                            <div class="table-container">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>شاخص</th>
                                            <th>ضریب</th>
                                            <th>امتیاز Z</th>
                                            <th>نوع</th>
                                            <th>تاریخ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${analysisResult.anomalies.map(a => `
                                            <tr>
                                                <td>${a.index + 1}</td>
                                                <td>${formatMultiplier(a.value)}</td>
                                                <td>${a.zScore.toFixed(2)}</td>
                                                <td><span class="badge badge-${a.type === 'high' ? 'danger' : 'success'}">${a.type === 'high' ? 'بالا' : 'پایین'}</span></td>
                                                <td>${formatPersianDateTime(crashData[a.index].timestamp)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${analysisResult.repeatingPatterns.length > 0 ? `
                        <div class="mt-lg">
                            <h3 class="text-lg font-semibold mb-md">الگوهای تکرارشونده</h3>
                            <div class="table-container">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>الگو</th>
                                            <th>تعداد</th>
                                            <th>فرکاانس</th>
                                            <th>موقعیت‌ها</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${analysisResult.repeatingPatterns.slice(0, 10).map(p => `
                                            <tr>
                                                <td>${p.pattern.map(v => formatMultiplier(v)).join(' → ')}</td>
                                                <td>${p.count}</td>
                                                <td>${(p.frequency * 100).toFixed(1)}%</td>
                                                <td>${p.occurrences.slice(0, 3).join(', ')}...</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${analysisResult.clusters.length > 0 ? `
                        <div class="mt-lg">
                            <h3 class="text-lg font-semibold mb-md">خوشه‌ها</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
                                ${analysisResult.clusters.map((c, i) => `
                                    <div class="stat-card">
                                        <div class="stat-value">${formatMultiplier(c.centroid)}</div>
                                        <div class="stat-label">مرکز خوشه ${i + 1}</div>
                                        <div class="text-sm mt-xs">
                                            <strong>تعداد:</strong> ${c.count} | <strong>میانگین:</strong> ${formatMultiplier(c.mean)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="mt-lg">
                        <h3 class="text-lg font-semibold mb-md">روندها</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">روند صعودی</h4>
                                    <span class="badge badge-success">${analysisResult.trends.increasing.length}</span>
                                </div>
                                <div class="card-body">
                                    ${analysisResult.trends.increasing.length > 0 ? `
                                        <p>میانگین تغییر: ${(analysisResult.trends.increasing.reduce((a, b) => a + b.change, 0) / analysisResult.trends.increasing.length).toFixed(1)}%</p>
                                    ` : '<p class="text-secondary">هیچ روند صعودی یافت نشد</p>'}
                                </div>
                            </div>
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">روند نزولی</h4>
                                    <span class="badge badge-danger">${analysisResult.trends.decreasing.length}</span>
                                </div>
                                <div class="card-body">
                                    ${analysisResult.trends.decreasing.length > 0 ? `
                                        <p>میانگین تغییر: ${(analysisResult.trends.decreasing.reduce((a, b) => a + b.change, 0) / analysisResult.trends.decreasing.length).toFixed(1)}%</p>
                                    ` : '<p class="text-secondary">هیچ روند نزولی یافت نشد</p>'}
                                </div>
                            </div>
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">روند پایدار</h4>
                                    <span class="badge badge-info">${analysisResult.trends.stable.length}</span>
                                </div>
                                <div class="card-body">
                                    ${analysisResult.trends.stable.length > 0 ? `
                                        <p>میانگین تغییر: ${(analysisResult.trends.stable.reduce((a, b) => a + b.change, 0) / analysisResult.trends.stable.length).toFixed(1)}%</p>
                                    ` : '<p class="text-secondary">هیچ روند پایدار یافت نشد</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : crashData.length >= 10 ? `
                    <div class="text-center py-xl text-secondary">
                        برای مشاهده تحلیل الگوها، روی دکمه "تحلیل کن" کلیک کنید
                    </div>
                ` : `
                    <div class="alert alert-warning">
                        برای تحلیل الگوها، حداقل به 10 رکورد داده نیاز دارید.
                    </div>
                `}
                
                <div class="mt-lg">
                    <h3 class="text-lg font-semibold mb-md">نمودار الگوها</h3>
                    <div class="chart-wrapper">
                        <div class="chart-container">
                            <canvas id="patternChart"></canvas>
                        </div>
                    </div>
                </div>
                
                ${isAnalyzing ? '<div class="flex justify-center py-md"><div class="spinner"></div></div>' : ''}
            </div>
        `;
        
        container.appendChild(card);
        chartContainer = container.querySelector('.chart-wrapper');
        
        // Attach event handler
        container.querySelector('button[onclick="analyzePatterns()"]').addEventListener('click', analyzePatterns);
        
        // Initialize chart
        if (analysisResult) {
            createPatternChart();
        }
    }
    
    async function analyzePatterns() {
        if (crashData.length < 10) {
            alert('لطفاً حداقل 10 رکورد داده وارد کنید');
            return;
        }
        
        isAnalyzing = true;
        render();
        
        try {
            const multipliers = crashData.map(d => d.multiplier);
            const stats = calculateStatistics(multipliers);
            const repeatingPatterns = findRepeatingPatterns(multipliers, 3);
            const anomalies = detectAnomalies(multipliers, 2);
            const clusters = findClusters(multipliers, 3);
            const trends = analyzeTrends(multipliers, 5);
            
            analysisResult = { stats, repeatingPatterns, anomalies, clusters, trends, timestamp: new Date().toISOString() };
            
            await createPatternChart();
            
        } catch (error) {
            console.error('Analysis error:', error);
            alert('خطا در تحلیل: ' + error.message);
        } finally {
            isAnalyzing = false;
            render();
        }
    }
    
    async function createPatternChart() {
        if (!chartContainer) return;
        
        const ctx = chartContainer.querySelector('canvas');
        if (!ctx) return;
        
        if (patternChart) {
            patternChart.destroy();
        }
        
        if (!analysisResult) return;
        
        const multipliers = crashData.map(d => d.multiplier);
        const labels = crashData.map((_, i) => (crashData.length - i).toString());
        const anomalyIndices = analysisResult.anomalies.map(a => a.index);
        
        patternChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ضریب‌های کراش',
                    data: multipliers,
                    borderColor: '#00d2ff',
                    backgroundColor: multipliers.map((_, i) => 
                        anomalyIndices.includes(i) ? 'rgba(248, 113, 113, 0.5)' : 'rgba(0, 210, 255, 0.2)'
                    ),
                    borderWidth: 2,
                    pointRadius: (context) => anomalyIndices.includes(context.dataIndex) ? 5 : 2,
                    pointBackgroundColor: multipliers.map((_, i) => 
                        anomalyIndices.includes(i) ? '#f87171' : '#00d2ff'
                    ),
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#ffffff', font: { family: 'Vazirmatn, Tahoma, Arial, sans-serif' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const isAnomaly = anomalyIndices.includes(context.dataIndex);
                                return `${isAnomaly ? 'ناهنجاری: ' : ''}${formatMultiplier(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#b0b0c0' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    y: {
                        beginAtZero: false,
                        ticks: { color: '#b0b0c0', callback: (value) => value.toFixed(2) + 'x' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }
    
    // Initial render
    render();
    
    // Update when crash data changes
    const interval = setInterval(() => {
        const newData = loadCrashData();
        if (newData.length !== crashData.length) {
            crashData = newData;
            render();
        }
    }, 1000);
    
    // Cleanup
    container.oncleanup = () => {
        clearInterval(interval);
        if (patternChart) patternChart.destroy();
    };
    
    return container;
}
