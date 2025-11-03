# Internationalization (i18n) Feature

Discord Spywatcher now supports multiple languages through a comprehensive internationalization system.

## Features

### ✅ Supported Languages

- **English (en)** - Default language
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch
- **Japanese (ja)** - 日本語

### ✅ Key Capabilities

1. **Automatic Language Detection**: The application automatically detects the user's browser language and applies it if supported.

2. **Language Persistence**: Selected language preference is stored in localStorage and persists across sessions.

3. **Language Switcher UI**: A convenient dropdown menu accessible from any page allows users to change languages on the fly.

4. **RTL Support**: Full support for right-to-left (RTL) languages with automatic layout adjustments.

5. **Comprehensive Coverage**: All user-facing strings are translated, including:
   - Navigation menus
   - Buttons and form labels
   - Dashboard statistics
   - Error messages
   - Toast notifications
   - Accessibility labels

## Implementation Details

### Technology Stack

- **react-i18next**: React integration for i18next
- **i18next**: Core internationalization framework
- **i18next-browser-languagedetector**: Automatic language detection

### Architecture

```
src/
├── config/
│   └── i18n.ts                    # i18n configuration
├── locales/
│   ├── en/
│   │   ├── common.json           # English translations
│   │   └── index.ts
│   ├── es/
│   │   ├── common.json           # Spanish translations
│   │   └── index.ts
│   ├── fr/, de/, ja/             # Other languages...
│   └── ...
├── components/
│   └── ui/
│       └── LanguageSwitcher.tsx  # Language selection component
└── hooks/
    └── useRTL.ts                 # RTL direction hook
```

### Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
    const { t } = useTranslation();
    
    return (
        <div>
            <h1>{t('dashboard.title')}</h1>
            <p>{t('dashboard.subtitle')}</p>
        </div>
    );
}
```

### Interpolation Example

```typescript
// Translation key: "dashboard.stats.scoreThreshold": "Score > {{threshold}}"
<p>{t('dashboard.stats.scoreThreshold', { threshold: 50 })}</p>
// Output: "Score > 50"
```

### Pluralization Example

```typescript
// Translation keys:
// "dashboard.table.days": "{{count}} day"
// "dashboard.table.days_other": "{{count}} days"
<p>{t('dashboard.table.days', { count: 1 })}</p>  // "1 day"
<p>{t('dashboard.table.days', { count: 5 })}</p>  // "5 days"
```

## Configuration

The i18n system is configured in `src/config/i18n.ts`:

```typescript
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: { en, es, fr, de, ja },
        fallbackLng: 'en',
        defaultNS: 'common',
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });
```

## Testing

### Unit Tests

Comprehensive test coverage includes:

- Configuration tests (`src/__tests__/config/i18n.test.ts`)
- Component tests (`src/__tests__/components/ui/LanguageSwitcher.test.tsx`)
- Translation key validation
- Pluralization and interpolation tests
- RTL support tests

Run tests with:
```bash
npm test -- src/__tests__/config/i18n.test.ts
npm test -- src/__tests__/components/ui/LanguageSwitcher.test.tsx
```

### Manual Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Click the language switcher (globe icon)

3. Select a language and verify:
   - All text is translated
   - Layout remains intact
   - Language persists on page refresh
   - RTL languages (if any) render correctly

## RTL (Right-to-Left) Support

The application includes full RTL support infrastructure:

### useRTL Hook

```typescript
import { useRTL } from '../hooks/useRTL';

function MyComponent() {
    const { isRTL, dir } = useRTL();
    
    return (
        <div dir={dir}>
            {/* Content automatically adjusts for RTL */}
        </div>
    );
}
```

### Automatic Direction Setting

The `useRTL` hook automatically:
- Sets `document.documentElement.dir` to 'rtl' or 'ltr'
- Updates `document.documentElement.lang` to the current language
- Provides helper values for conditional rendering

## Accessibility

The i18n implementation maintains full accessibility:

- Screen reader compatibility
- Proper ARIA labels in all languages
- Keyboard navigation support
- Focus management in language switcher

## Performance

- **Lazy Loading**: Translations are bundled but could be lazy-loaded in the future
- **Minimal Bundle Impact**: Translation files add ~30KB to the bundle (compressed)
- **No Runtime Overhead**: i18next is highly optimized

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic Translation Loading**: Load translation files on-demand
2. **Translation Management UI**: Admin interface for managing translations
3. **Crowdsourced Translations**: Community contribution system
4. **More Languages**: Arabic, Chinese, Russian, Portuguese, etc.
5. **Context-aware Translations**: Gender-specific translations where needed
6. **Translation Memory**: Cache and reuse common translations

## Contributing Translations

See [TRANSLATIONS.md](./TRANSLATIONS.md) for detailed guidelines on contributing translations.

## Troubleshooting

### Language Not Changing

1. Clear browser localStorage: `localStorage.removeItem('i18nextLng')`
2. Hard refresh the page (Ctrl+Shift+R)
3. Check browser console for errors

### Missing Translations

If you see translation keys instead of text:
1. Check that the key exists in `locales/[lang]/common.json`
2. Verify the language file is properly imported in `config/i18n.ts`
3. Ensure i18n is initialized before rendering (in `main.tsx`)

### RTL Issues

For RTL languages:
1. Verify the language is in `RTL_LANGUAGES` array
2. Check that `useRTL()` hook is called in the component
3. Ensure Tailwind CSS classes support RTL (use logical properties)

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Translation Guidelines](./TRANSLATIONS.md)
- [Accessibility Guide](../ACCESSIBILITY.md)

---

**Note**: This implementation follows industry best practices for web application internationalization and is production-ready.
