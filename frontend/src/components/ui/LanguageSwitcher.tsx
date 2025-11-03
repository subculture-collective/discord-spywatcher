import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '../../config/i18n';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLanguage = SUPPORTED_LANGUAGES.find(
        (lang) => lang.code === i18n.language
    ) || SUPPORTED_LANGUAGES[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
        
        // Update document direction for RTL languages
        document.documentElement.dir = langCode === 'ar' || langCode === 'he' ? 'rtl' : 'ltr';
        document.documentElement.lang = langCode;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text transition-colors focus:outline-none focus:ring-2 focus:ring-ctp-blue focus:ring-offset-2 border border-ctp-surface1"
                aria-label="Change language"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Globe className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
            </motion.button>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-ctp-surface0 rounded-lg shadow-lg border border-ctp-surface1 overflow-hidden z-50"
                    role="menu"
                    aria-orientation="vertical"
                >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full text-left px-4 py-3 hover:bg-ctp-surface1 transition-colors flex items-center justify-between ${
                                currentLanguage.code === lang.code
                                    ? 'bg-ctp-surface1 text-ctp-blue font-semibold'
                                    : 'text-ctp-text'
                            }`}
                            role="menuitem"
                            aria-label={`Switch to ${lang.name}`}
                        >
                            <span className="flex flex-col">
                                <span className="text-sm">{lang.nativeName}</span>
                                <span className="text-xs text-ctp-subtext0">{lang.name}</span>
                            </span>
                            {currentLanguage.code === lang.code && (
                                <svg
                                    className="w-4 h-4 text-ctp-blue"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            )}
                        </button>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
