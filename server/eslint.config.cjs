const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'dist/**', 'generated/**'] },
  { ...js.configs.recommended, files: ['**/*.{ts,cjs}'], languageOptions: { globals: globals.node },
    // Brownfield baseline: unused legacy declarations are not part of M3 cleanup.
    rules: { ...js.configs.recommended.rules, 'no-unused-vars': 'off' } },
  tseslint.configs.base,
  tseslint.configs.eslintRecommended,
  { files: ['**/*.ts'], rules: { 'no-undef': 'off' } },
];
