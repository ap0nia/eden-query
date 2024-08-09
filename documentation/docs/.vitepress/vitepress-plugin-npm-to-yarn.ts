import convert from 'npm-to-yarn'
import { nanoid } from 'nanoid'
import type { MarkdownRenderer } from 'vitepress'

export const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun']

export type PackageManager = Parameters<typeof convert>[1]

/**
 * The key after the language of the code block that's used to activate this plugin.
 *
 * @example
 *
 * ```sh {NPM_TO_YARN_KEY}
 * ```
 */
export const NPM_TO_YARN_KEY = 'npm2yarn'

function extractPackageManager(content: string): PackageManager {
  const trimmedContent = content.trim()

  if (trimmedContent.includes('yarn')) {
    return 'yarn'
  }

  if (trimmedContent.includes('pnpm')) {
    return 'pnpm'
  }

  if (trimmedContent.includes('bun')) {
    return 'bun'
  }

  return 'npm'
}

/**
 * Known converters are indicated by their name. i.e. the actual name of the package manager.
 */
type KnownConverter = PackageManager

/**
 * Custom converters can be provided that translate an NPM command.
 */
type CustomConverter = [name: string, cb: (npmCommand: string) => string]

/**
 */
type Converter = CustomConverter | KnownConverter

function createCodeGroupLabel(id: string, checked: boolean, group: string, title: string): string {
  return [
    `<input type="radio" name="group-${group}" id="tab-${id}" ${checked ? 'checked' : ''}>`,
    `  <label for="tab-${id}">${title}`,
    `</label>`,
  ].join('\n')
}

export type NpmToYarnOptions = {
  /**
   * Whether to sync?
   */
  sync?: boolean

  /**
   * All converters.
   *
   * @default {@link PACKAGE_MANAGERS}
   */
  converters?: Converter[]
}

/**
 * Good reference for npm2yarn and tab syncing:
 * @see https://github.com/sapphi-red/vitepress-plugins
 */
export function npmToYarn(options?: NpmToYarnOptions) {
  /**
   * If all the tabs should be synced, then establish a global group ID.
   * Leave it undefined and make a new group for each `npm2yarn` instance otherwise.
   *
   * @todo Synchronization. Docusaurus uses localstorage...
   */
  // const syncedGroup = options?.sync ? nanoid(7) : undefined

  const plugin = (md: MarkdownRenderer) => {
    const fence = md.renderer.rules.fence

    md.renderer.rules.fence = (...args) => {
      const [tokens, idx, ...rest] = args

      const currentToken = tokens[idx]

      // Ignore this code block because it's missing the key.

      if (currentToken == null || !currentToken.info.includes(NPM_TO_YARN_KEY)) {
        return fence?.(tokens, idx, ...rest) ?? ''
      }

      const converters = options?.converters ?? PACKAGE_MANAGERS

      /**
       * If all tabs should be synced, then use a shared group, otherwise create a new one.
       */
      const group = nanoid(7)

      const codeGroupLabels = converters
        .map((converter, index) => {
          const id = nanoid(5)
          const checked = index === 0
          const title = typeof converter === 'string' ? converter : converter[0]
          return createCodeGroupLabel(id, checked, group, title)
        })
        .join('\n')

      const currentPackageManager = extractPackageManager(currentToken.content)

      /**
       * Ensure that the command is translated in NPM.
       */
      const npmCommand =
        currentPackageManager === 'npm'
          ? currentToken.content
          : convert(currentToken.content, 'npm')

      const codeGroupBlocks = converters
        .map((converter) => {
          const translatedCommand =
            typeof converter === 'string'
              ? convert(npmCommand, converter)
              : converter[1](npmCommand)
          currentToken.content = translatedCommand
          const markup = fence?.(tokens, idx, ...rest) ?? ''
          return markup
        })
        .join('\n')

      return [
        `<div class="vp-code-group vp-adaptive-theme">`,
        `  <div class="tabs">${codeGroupLabels}</div>`,
        `  <div class="blocks">${codeGroupBlocks}</div>`,
        `</div>`,
      ].join('\n')
    }
  }

  return plugin
}
