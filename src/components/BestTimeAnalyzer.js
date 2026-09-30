import { createElement } from '../utils/dom.js';
import { loadCrashData } from '../utils/storage.js';
import { calculateHourlyAverages, calculateHourlyWinRates, findBestHours, findWorstHours, findMostActiveHours, generateTimeRecommendations, formatHoursForDisplay, isCurrentTimeInBestHours, getTimeUntilNextBestHour } from '../utils/time.js';
import { formatMultiplier } from '../utils/dom.js';
import { formatPersianDateTime } from '../utils/time.js';

export default function BestTimeAnalyzer() {
    const container = createElement('div');
    
    let crashData = loadCrashData();
    let isAnalyzing = false;
    let analysisResult = null;
    let chartContainer = null;
    let timeChart = null;
    
    function render() {
        container.innerHTML = '';
        
        const card = createElement('div', { className: 'card' });
        card.innerHTML = `
            <div class="card-header">
                <h2 class="card-title">بهترین ساعت‌های بازی</h2>
                <div class="flex gap-sm">
                    <span class="badge badge-info">${crashData.length} رکورد</span>
                    ${analysisResult ? '<span class="badge badge-success">تحلیل شده</span>' : ''}
                </div>
            </div>
            <div class="card-body gap-lg">
                <div class="flex flex-wrap gap-md items-center">
                    <button class="btn btn-primary" onclick="analyzeBestTimes()" ${isAnalyzing || crashData.length < 24 ? 'disabled' : ''}>
                        ${isAnalyzing ? 'در حال تحلیل...' : 'تحلیل کن'}
                    </button>
                </div>
                
                ${analysisResult ? `
                    ${analysisResult.currentTimeInfo.isBestHour ? `
                        <div class="alert alert-success mt-lg">
                            <strong>✓ ساعت فعلی یکی از بهترین ساعت‌ها است!</strong>
                            <p>فرصت خوبی برای بازی کردن است.</p>
                        </div>
                    ` : `
                        <div class="alert alert-info mt-lg">
                            <strong>ساعت فعلی در لیست بهترین ساعت‌ها نیست.</strong>
                            <p>${analysisResult.currentTimeInfo.timeUntilNext.hours > 0 ? 
                                `ساعت ${analysisResult.currentTimeInfo.timeUntilNext.hours} و ${analysisResult.currentTimeInfo.timeUntilNext.minutes} دقیقه` : 
                                `${analysisResult.currentTimeInfo.timeUntilNext.minutes} دقیقه`} تا بهترین ساعت بعدی باقی مانده است.</p>
                        </div>
                    `}
                    
                    ${analysisResult.recommendations.recommendation ? `
                        <div class="mt-lg">
                            <h3 class="text-lg font-semibold mb-md">توصیه‌ها</h3>
                            <div class="alert alert-info">
                                <p>${analysisResult.recommendations.recommendation}</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="mt-lg">
                        <h3 class="text-lg font-semibold mb-md">بهترین و بدترین ساعت‌ها</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">بهترین ساعت‌ها</h4>
                                    <span class="badge badge-success">${analysisResult.bestHours.length}</span>
                                </div>
                                <div class="card-body">
                                    ${analysisResult.bestHours.length > 0 ? `
                                        <div class="table-container">
                                            <table class="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>رتبه</th>
                                                        <th>ساعت</th>
                                                        <th>نرخ برد</th>
                                                        <th>بازی‌ها</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${analysisResult.bestHours.slice(0, 10).map((h, i) => `
                                                        <tr>
                                                            <td>${i + 1}</td>
                                                            <td><strong>${h.displayHour}</strong></td>
                                                            <td><span class="badge badge-success">${h.winRatePercent}%</span></td>
                                                            <td>${h.gamesPlayed}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    ` : '<p class="text-secondary">هیچ ساعت خوبی یافت نشد</p>'}
                                </div>
                            </div>
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">بدترین ساعت‌ها</h4>
                                    <span class="badge badge-danger">${analysisResult.worstHours.length}</span>
                                </div>
                                <div class="card-body">
                                    ${analysisResult.worstHours.length > 0 ? `
                                        <div class="table-container">
                                            <table class="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>رتبه</th>
                                                        <th>ساعت</th>
                                                        <th>نرخ برد</th>
                                                        <th>بازی‌ها</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${analysisResult.worstHours.slice(0, 10).map((h, i) => `
                                                        <tr>
                                                            <td>${i + 1}</td>
                                                            <td><strong>${h.displayHour}</strong></td>
                                                            <td><span class="badge badge-danger">${h.winRatePercent}%</span></td>
                                                            <td>${h.gamesPlayed}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    ` : '<p class="text-secondary">هیچ ساعت بدی یافت نشد</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${analysisResult.mostActiveHours.length > 0 ? `
                        <div class="mt-lg">
                            <h3 class="text-lg font-semibold mb-md">فعال‌ترین ساعت‌ها</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
                                ${analysisResult.mostActiveHours.slice(0, 6).map(h => `
                                    <div class="stat-card">
                                        <div class="stat-value">${h.displayHour}</div>
                                        <div class="stat-label">${h.gameCount} بازی</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                ` : crashData.length >= 24 ? `
                    <div class="text-center py-xl text-secondary">
                        برای مشاهده تحلیل ساعت‌ها، روی دکمه "تحلیل کن" کلیک کنید
                    </div>
                ` : `
                    <div class="alert alert-warning">
                        برای تحلیل ساعت‌ها، حداقل به 24 رکورد داده نیاز دارید.
                    </div>
                `}
                
                <div class="mt-lg">
                    <h3 class="text-lg font-semibold mb-md">نمودار ساعتی</h3>
                    <div class="chart-wrapper">
                        <div class="chart-container">
                            <canvas id="timeChart"></canvas>
                        </div>
                    </div>
                </div>
                
                ${isAnalyzing ? '<div class="flex justify-center py-md"><div class="spinner"></div></div>' : ''}
            </div>
        `;
        
        container.appendChild(card);
        chartContainer = container.querySelector('.chart-wrapper');
        
        // Attach event handler
        container.querySelector('button[onclick="analyzeBestTimes()"]').addEventListener('click', analyzeBestTimes);
        
        // Initialize chart
        if (analysisResult) {
            createTimeChart();
        }
    }
    
    async function analyzeBestTimes() {
        if (crashData.length < 24) {
            alert('لطفاً حداقل 24 رکورد داده وارد کنید');
            return;
        }
        
        isAnalyzing = true;
        render();
        
        try {
            const dataWithTimestamps = crashData.map((d, i) => ({
                ...d,
                timestamp: d.timestamp || new Date(Date.now() - (crashData.length - i) * 30 * 1000).toISOString()
            }));
            
            const hourlyAverages = calculateHourlyAverages(dataWithTimestamps);
            const hourlyWinRates = calculateHourlyWinRates(dataWithTimestamps, 1.5);
            const bestHours = formatHoursForDisplay(findBestHours(dataWithTimestamps, 1.5, 5));
            const worstHours = formatHoursForDisplay(findWorstHours(dataWithTimestamps, 1.5, 5));
            const mostActiveHours = formatHoursForDisplay(findMostActiveHours(dataWithTimestamps));
            const recommendations = generateTimeRecommendations(dataWithTimestamps);
            
            analysisResult = {
                hourlyAverages,
                hourlyWinRates,
                bestHours,
                worstHours,
                mostActiveHours,
                recommendations,
                timestamp: new Date().toISOString(),
                currentTimeInfo: {
                    isBestHour: isCurrentTimeInBestHours(findBestHours(dataWithTimestamps, 1.5, 5)),
                    timeUntilNext: getTimeUntilNextBestHour(findBestHours(dataWithTimestamps, 1.5, 5))
                }
            };
            
            await createTimeChart();
            
        } catch (error) {
            console.error('Analysis error:', error);
            alert('خطا در تحلیل: ' + error.message);
        } finally {
            isAnalyzing = false;
            render();
        }
    }
    
    async function createTimeChart() {
        if (!chartContainer) return;
        
        const ctx = chartContainer.querySelector('canvas');
        if (!ctx) return;
        
        if (timeChart) {
            timeChart.destroy();
        }
        
        if (!analysisResult) return;
        
        const hours = Object.keys(analysisResult.hourlyAverages).sort();
        const averages = hours.map(h => analysisResult.hourlyAverages[h]);
        const winRates = hours.map(h => analysisResult.hourlyWinRates[h]?.rate || 0);
        
        timeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours.map(h => `${h}:00`),
                datasets: [
                    {
                        label: 'میانگین ضریب',
                        data: averages,
                        type: 'line',
                        borderColor: '#00d2ff',
                        backgroundColor: 'rgba(0, 210, 255, 0.2)',
                        borderWidth: 2,
                        pointRadius: 3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'نرخ برد (>1.5x)',
                        data: winRates,
                        type: 'bar',
                        backgroundColor: 'rgba(0, 250, 154, 0.6)',
                        borderColor: '#00fa9a',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#ffffff', font: { family: 'Vazirmatn, Tahoma, Arial, sans-serif' } }
                    }
                },
                scales: {
                    x: { ticks: { color: '#b0b0c0' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'میانگین ضریب', color: '#b0b0c0' },
                        ticks: { color: '#b0b0c0', callback: (value) => value.toFixed(2) + 'x' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'نرخ برد (%)', color: '#b0b0c0' },
                        ticks: { color: '#b0b0c0', callback: (value) => value.toFixed(0) + '%' },
                        grid: { drawOnChartArea: false, color: 'rgba(255, 255, 255, 0.1)' },
                        min: 0,
                        max: 100
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
        if (timeChart) timeChart.destroy();
    };
    
    return container;
}
