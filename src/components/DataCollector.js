import { createElement, createButton } from '../utils/dom.js';
import { loadCrashData, saveCrashData, clearStorage } from '../utils/storage.js';
import { generateSampleCrashData, importCrashData, exportAndDownload, loadCrashDataAsync } from '../utils/api.js';
import { formatPersianDateTime } from '../utils/time.js';

export default function DataCollector() {
    const container = createElement('div');
    
    let crashData = loadCrashData();
    let isLoading = false;
    
    function render() {
        container.innerHTML = '';
        
        const card = createElement('div', { className: 'card' });
        card.innerHTML = `
            <div class="card-header">
                <h2 class="card-title">جمع‌آوری داده‌ها</h2>
                <div class="flex gap-sm">
                    <span class="badge badge-info">${crashData.length} رکورد</span>
                </div>
            </div>
            <div class="card-body gap-lg">
                ${crashData.length > 0 ? `
                    <div class="flex flex-col gap-sm">
                        <p><strong>آخرین رکورد:</strong> ${crashData[0].multiplier.toFixed(2)}x در ${formatPersianDateTime(crashData[0].timestamp)}</p>
                        <p><strong>اولین رکورد:</strong> ${crashData[crashData.length - 1].multiplier.toFixed(2)}x</p>
                    </div>
                ` : ''}
                
                <div class="flex flex-wrap gap-md">
                    <button class="btn btn-secondary" onclick="generateSampleData()" ${isLoading ? 'disabled' : ''}>
                        ${isLoading ? 'در حال پردازش...' : 'تولید داده نمونه'}
                    </button>
                    <button class="btn btn-outline" onclick="loadMoreData()" ${isLoading ? 'disabled' : ''}>
                        بارگذاری بیشتر
                    </button>
                    <button class="btn btn-danger" onclick="clearData()">
                        پاک کردن داده‌ها
                    </button>
                </div>
                
                <div class="flex flex-wrap gap-md items-center">
                    <button class="btn btn-outline" onclick="importData()">
                        وارد کردن JSON
                    </button>
                    <button class="btn btn-outline" onclick="exportJson()">
                        خروجی JSON
                    </button>
                    <button class="btn btn-outline" onclick="exportCsv()">
                        خروجی CSV
                    </button>
                </div>
                
                ${isLoading ? '<div class="flex justify-center py-md"><div class="spinner"></div></div>' : ''}
            </div>
        `;
        
        container.appendChild(card);
        
        // Attach event handlers
        container.querySelector('button[onclick="generateSampleData()"]').addEventListener('click', generateSampleData);
        container.querySelector('button[onclick="loadMoreData()"]').addEventListener('click', loadMoreData);
        container.querySelector('button[onclick="clearData()"]').addEventListener('click', clearData);
        container.querySelector('button[onclick="importData()"]').addEventListener('click', importData);
        container.querySelector('button[onclick="exportJson()"]').addEventListener('click', exportJson);
        container.querySelector('button[onclick="exportCsv()"]').addEventListener('click', exportCsv);
    }
    
    async function generateSampleData() {
        isLoading = true;
        render();
        try {
            crashData = generateSampleCrashData(100);
            saveCrashData(crashData);
        } catch (error) {
            console.error('Error generating sample data:', error);
        } finally {
            isLoading = false;
            render();
        }
    }
    
    async function loadMoreData() {
        isLoading = true;
        render();
        try {
            const newData = generateSampleCrashData(50);
            crashData = [...newData, ...crashData];
            saveCrashData(crashData);
        } catch (error) {
            console.error('Error loading more data:', error);
        } finally {
            isLoading = false;
            render();
        }
    }
    
    function clearData() {
        if (confirm('آیا از پاک کردن تمام داده‌ها مطمئن هستید؟')) {
            clearStorage();
            crashData = [];
            render();
        }
    }
    
    async function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    isLoading = true;
                    render();
                    crashData = await importCrashData(file);
                    isLoading = false;
                    render();
                } catch (error) {
                    console.error('Error importing data:', error);
                    alert('خطا در وارد کردن فایل: ' + error.message);
                    isLoading = false;
                    render();
                }
            }
        });
        input.click();
    }
    
    function exportJson() {
        exportAndDownload('json');
    }
    
    function exportCsv() {
        exportAndDownload('csv');
    }
    
    // Initial render
    render();
    
    // Auto-load data if empty
    if (crashData.length === 0) {
        isLoading = true;
        render();
        loadCrashDataAsync().then(data => {
            crashData = data;
            isLoading = false;
            render();
        }).catch(() => {
            isLoading = false;
            render();
        });
    }
    
    return container;
}
