import { createElement } from './utils/dom.js';
import CrashPredictor from './components/CrashPredictor.js';
import DataCollector from './components/DataCollector.js';
import PatternAnalyzer from './components/PatternAnalyzer.js';
import BestTimeAnalyzer from './components/BestTimeAnalyzer.js';
import Header from './components/Header.js';
import Footer from './components/Footer.js';

export default function App() {
    const app = createElement('div', { className: 'page' });
    
    // Header
    app.appendChild(Header());
    
    // Main Content
    const main = createElement('main', { className: 'container' });
    
    // Hero Section
    const heroSection = createElement('section', { className: 'page-header' });
    heroSection.innerHTML = `
        <h1 class="page-title">کراش پیش‌بینی</h1>
        <p class="page-subtitle">پیش‌بینی هوشمند بازی کراش با هوش مصنوعی - تحلیل الگوهای تکرارشونده و پیشنهاد بهترین ساعت‌ها</p>
        <div class="mt-lg">
            <a href="#predictor" class="btn btn-primary btn-lg">شروع پیش‌بینی</a>
            <a href="#patterns" class="btn btn-outline btn-lg">مشاهده الگوها</a>
        </div>
    `;
    main.appendChild(heroSection);
    
    // Data Collector Section
    const dataCollectorSection = createElement('section', { className: 'section', id: 'collector' });
    dataCollectorSection.appendChild(DataCollector());
    main.appendChild(dataCollectorSection);
    
    // Crash Predictor Section
    const predictorSection = createElement('section', { className: 'section', id: 'predictor' });
    predictorSection.appendChild(CrashPredictor());
    main.appendChild(predictorSection);
    
    // Pattern Analyzer Section
    const patternSection = createElement('section', { className: 'section', id: 'patterns' });
    patternSection.appendChild(PatternAnalyzer());
    main.appendChild(patternSection);
    
    // Best Time Analyzer Section
    const bestTimeSection = createElement('section', { className: 'section', id: 'best-times' });
    bestTimeSection.appendChild(BestTimeAnalyzer());
    main.appendChild(bestTimeSection);
    
    app.appendChild(main);
    
    // Footer
    app.appendChild(Footer());
    
    return app;
}
