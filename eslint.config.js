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
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
// @ts-ignore
import importPlugin from 'eslint-plugin-import'

const config = tsEslint.config(
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.configs.typescript,
  eslintPluginUnicorn.configs['flat/recommended'],
  {
    languageOptions: {
      globals: globals.builtin,
      parserOptions: {
        project: ['./tsconfig.json'],
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.svelte'],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
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
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-array-some': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/no-useless-undefined': 'warn',
      'import/no-unresolved': 'off', // TODO: currently it has false positives
      'unicorn/filename-case': 'warn',
      'unicorn/prefer-set-has': 'off',
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
      '**/.vitepress/**',
      '**/build/**',
      '**/cdk.out/**',
      '**/node_modules/**',
      '**/coverage',
      '**/dist/**',
    ],
  },
)

export default config
