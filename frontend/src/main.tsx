import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { initSentry } from './config/sentry';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Initialize Sentry before rendering
initSentry();

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <ThemeProvider>
            <App />
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e1e2e', // ctp.base
                        color: '#cdd6f4', // ctp.text
                        border: '1px solid #313244', // ctp.surface0
                    },
                    success: {
                        iconTheme: {
                            primary: '#a6e3a1', // ctp.green
                            secondary: '#1e1e2e', // ctp.base
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#f38ba8', // ctp.red
                            secondary: '#1e1e2e', // ctp.base
                        },
                    },
                }}
            />
        </ThemeProvider>
    </ErrorBoundary>
);
