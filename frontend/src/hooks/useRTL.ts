import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { RTL_LANGUAGES } from '../config/i18n';

export function useRTL() {
    const { i18n } = useTranslation();

    useEffect(() => {
        const isRTL = RTL_LANGUAGES.includes(i18n.language as any);
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return {
        isRTL: RTL_LANGUAGES.includes(i18n.language as any),
        dir: RTL_LANGUAGES.includes(i18n.language as any) ? 'rtl' : 'ltr',
    };
}
