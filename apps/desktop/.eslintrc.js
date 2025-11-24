module.exports = {
  extends: ['@my-ai/eslint-config/next.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
