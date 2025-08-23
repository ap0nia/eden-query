import fs from 'node:fs/promises'
import path from 'node:path'

import { RSPRESS_TEMP_DIR, UserConfig } from '@rspress/shared'

import { PluginDriver } from './src/lib/rspress/node/PluginDriver'
import { RouteService } from './src/lib/rspress/node/route/RouteService'
import { createSiteData } from './src/lib/rspress/node/runtimeModule/siteData/createSiteData'

const config: UserConfig = {
  mediumZoom: false,
}

const cwd = process.cwd()

const root = undefined

function resolveDocRoot(cwd: string, cliRoot?: string, configRoot?: string): string {
  // CLI root has highest priority
  if (cliRoot) {
    return path.join(cwd, cliRoot)
  }

  // Config root is next in priority
  if (configRoot) {
    return path.isAbsolute(configRoot) ? configRoot : path.join(cwd, configRoot)
  }

  // Default to 'docs' if no root is specified
  return path.join(cwd, 'docs')
}

config.root = resolveDocRoot(cwd, root, config.root)

/**
 * @see https://github.com/web-infra-dev/rspress/blob/393629437aac6fecb3fec37a13c08767e03b67db/packages/core/src/cli/index.ts#L114C3-L114C36
 *
 * @see https://github.com/web-infra-dev/rspress/blob/393629437aac6fecb3fec37a13c08767e03b67db/packages/core/src/node/build.ts#L54
 *
 * @see https://github.com/web-infra-dev/rspress/blob/393629437aac6fecb3fec37a13c08767e03b67db/packages/core/src/node/build.ts#L24
 */
const docDirectory = config.root

/**
 * @see https://github.com/web-infra-dev/rspress/blob/393629437aac6fecb3fec37a13c08767e03b67db/packages/core/src/node/initRsbuild.ts#L424
 */
const rootDir = docDirectory

const configFilePath = ''

const pluginDriver = new PluginDriver(config, configFilePath, true)

await pluginDriver.init()

// const modifiedConfig = await pluginDriver.modifyConfig()

// const ssgConfig = Boolean(modifiedConfig.ssg ?? true)

const runtimeTempDir = path.join(RSPRESS_TEMP_DIR, 'runtime')

const runtimeAbsTempDir = path.join(cwd, 'node_modules', runtimeTempDir)

await fs.mkdir(runtimeAbsTempDir, { recursive: true })

const userDocRoot = path.resolve(rootDir || config?.root || cwd)

const routeService = await RouteService.create({
  config: config,
  runtimeTempDir: runtimeAbsTempDir,
  scanDir: userDocRoot,
  pluginDriver,
})

/**
 * @see https://github.com/web-infra-dev/rspress/blob/393629437aac6fecb3fec37a13c08767e03b67db/packages/core/src/node/runtimeModule/siteData/rsbuildPlugin.ts#L24
 */
const siteData = await createSiteData({
  config,
  alias: {}, // alias as Record<string, string>,
  userDocRoot,
  routeService,
  pluginDriver,
})

console.log({ routeService, siteData, ok: siteData.siteData.pages })
