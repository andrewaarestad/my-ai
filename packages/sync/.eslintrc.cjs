module.exports = {
  root: true,
  extends: ['@my-ai/eslint-config/node'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
