import { describe, it, expect, beforeEach } from 'vitest';

import i18n, { SUPPORTED_LANGUAGES, RTL_LANGUAGES } from '../../config/i18n';

describe('i18n Configuration', () => {
    beforeEach(async () => {
        // Reset to default language before each test
        await i18n.changeLanguage('en');
    });

    describe('Initialization', () => {
        it('should initialize i18next', () => {
            expect(i18n).toBeDefined();
            expect(i18n.isInitialized).toBe(true);
        });

        it('should have English as default language', () => {
            expect(i18n.language).toContain('en');
        });

        it('should have fallback language set to English', () => {
            expect(i18n.options.fallbackLng).toEqual(['en']);
        });
    });

    describe('Supported Languages', () => {
        it('should have correct number of supported languages', () => {
            expect(SUPPORTED_LANGUAGES).toHaveLength(5);
        });

        it('should include all required languages', () => {
            const codes = SUPPORTED_LANGUAGES.map(lang => lang.code);
            expect(codes).toContain('en');
            expect(codes).toContain('es');
            expect(codes).toContain('fr');
            expect(codes).toContain('de');
            expect(codes).toContain('ja');
        });

        it('should have proper language names', () => {
            const english = SUPPORTED_LANGUAGES.find(lang => lang.code === 'en');
            expect(english).toBeDefined();
            expect(english?.name).toBe('English');
            expect(english?.nativeName).toBe('English');

            const spanish = SUPPORTED_LANGUAGES.find(lang => lang.code === 'es');
            expect(spanish).toBeDefined();
            expect(spanish?.name).toBe('Spanish');
            expect(spanish?.nativeName).toBe('Español');
        });
    });

    describe('Language Switching', () => {
        it('should switch to Spanish', async () => {
            await i18n.changeLanguage('es');
            expect(i18n.language).toBe('es');
        });

        it('should switch to French', async () => {
            await i18n.changeLanguage('fr');
            expect(i18n.language).toBe('fr');
        });

        it('should switch to German', async () => {
            await i18n.changeLanguage('de');
            expect(i18n.language).toBe('de');
        });

        it('should switch to Japanese', async () => {
            await i18n.changeLanguage('ja');
            expect(i18n.language).toBe('ja');
        });
    });

    describe('Translation Keys', () => {
        it('should have common translations in English', () => {
            expect(i18n.t('app.name')).toBe('Discord Spywatcher');
            expect(i18n.t('common.loading')).toBe('Loading...');
            expect(i18n.t('common.save')).toBe('Save');
        });

        it('should have navigation translations', () => {
            expect(i18n.t('navigation.dashboard')).toBe('Dashboard');
            expect(i18n.t('navigation.analytics')).toBe('Analytics');
        });

        it('should have auth translations', () => {
            expect(i18n.t('auth.loginWithDiscord')).toBe('Login with Discord');
            expect(i18n.t('auth.logout')).toBe('Logout');
        });
    });

    describe('Spanish Translations', () => {
        beforeEach(async () => {
            await i18n.changeLanguage('es');
        });

        it('should translate common keys to Spanish', () => {
            expect(i18n.t('common.loading')).toBe('Cargando...');
            expect(i18n.t('common.save')).toBe('Guardar');
            expect(i18n.t('common.cancel')).toBe('Cancelar');
        });

        it('should translate navigation to Spanish', () => {
            expect(i18n.t('navigation.dashboard')).toBe('Panel');
            expect(i18n.t('navigation.analytics')).toBe('Análisis');
        });
    });

    describe('French Translations', () => {
        beforeEach(async () => {
            await i18n.changeLanguage('fr');
        });

        it('should translate common keys to French', () => {
            expect(i18n.t('common.loading')).toBe('Chargement...');
            expect(i18n.t('common.save')).toBe('Enregistrer');
            expect(i18n.t('common.cancel')).toBe('Annuler');
        });

        it('should translate navigation to French', () => {
            expect(i18n.t('navigation.dashboard')).toBe('Tableau de bord');
            expect(i18n.t('navigation.analytics')).toBe('Analytique');
        });
    });

    describe('German Translations', () => {
        beforeEach(async () => {
            await i18n.changeLanguage('de');
        });

        it('should translate common keys to German', () => {
            expect(i18n.t('common.loading')).toBe('Lädt...');
            expect(i18n.t('common.save')).toBe('Speichern');
            expect(i18n.t('common.cancel')).toBe('Abbrechen');
        });

        it('should translate navigation to German', () => {
            expect(i18n.t('navigation.dashboard')).toBe('Dashboard');
            expect(i18n.t('navigation.analytics')).toBe('Analytik');
        });
    });

    describe('Japanese Translations', () => {
        beforeEach(async () => {
            await i18n.changeLanguage('ja');
        });

        it('should translate common keys to Japanese', () => {
            expect(i18n.t('common.loading')).toBe('読み込み中...');
            expect(i18n.t('common.save')).toBe('保存');
            expect(i18n.t('common.cancel')).toBe('キャンセル');
        });

        it('should translate navigation to Japanese', () => {
            expect(i18n.t('navigation.dashboard')).toBe('ダッシュボード');
            expect(i18n.t('navigation.analytics')).toBe('分析');
        });
    });

    describe('Interpolation', () => {
        it('should interpolate threshold values', () => {
            const result = i18n.t('dashboard.stats.scoreThreshold', { threshold: 50 });
            expect(result).toBe('Score > 50');
        });

        it('should handle pluralization', () => {
            const one = i18n.t('dashboard.table.days', { count: 1 });
            const many = i18n.t('dashboard.table.days', { count: 5 });
            expect(one).toBe('1 day');
            expect(many).toBe('5 days');
        });
    });

    describe('RTL Support', () => {
        it('should have RTL_LANGUAGES defined', () => {
            expect(RTL_LANGUAGES).toBeDefined();
            expect(Array.isArray(RTL_LANGUAGES)).toBe(true);
        });

        it('should not include current supported languages in RTL', () => {
            // None of our current languages are RTL
            expect(RTL_LANGUAGES).toHaveLength(0);
        });
    });

    describe('Fallback Behavior', () => {
        it('should fallback to English for missing translations', async () => {
            await i18n.changeLanguage('es');
            // Use a key that might not exist
            const result = i18n.t('nonexistent.key', { defaultValue: 'Fallback text' });
            expect(result).toBe('Fallback text');
        });
    });
});
