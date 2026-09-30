// Main entry point
import App from './App.js';
import './styles/main.css';

// Mount the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    if (app) {
        app.appendChild(App());
    }
});
