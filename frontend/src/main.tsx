import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <>
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
    </>
);
