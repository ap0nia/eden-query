// @ts-check

import { print } from 'esrap'
import MagicString from 'magic-string'
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { parse, preprocess } from 'svelte/compiler'
import { unified } from 'unified'
import { VFile } from 'vfile'

import {
  MDSX_BLUEPRINT_NAME,
  MDSX_COMPONENT_NAME,
  MDSX_FLOATING_COMPONENT_NAME,
} from './constants.js'
import { handlers } from './unified/handlers.js'
import { rehypeBlueprint, rehypeGetFloating, rehypeRenderCode } from './unified/rehype/index.js'
import { remarkCleanSvelte, remarkContainers, remarkGithubAlerts } from './unified/remark/index.js'
import { remarkNpmToYarn } from './unified/remark/remark-npm-to-yarn.js'
import { remarkCodeMeta } from './unified/remark-code-meta.js'
import { getGitTimestamp } from './utils/git.js'
import { getRelativeFilePath } from './utils/path.js'
import { parseFrontmatter } from './utils/yaml.js'

/**
 * Generate a string representing the `<script context="module">` part of a Svelte component.
 *
 * @param {*} ast
 * @param {VFile} file
 * @returns {string}
 *
 * @example
 * ```html
 * <script context="module">
 *   export const metadata = { title: '', description: '' }
 *   const { title, description } = metadata
 * </script>
 * ```
 */
function createSvelteModule(ast, file) {
  const matter = file.data.matter ?? {}

  const metadata = JSON.stringify(matter)
  const metadataKeys = Object.keys(matter)
  const processedAst = ast?.content ? print(ast.content) : undefined

  const exportStatement = `export const metadata = ${metadata};`
  const metadataDeclaration = `export const { ${metadataKeys.join(', ')} } = metadata;`
  const code = processedAst?.code ?? ''

  const lines = [exportStatement, metadataDeclaration, code]

  const content = `<script context="module">${lines.join('\n')}</script>`
  return content
}

/**
 * Generate a string representing the `<script>` part of a Svelte component.
 *
 * @param {*} ast
 * @param {VFile} file
 * @returns {string}
 */
function createSvelteInstance(ast, file) {
  const parsedAst = ast?.content ? print(ast.content) : undefined
  const code = parsedAst?.code ?? ''

  const lines = ['<script>', code]

  // TODO: add an option to append arbitrary content to the generated Svelte file.
  lines.push('import "virtual:group-icons.css";')

  if (file.data.blueprint) {
    const importPath = getRelativeFilePath(file.path, file.data.blueprint.path)
    const hasDefaultExport = file.data.components?.includes('default')
    const defaultImport = hasDefaultExport ? `${MDSX_BLUEPRINT_NAME},` : ''
    const blueprintImportStatement = `\timport ${defaultImport} * as ${MDSX_COMPONENT_NAME} from "${importPath}";`

    lines.push(blueprintImportStatement)

    // Automatically add all capital imports to the main scope, e.g. custom components.
    const namedImports = file.data.components
      ?.filter((name) => name !== 'default')
      .filter((name) => name[0] && /[A-Z]/.test(name[0]))

    if (namedImports?.length) {
      const namedImportStatements = namedImports.join(', ')
      const namedImportStatement = `\timport {${namedImportStatements}} from "${importPath}";`

      lines.push(namedImportStatement)
    }
  }

  if (file.data.floating) {
    const floatingImportStatement = `\timport * as ${MDSX_FLOATING_COMPONENT_NAME} from '$lib/mdsx/floating-renderer-svelte-components/index';`

    lines.push(floatingImportStatement)
  }

  lines.push('</script>')

  const content = lines.join('\n')
  return content
}

/**
 * @param {VFile} file
 * @param {import('./index').MdsxPreprocessorConfig} config
 */
function getBlueprintData(file, config) {
  if (!config?.blueprints) return

  const blueprintName = file.data.matter?.['blueprint'] ?? 'default'

  if (blueprintName === false) return

  if (typeof blueprintName !== 'string') {
    throw new Error(`The "blueprint" name in the frontmatter must be a string in "${file.path}"`)
  }

  const blueprint = config.blueprints[blueprintName]

  if (blueprint == null) {
    const allBluePrints = JSON.stringify(config.blueprints, null, 2)
    throw Error(`"${blueprintName}" was not found in the provided blueprints, ${allBluePrints}`)
  }

  Object.assign(blueprint, { name: blueprintName, unified: blueprint.unified })

  return blueprint
}

