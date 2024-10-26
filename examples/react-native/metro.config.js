// @ts-check

const path = require('path')
const { makeMetroConfig } = require('@rnx-kit/metro-config')
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks')
const { getDefaultConfig } = require('expo/metro-config')

function defineConfig() {
  const projectRoot = __dirname

  const workspaceRoot = path.resolve(projectRoot, '../..')

  const defaultConfig = getDefaultConfig(projectRoot)

  const config = makeMetroConfig(defaultConfig)

  if (config.resolver) {
    // #1 - Watch all files in the monorepo
    config.watchFolders = [workspaceRoot]

    // #2 - Try resolving with project modules first, then workspace modules
    config.resolver.nodeModulesPaths = [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ]

    // #3 - Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
    config.resolver.disableHierarchicalLookup = true

    // #4 - Add symlink resolver from rnx-kit
    config.resolver.resolveRequest = MetroSymlinksResolver({
      remapModule: (_context, moduleName, _platform) => {
        // For some reason, there is a "util" module that does not get resolved properly because of a cycle...
        return moduleName === 'util' ? 'node:util' : moduleName
      },
    })
  }

  return config
}

module.exports = defineConfig
