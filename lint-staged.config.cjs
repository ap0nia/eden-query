/**
 * @type {import('lint-staged').Config}
 */
const config = {
  '*.?(c|m){js,ts}?(x)': ['eslint --quiet --fix', 'prettier --write'],
  '*.{css,json,yaml,yml}': ['prettier --write'],
}

module.exports = config
