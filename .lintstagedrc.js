const config = {
  '**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md,css}': ['prettier --write'],
};

module.exports = config;
