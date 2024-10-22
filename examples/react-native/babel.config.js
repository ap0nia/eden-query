// @ts-check

/**
 * @type {import('@babel/core').ConfigFunction}
 */
function config(api) {
  api.cache.forever()

  return {
    plugins: ['@babel/plugin-transform-class-static-block'],
    presets: ['babel-preset-expo'],
  }
}

module.exports = config
