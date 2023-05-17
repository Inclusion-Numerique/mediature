module.exports = {
  root: true,
  ignorePatterns: ['dist', 'prisma/generated-for-inspiration', 'src/fixtures/mailjet/mailjet-real-email.html', 'src/**/*.docx'],
  extends: ['custom'],
  plugins: ['jsx-a11y', 'testing-library'],
  overrides: [
    // Only uses Testing Library lint rules in test files
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
    },
  ],
};
