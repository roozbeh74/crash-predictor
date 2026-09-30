import { createElement } from '../utils/dom.js';

export default function Header() {
    const header = createElement('header', { className: 'page-header' });
    header.innerHTML = `
        <div class="container">
            <div class="flex justify-between items-center py-md">
                <div class="flex items-center gap-md">
                    <a href="/" class="flex items-center gap-sm text-primary">
                        <div class="text-2xl font-bold">کراش پیش‌بینی</div>
                    </a>
                </div>
                <div class="flex items-center gap-md">
                    <a href="#collector" class="text-secondary hover:text-primary transition-colors">داده‌ها</a>
                    <a href="#predictor" class="text-secondary hover:text-primary transition-colors">پیش‌بینی</a>
                    <a href="#patterns" class="text-secondary hover:text-primary transition-colors">الگوها</a>
                    <a href="#best-times" class="text-secondary hover:text-primary transition-colors">ساعت‌ها</a>
                </div>
            </div>
        </div>
    `;
    return header;
}
