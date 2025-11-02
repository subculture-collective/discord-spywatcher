import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemedToaster } from './components/ThemedToaster';
import { initSentry } from './config/sentry';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Initialize Sentry before rendering
initSentry();

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <ThemeProvider>
            <App />
            <ThemedToaster />
        </ThemeProvider>
    </ErrorBoundary>
);
