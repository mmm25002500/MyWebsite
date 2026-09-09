import { FlatCompat } from '@eslint/eslintrc';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      '.next-build/**',
      'node_modules/**',
      'public/**',
      'docs/**',
      'supabase/.temp/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      // 規格 §0.3：禁用 any，必要時以 unknown + 型別守衛替代。
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // 一次性的煙霧測試腳本，輸出就是它的目的。
    files: ['scripts/**/*'],
    rules: { 'no-console': 'off' },
  },
);
