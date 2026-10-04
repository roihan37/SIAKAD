// Existing .cjs suites import TypeScript directly. Type safety is a separate gate.
require('ts-node').register({
  project: require('node:path').resolve(__dirname, '../../tsconfig.json'),
  transpileOnly: true,
  files: true,
});
