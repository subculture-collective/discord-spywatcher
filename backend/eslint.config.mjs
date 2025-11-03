// @ts-check
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import importPlugin from 'eslint-plugin-import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
    {
        ignores: [
            'node_modules',
            'dist',
            'build',
            'coverage',
            'src/generated',
            'eslint.config.mjs',
            'jest.config.js',
            'plugins/**/*.js',
            'plugin-data',
        ],
    },
    // Base ESLint config for all files
    eslint.configs.recommended,
    // JavaScript files - no type checking
    {
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // Node.js globals
                module: 'readonly',
                require: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'readonly',
                console: 'readonly',
            },
        },
        plugins: {
            security: security,
            import: importPlugin,
        },
        rules: {
            ...security.configs.recommended.rules,
            'no-console': 'warn',
        },
    },
    // TypeScript files - with type checking
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            security: security,
            import: importPlugin,
        },
        rules: {
            ...security.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'warn', // Downgraded from error
            '@typescript-eslint/explicit-function-return-type': 'off', // Turned off - TypeScript can infer
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': 'off', // Allowed in backend - it's a CLI/server app
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
            'import/newline-after-import': 'error',
            'import/no-duplicates': 'error',
        },
    },
    // Test files - relax some rules
    {
        files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/unbound-method': 'off', // Jest mocks can be unbound
        },
    }
);
