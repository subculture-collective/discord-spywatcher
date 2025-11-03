import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { RTL_LANGUAGES } from '../config/i18n';

export function useRTL() {
    const { i18n } = useTranslation();
    const isRTL = RTL_LANGUAGES.includes(i18n.language as any);

    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language, isRTL]);

    return {
        isRTL,
        dir: isRTL ? 'rtl' : 'ltr',
    };
}
