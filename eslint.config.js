// @ts-check

import eslint from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import simpleImport from 'eslint-plugin-simple-import-sort'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import svelteParser from 'svelte-eslint-parser'
import tsEslint from 'typescript-eslint'

const config = tsEslint.config(
  eslint.configs.recommended,
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      ...tsPlugin.configs['base']?.rules,
      ...tsPlugin.configs['recommended']?.rules,
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(_|\\$\\$)',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImport,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    ignores: ['**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'],
    plugins: {
      svelte: /** @type {any} */ (svelte),
    },
    processor: svelte.processors.svelte,
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      .../** @type {any} */ (svelte.configs.base).rules,
      .../** @type {import('eslint').Linter.RulesRecord} */ (svelte.configs.recommended.rules),
      'no-inner-declarations': 'off',
    },
  },
  prettier,
  {
    files: ['**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts,svelte}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        grecaptcha: false,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      globals: {
        $$Generic: false,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx,cts,mts}'],
    rules: {
      /**
       * ESLint can't detect global namespaces.
       */
      'no-undef': 'off',
    },
  },
  {
    ignores: [
      '**/*.config.js',
      '**/.svelte-kit/**',
      '**/build/**',
      '**/cdk.out/**',
      '**/node_modules/**',
    ],
  },
)

export default config
