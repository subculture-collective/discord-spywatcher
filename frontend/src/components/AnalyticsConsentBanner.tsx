/**
 * Analytics Consent Banner Component
 * GDPR-compliant cookie consent banner
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { useAnalytics } from '../hooks/useAnalytics';

export default function AnalyticsConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const { consentStatus, grantConsent, denyConsent } = useAnalytics();

    useEffect(() => {
        // Show banner only if consent is pending
        if (consentStatus === 'pending') {
            setIsVisible(true);
        }
    }, [consentStatus]);

    const handleAccept = () => {
        grantConsent();
        setIsVisible(false);
    };

    const handleDeny = () => {
        denyConsent();
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                            🍪 Privacy & Analytics
                        </h3>
                        <p className="text-sm text-gray-300">
                            We use analytics to improve your experience and understand how you
                            use our application. Your data is anonymized and never shared with
                            third parties. You can change your preferences at any time in settings.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDeny}
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            Accept
                        </button>
                        <button
                            onClick={handleDeny}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            aria-label="Close banner"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
