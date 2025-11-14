module.exports = {
  root: true,
  extends: ['@my-ai/eslint-config/nextjs'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
