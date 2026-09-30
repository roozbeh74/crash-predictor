import { createElement } from '../utils/dom.js';
import { loadCrashData, savePredictions, loadPredictions } from '../utils/storage.js';
import { generateEnsemblePrediction, calculateStatistics, detectAnomalies, findRepeatingPatterns } from '../utils/ai.js';
import { formatMultiplier } from '../utils/dom.js';
import { formatPersianDateTime } from '../utils/time.js';

export default function CrashPredictor() {
    const container = createElement('div');
    
    let crashData = loadCrashData();
    let predictions = loadPredictions();
    let isPredicting = false;
    let currentPrediction = null;
    let predictionHistory = [];
    let chartContainer = null;
    let predictionChart = null;
    
    function render() {
        container.innerHTML = '';
        
        const card = createElement('div', { className: 'card' });
        card.innerHTML = `
            <div class="card-header">
                <h2 class="card-title">پیش‌بینی ضریب کراش</h2>
                <div class="flex gap-sm">
                    <span class="badge badge-info">${crashData.length} رکورد</span>
                    <span class="badge badge-secondary">${predictionHistory.length} پیش‌بینی</span>
                </div>
            </div>
            <div class="card-body gap-lg">
                <div class="flex flex-wrap gap-md items-center">
                    <button class="btn btn-primary btn-lg" onclick="makePrediction()" ${isPredicting || crashData.length < 5 ? 'disabled' : ''}>
                        ${isPredicting ? 'در حال پردازش...' : 'پیش‌بینی کن'}
                    </button>
                    <button class="btn btn-outline" onclick="clearPredictions()">
                        پاک کردن تاریخچه
                    </button>
                </div>
                
                ${currentPrediction ? `
                    <div class="mt-lg">
                        <div class="flex flex-wrap gap-lg items-center">
                            <div class="flex-1 min-w-[200px]">
                                <div class="stat-card">
                                    <div class="stat-value">${formatMultiplier(currentPrediction.ensemble)}</div>
                                    <div class="stat-label">پیش‌بینی ضریب</div>
                                </div>
                            </div>
                            <div class="flex-1 min-w-[200px]">
                                <div class="stat-card">
                                    <div class="stat-value">${currentPrediction.confidence.toFixed(0)}%</div>
                                    <div class="stat-label">اعتماد پیش‌بینی</div>
                                </div>
                            </div>
                            <div class="flex-1 min-w-[200px]">
                                <div class="stat-card">
                                    <div class="stat-value">${currentPrediction.methods.join('+')}</div>
                                    <div class="stat-label">متدها</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="alert alert-${getRecommendationColor()} mt-md">
                            <strong>توصیه:</strong> ${getRecommendationText()}
                            <div class="mt-xs">
                                <span class="badge badge-${getRiskLevelColor()}">
                                    ریسک: ${getRiskLevel()}
                                </span>
                            </div>
                        </div>
                        
                        ${currentPrediction.individual ? `
                            <div class="mt-md">
                                <strong>پیش‌بینی‌های فردی:</strong>
                                <div class="flex gap-md mt-xs flex-wrap">
                                    ${Object.entries(currentPrediction.individual).map(([method, value]) => 
                                        value ? `<span><strong>${method}:</strong> ${formatMultiplier(value)}</span>` : ''
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : crashData.length >= 5 ? `
                    <div class="text-center py-xl text-secondary">
                        برای مشاهده پیش‌بینی، روی دکمه "پیش‌بینی کن" کلیک کنید
                    </div>
                ` : `
                    <div class="alert alert-warning">
                        برای پیش‌بینی، حداقل به 5 رکورد داده نیاز دارید.
                    </div>
                `}
                
                <div class="mt-lg">
                    <h3 class="text-lg font-semibold mb-md">نمودار پیش‌بینی</h3>
                    <div class="chart-wrapper">
                        <div class="chart-container">
                            <canvas id="predictionChart"></canvas>
                        </div>
                    </div>
                </div>
                
                ${predictionHistory.length > 0 ? `
                    <div class="mt-lg">
                        <h3 class="text-lg font-semibold mb-md">تاریخچه پیش‌بینی‌ها</h3>
                        <div class="table-container">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>شماره</th>
                                        <th>پیش‌بینی</th>
                                        <th>اعتماد</th>
                                        <th>متدها</th>
                                        <th>تاریخ</th>
                                    </tr>
                                </thead>
                                <tbody id="predictionHistoryList">
                                    ${predictionHistory.map((p, i) => `
                                        <tr>
                                            <td>${i + 1}</td>
                                            <td>${formatMultiplier(p.ensemble)}</td>
                                            <td>${p.confidence.toFixed(0)}%</td>
                                            <td>${p.methods.join('+')}</td>
                                            <td>${formatPersianDateTime(p.timestamp)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
                
                ${isPredicting ? '<div class="flex justify-center py-md"><div class="spinner"></div></div>' : ''}
            </div>
        `;
        
        container.appendChild(card);
        chartContainer = container.querySelector('.chart-wrapper');
        
        // Attach event handlers
        container.querySelector('button[onclick="makePrediction()"]').addEventListener('click', makePrediction);
        container.querySelector('button[onclick="clearPredictions()"]').addEventListener('click', clearPredictions);
        
        // Initialize chart
        if (crashData.length >= 5) {
            createPredictionChart();
        }
    }
    
    function getRecommendationText() {
        if (!currentPrediction) return '';
        const { ensemble } = currentPrediction;
        if (ensemble < 1.5) return 'با احتیاط بازی کنید. احتمال برد پایین است.';
        else if (ensemble < 2.0) return 'می‌توانید با سرمایه کم بازی کنید.';
        else if (ensemble < 3.0) return 'فرصت خوب برای بازی! احتمال برد مناسب است.';
        else return 'فرصت عالی! احتمال برد بالا است.';
    }
    
    function getRecommendationColor() {
        if (!currentPrediction) return 'info';
        const { ensemble } = currentPrediction;
        if (ensemble < 1.5) return 'danger';
        else if (ensemble < 2.0) return 'warning';
        else return 'success';
    }
    
    function getRiskLevel() {
        if (!currentPrediction) return 'متوسط';
        const { ensemble } = currentPrediction;
        if (ensemble < 1.5) return 'بالا';
        else if (ensemble < 2.0) return 'متوسط';
        else if (ensemble < 3.0) return 'پایین';
        else return 'خیلی پایین';
    }
    
    function getRiskLevelColor() {
        const level = getRiskLevel();
        if (level === 'بالا') return 'danger';
        else if (level === 'پایین' || level === 'خیلی پایین') return 'success';
        else return 'warning';
    }
    
    async function makePrediction() {
        if (crashData.length < 5) {
            alert('لطفاً حداقل 5 رکورد داده وارد کنید');
            return;
        }
        
        isPredicting = true;
        render();
        
        try {
            const multipliers = crashData.map(d => d.multiplier);
            const result = await generateEnsemblePrediction(multipliers, 1);
            
            currentPrediction = {
                ...result,
                timestamp: new Date().toISOString(),
                dataCount: crashData.length
            };
            
            predictionHistory.unshift(currentPrediction);
            if (predictionHistory.length > 10) predictionHistory.pop();
            
            savePredictions(predictionHistory);
            await createPredictionChart();
            
        } catch (error) {
            console.error('Prediction error:', error);
            alert('خطا در پیش‌بینی: ' + error.message);
        } finally {
            isPredicting = false;
            render();
        }
    }
    
    function clearPredictions() {
        if (confirm('آیا از پاک کردن تاریخچه پیش‌بینی‌ها مطمئن هستید؟')) {
            predictionHistory = [];
            currentPrediction = null;
            savePredictions([]);
            render();
        }
    }
    
    async function createPredictionChart() {
        if (!chartContainer) return;
        
        const ctx = chartContainer.querySelector('canvas');
        if (!ctx) return;
        
        if (predictionChart) {
            predictionChart.destroy();
        }
        
        const recentData = crashData.slice(0, 20).reverse();
        const labels = recentData.map((_, i) => `تاریخچه ${20 - i}`);
        const values = recentData.map(d => d.multiplier);
        
        if (currentPrediction) {
            labels.push('پیش‌بینی');
            values.push(currentPrediction.ensemble);
        }
        
        predictionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'ضریب‌های گذشته',
                        data: values.slice(0, -1),
                        borderColor: '#00d2ff',
                        backgroundColor: 'rgba(0, 210, 255, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: '#00d2ff',
                        tension: 0.4
                    },
                    {
                        label: 'پیش‌بینی',
                        data: currentPrediction ? [values[values.length - 1]] : [],
                        borderColor: '#00fa9a',
                        backgroundColor: 'rgba(0, 250, 154, 0.2)',
                        borderWidth: 2,
                        pointRadius: 5,
                        pointBackgroundColor: '#00fa9a'
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
        if (predictionChart) predictionChart.destroy();
    };
    
    return container;
}