/**
 * @param {Parameters<import('./index').MarkupPreprocessor>[0]} options
 * @param {import('./index').MdsxPreprocessorConfig} config
 * @returns {Promise<import('svelte/compiler').Processed>}
 */
export async function compile(options, config) {
  const source = options.filename ?? ''

  const filename = source

  /**
   * @type import('vfile').Data
   */
  const data = {
    dependencies: [],
    instance: null,
    matter: {},
    preprocessors: [],
    components: [],
    ...config,
  }

  const file = new VFile({ value: options.content, path: source, data })

  const frontmatter = parseFrontmatter(file, config.frontmatterParser)

  file.data['matter'] = frontmatter.matter

  file.data['matter']['content'] = options.content

  if (frontmatter.value) {
    file.value = frontmatter.value
  }

  file.data['matter']['lastUpdated'] = await getGitTimestamp(filename)

  const blueprint = getBlueprintData(file, config)

  /**
   * @type import('./index').AnyProcessor
   */
  // First, use all the core remark plugins.
  let processor = unified()
    .use(remarkParse)
    .use(remarkCleanSvelte)
    .use(remarkNpmToYarn)
    .use(remarkDirective)
    .use(remarkContainers)
    .use(remarkGithubAlerts)
    .use(remarkGfm)
    .use(remarkCodeMeta)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      handlers: /** @type import('mdast-util-to-hast').Handlers */ (handlers),
    })

  // User can add or override the processor as desired.

  processor = (await config.unified?.(processor, config)) ?? processor

  if (blueprint) {
    data.dependencies?.push(blueprint.path)
    data.blueprint = blueprint
    processor = (await blueprint.unified?.(processor, config)) ?? processor
  }

  const preprocessors = config.preprocessors ?? []

  // Finally, use all the core rehype plugins.
  processor = processor
    .use(rehypeRenderCode)
    .use(rehypeBlueprint)
    .use(rehypeGetFloating)
    .use(rehypeStringify, { allowDangerousHtml: true })

  const processed = await processor.process(file)

  const { code, dependencies } = await preprocess(String(processed), preprocessors, { filename })

  if (dependencies) {
    data.dependencies?.push(...dependencies)
  }

  const parsed = parse(code)

  const s = new MagicString(code)

  if (blueprint == null) {
    /**
     * @type import('svelte/compiler').Processed
     */
    const compiled = {
      code: s.toString(),
      map: s.generateMap({ source }),
      dependencies: Array.from(new Set(data.dependencies)),
    }

    return compiled
  }

  // Remove existing svelte instance script.
  if (parsed['instance']) {
    s.remove(parsed['instance'].start, parsed['instance'].end)
  }

  // Remove existing svelte module script
  if (parsed['module']) {
    s.remove(parsed['module'].start, parsed['module'].end)
  }

  // Prepend styles first, overriding any existing styles.
  if (parsed['css']) {
    s.remove(parsed['css'].start, parsed['css'].end)
    const cssContent = s.original.substring(parsed['css'].start, parsed['css'].end)
    s.prepend(cssContent)
  }

  if (data.components?.includes('default')) {
    const props = blueprint.props ?? {}

    // Wrap script with blueprint.
    s.prepend(`<${MDSX_BLUEPRINT_NAME} {metadata} {...${JSON.stringify(props)}}>\n`)
    s.append(`</${MDSX_BLUEPRINT_NAME}>\n`)
  }

  // Prepend new svelte instance script.
  const svelteInstance = createSvelteInstance(parsed['instance'], file)
  s.prepend(svelteInstance)

  // Prepend new svelte module script.
  const svelteModule = createSvelteModule(parsed['module'], file)
  s.prepend(svelteModule)

  /**
   * @type import('svelte/compiler').Processed
   */
  const compiled = {
    code: s.toString(),
    map: s.generateMap({ source }),
    dependencies: Array.from(new Set(data.dependencies)),
  }

  return compiled
}
