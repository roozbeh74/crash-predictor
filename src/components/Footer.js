import { createElement } from '../utils/dom.js';
import { getCurrentPersianDateTime } from '../utils/time.js';

export default function Footer() {
    const footer = createElement('footer', { className: 'section py-lg' });
    footer.innerHTML = `
        <div class="container">
            <div class="text-center text-secondary text-sm">
                <p>پیش‌بینی هوشمند بازی کراش با هوش مصنوعی</p>
                <p class="mt-sm">
                    <span>آخرین بروزرسانی: </span>
                    <span id="last-update">${getCurrentPersianDateTime()}</span>
                </p>
                <p class="mt-sm">
                    <a href="https://faucetpay.io/play/crash" target="_blank" class="text-primary hover:text-primary-light">
                        بازی کراش FaucetPay
                    </a>
                </p>
            </div>
        </div>
    `;
    
    setInterval(() => {
        const lastUpdateEl = document.getElementById('last-update');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = getCurrentPersianDateTime();
        }
    }, 60000);
    
    return footer;
}
