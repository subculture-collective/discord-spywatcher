# Translation Guide

This document provides guidance for contributing translations to Discord Spywatcher.

## Supported Languages

Currently, the application supports the following languages:

- **English (en)** - English
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch
- **Japanese (ja)** - 日本語

## Translation Structure

All translation files are located in the `src/locales/` directory. Each language has its own folder with the following structure:

```
src/locales/
├── en/
│   ├── common.json
│   └── index.ts
├── es/
│   ├── common.json
│   └── index.ts
├── fr/
│   ├── common.json
│   └── index.ts
├── de/
│   ├── common.json
│   └── index.ts
└── ja/
    ├── common.json
    └── index.ts
```

## Adding a New Language

To add a new language:

1. **Create a new language directory** under `src/locales/`:
   ```bash
   mkdir src/locales/[language-code]
   ```

2. **Copy the English translation file** as a starting point:
   ```bash
   cp src/locales/en/common.json src/locales/[language-code]/common.json
   ```

3. **Create an index file** (`src/locales/[language-code]/index.ts`):
   ```typescript
   import common from './common.json';

   export default {
       common,
   };
   ```

4. **Translate the strings** in `common.json` to the new language.

5. **Update the i18n configuration** (`src/config/i18n.ts`):
   - Import the new language:
     ```typescript
     import [langCode] from '../locales/[language-code]';
     ```
   - Add it to `SUPPORTED_LANGUAGES`:
     ```typescript
     { code: '[lang-code]', name: 'Language Name', nativeName: 'Native Name' }
     ```
   - Add it to the `resources` object in `i18n.init()`:
     ```typescript
     resources: {
         en,
         // ... other languages
         [langCode],
     }
     ```

6. **If the language is RTL** (right-to-left), add it to `RTL_LANGUAGES`:
   ```typescript
   export const RTL_LANGUAGES: SupportedLanguage[] = ['ar', 'he'];
   ```

## Translation Guidelines

### Key Naming Convention

Translation keys follow a hierarchical structure using dot notation:

- `app.*` - Application-level strings (name, tagline)
- `navigation.*` - Navigation menu items
- `auth.*` - Authentication-related strings
- `common.*` - Common UI elements (buttons, labels)
- `dashboard.*` - Dashboard-specific strings
- `suspicion.*` - Suspicion monitoring strings
- `analytics.*` - Analytics page strings
- `rules.*` - Rules management strings
- `bans.*` - Ban management strings
- `theme.*` - Theme toggle strings
- `errors.*` - Error messages
- `consent.*` - Cookie consent strings

### Interpolation

For dynamic values, use double curly braces:

```json
{
  "dashboard.stats.scoreThreshold": "Score > {{threshold}}"
}
```

Usage in code:
```typescript
t('dashboard.stats.scoreThreshold', { threshold: 50 })
```

### Pluralization

For strings that need pluralization, use the `_other` suffix:

```json
{
  "dashboard.table.days": "{{count}} day",
  "dashboard.table.days_other": "{{count}} days"
}
```

Usage in code:
```typescript
t('dashboard.table.days', { count: 1 })  // "1 day"
t('dashboard.table.days', { count: 5 })  // "5 days"
```

### Context and Gender

For languages that require different translations based on context or gender, use namespaced keys:

```json
{
  "welcome.male": "Welcome, Mr. {{name}}",
  "welcome.female": "Welcome, Ms. {{name}}"
}
```

## Testing Translations

### Manual Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser.

3. Click the language switcher (globe icon) in the top navigation.

4. Select your language and verify all strings are properly translated.

### Automated Testing

Run the i18n tests:
```bash
npm test -- src/__tests__/config/i18n.test.ts
```

To test a specific language's translations:
```typescript
import i18n from '../../config/i18n';

describe('New Language Translations', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('new-lang');
    });

    it('should translate common keys', () => {
        expect(i18n.t('common.loading')).toBe('Expected translation');
    });
});
```

## Best Practices

1. **Keep consistency**: Maintain consistent terminology across the application.

2. **Consider context**: Some words may have different meanings in different contexts.

3. **Use proper punctuation**: Follow the punctuation rules of the target language.

4. **Preserve formatting**: Keep HTML tags, placeholders, and special characters intact.

5. **Test in the UI**: Always verify translations in the actual user interface to ensure they fit properly.

6. **Be mindful of length**: Some languages require more space than English. Test that your translations don't break the layout.

7. **Cultural sensitivity**: Be aware of cultural differences and ensure translations are appropriate.

8. **Accessibility**: Maintain accessibility attributes and ARIA labels in translations.

## RTL (Right-to-Left) Support

The application includes built-in RTL support for languages like Arabic and Hebrew:

1. Add the language code to `RTL_LANGUAGES` in `src/config/i18n.ts`
2. The `useRTL` hook automatically handles direction changes
3. Tailwind CSS classes will adjust automatically for RTL layouts

## Contribution Workflow

1. **Fork the repository** on GitHub.

2. **Create a feature branch**:
   ```bash
   git checkout -b add-translation-[language-code]
   ```

3. **Add or update translations** following the guidelines above.

4. **Test your changes** thoroughly.

5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add [Language Name] translations"
   ```

6. **Push to your fork**:
   ```bash
   git push origin add-translation-[language-code]
   ```

7. **Open a Pull Request** on the main repository.

## Need Help?

If you need help with translations or have questions:

- Open an issue on GitHub
- Join our community Discord server
- Check the existing translations for reference

Thank you for contributing to make Discord Spywatcher accessible to users worldwide! 🌍
