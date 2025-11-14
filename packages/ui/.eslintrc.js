module.exports = {
  root: true,
  extends: ['@my-ai/eslint-config/react-library'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
