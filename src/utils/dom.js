/**
 * DOM utility functions
 */

/**
 * Create a DOM element
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
            element.setAttribute(key, value);
        }
    }
    if (options.text) element.textContent = options.text;
    if (options.html) element.innerHTML = options.html;
    if (options.children) {
        options.children.forEach(child => {
            element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        });
    }
    return element;
}

/**
 * Create a button element
 */
export function createButton(options = {}) {
    const button = createElement('button', {
        className: `btn ${options.className || ''}`.trim(),
        text: options.text,
        html: options.html,
        attributes: options.attributes
    });
    if (options.onClick) button.addEventListener('click', options.onClick);
    if (options.disabled) button.disabled = true;
    return button;
}

/**
 * Format a number as a multiplier (e.g., 1.5x)
 */
export function formatMultiplier(num, decimals = 2) {
    return `${num.toFixed(decimals)}x`;
}

/**
 * Format a number with locale
 */
export function formatNumber(num, decimals = 2) {
    return num.toLocaleString('fa-IR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Create a spinner
 */
export function createSpinner(options = {}) {
    const spinner = createElement('div', {
        className: `spinner ${options.className || ''}`.trim(),
        attributes: { role: 'status', 'aria-label': options.label || 'Loading...' }
    });
    return spinner;
}

/**
 * Escape HTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
