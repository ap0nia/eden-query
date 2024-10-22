// @ts-check

/**
 * @type {import('@babel/core').ConfigFunction}
 */
function config(api) {
  api.cache.forever()

  return {
    presets: ['babel-preset-expo'],
  }
}

module.exports = config
