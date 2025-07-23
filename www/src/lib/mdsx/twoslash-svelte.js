/**
 * Based on the open PR to twoslash.
 *
 * @see https://github.com/twoslashes/twoslash/pull/57
 */

// @ts-check

import { decode } from '@jridgewell/sourcemap-codec'
import { SourceMap } from '@volar/language-core'
import { svelte2tsx } from 'svelte2tsx'
import {
  createTwoslasher as _createTwoSlasher,
  defaultCompilerOptions,
  defaultHandbookOptions,
  findFlagNotations,
  findQueryMarkers,
} from 'twoslash'
import { createPositionConverter, removeCodeRanges, resolveNodePositions } from 'twoslash-protocol'
import ts from 'typescript'

import { notNull } from './utils/null.js'

const svelte2tsxFiles = ['svelte-jsx', 'svelte-jsx-v4', 'svelte-shims', 'svelte-shims-v4']

/**
 * Create a twoslasher instance that add additional support for Svelte
 *
 * @type {import('./twoslash-svelte').createTwoslasher}
 */
export function createTwoslasher(createOptions = {}) {
  const _twoslasher = _createTwoSlasher(createOptions)

  const nodeModules = createOptions.nodeModules ?? '../node_modules'

  /**
   * @param {string} code
   * @param {string} [extension] extension
   * @param {import('twoslash').TwoslashExecuteOptions} [options={}]
   */
  function twoslasher(code, extension, options = {}) {
    if (extension !== 'svelte') {
      return _twoslasher(code, extension, options)
    }

    /**
     * @type ts.CompilerOptions
     */
    const compilerOptions = {
      ...defaultCompilerOptions,
      ...options.compilerOptions,
    }

    /**
     * @type import('twoslash').HandbookOptions
     */
    const handbookOptions = {
      ...defaultHandbookOptions,
      noErrorsCutted: true,
      ...options.handbookOptions,
    }

    /**
     * @type Pick<import('twoslash').TwoslashReturnMeta, 'positionQueries' | 'positionCompletions' | 'positionHighlights' | 'removals'>
     */
    const meta = {
      removals: [],
      positionCompletions: [],
      positionQueries: [],
      positionHighlights: [],
    }

    const pc = createPositionConverter(code)

    const sourceMeta = findQueryMarkers(code, meta, pc)

    const customTags = options.customTags ?? createOptions.customTags ?? []

    /**
     * @type import('twoslash').CompilerOptionDeclaration[]
     */
    const optionDeclarations = /**@type any */ (ts).optionDeclarations

    const flagNotations = findFlagNotations(code, customTags, optionDeclarations)

    // #region apply flags
    for (const flag of flagNotations) {
      switch (flag.type) {
        case 'unknown': {
          continue
        }
        case 'compilerOptions': {
          compilerOptions[flag.name] = flag.value
          break
        }
        case 'handbookOptions': {
          handbookOptions[/** @type {never} */ (flag.name)] = /** @type {never} */ (flag.value)
          break
        }
      }
      sourceMeta.removals.push([flag.start, flag.end])
    }

    let strippedCode = code
    for (const [start, end] of sourceMeta.removals) {
      strippedCode =
        strippedCode.slice(0, start) +
        strippedCode.slice(start, end).replace(/\S/g, ' ') +
        strippedCode.slice(end)
    }

    const compiled = svelte2tsx(strippedCode)

    const map = generateSourceMap(strippedCode, compiled.code, compiled.map.mappings)

    /**
     * @param {number} pos
     */
    function getLastGeneratedOffset(pos) {
      const offsets = [...map.toGeneratedLocation(pos)]
      if (!offsets.length) return undefined
      return offsets[offsets.length - 1]?.[0]
    }

    const types = svelte2tsxFiles.map((file) => {
      return `${nodeModules}/svelte2tsx/${file}`
    })

    const result = _twoslasher(compiled.code, 'tsx', {
      ...options,
      compilerOptions: {
        types,
        ...compilerOptions,
      },
      handbookOptions: {
        ...handbookOptions,
        keepNotations: true,
      },
      positionCompletions: sourceMeta.positionCompletions
        .map(getLastGeneratedOffset)
        .filter(notNull),

      positionQueries: sourceMeta.positionQueries
        .map((p) => get(map.toGeneratedLocation(p), 0)?.[0])
        .filter(notNull),

      positionHighlights: sourceMeta.positionHighlights
        .map(([start, end]) => [
          get(map.toGeneratedLocation(start), 0)?.[0],
          get(map.toGeneratedLocation(end), 0)?.[0],
        ])
        .filter(isNumberPair),
    })

    if (createOptions.debugShowGeneratedCode) {
      return result
    }

    // Map the tokens
    const mappedNodes = result.nodes
      .map((node) => {
        if ('text' in node && node.text === 'any') {
          return undefined
        }
        const startMap = get(map.toSourceLocation(node.start), 0)
        if (!startMap) {
          return undefined
        }
        const start = startMap[0]
        let end = get(map.toSourceLocation(node.start + node.length), 0)?.[0]
        if (end == null && startMap[1].sourceOffsets[0] === startMap[0]) {
          end = startMap[1].sourceOffsets[1]
        }
        if (end == null || start < 0 || end < 0 || start > end) {
          return undefined
        }
        return {
          ...node,
          target: code.slice(start, end),
          start: startMap[0],
          length: end - start,
        }
      })
      .filter((value) => value != null)

    const mappedRemovals = [
      ...sourceMeta.removals,
      ...result.meta.removals
        .map((r) => {
          const start =
            get(map.toSourceLocation(r[0]), 0)?.[0] ?? code.match(/(?<=<script[\s\S]*>\s)/)?.index

          const end = get(map.toSourceLocation(r[1]), 0)?.[0]

          if (start == null || end == null || start < 0 || end < 0 || start >= end) {
            return undefined
          }

          return /** @type import('twoslash').Range */ ([start, end])
        })
        .filter((value) => value != null),
    ]

    if (!options.handbookOptions?.keepNotations) {
      const removed = removeCodeRanges(code, mappedRemovals, mappedNodes)
      result.code = removed.code
      result.meta.removals = removed.removals
      result.nodes = resolveNodePositions(removed.nodes, result.code)
    } else {
      result.meta.removals = mappedRemovals
    }
    result.nodes = result.nodes.filter((node, index) => {
      const next = result.nodes[index + 1]
      if (!next) {
        return true
      }
      // When multiple nodes are on the same position, we keep the last one by ignoring the previous ones
      if (next.type === node.type && next.start === node.start) {
        return false
      }
      return true
    })
    result.meta.extension = 'svelte'
    return result
  }

  twoslasher.getCacheMap = _twoslasher.getCacheMap

  return twoslasher
}

/**
 * @param {string} sourceCode
 * @param {string} generatedCode
 * @param {string} encodedMappings
 * @returns {SourceMap}
 */
function generateSourceMap(sourceCode, generatedCode, encodedMappings) {
  const sourcePositionConverter = createPositionConverter(generatedCode)
  const generatedPositionConverter = createPositionConverter(sourceCode)
  const decodedMappings = decode(encodedMappings)

  /**
   * @type {import('@volar/language-core').CodeMapping[]}
   */
  const mappings = []

  /**
   * @type {{ genOffset: number, sourceOffset: number } | undefined}
   */
  let current = undefined

  for (let i = 0; i < decodedMappings.length; ++i) {
    const line = decodedMappings[i]

    if (line == null) continue

    for (const segment of line) {
      const genCharacter = segment[0]

      const genOffset = sourcePositionConverter.posToIndex(i, genCharacter)

      if (!current) {
        if (segment[2] !== undefined && segment[3] !== undefined) {
          const sourceOffset = generatedPositionConverter.posToIndex(segment[2], segment[3])

          current = {
            genOffset,
            sourceOffset,
          }
        }

        continue
      }

      let length = genOffset - current.genOffset

      const sourceText = sourceCode.substring(current.sourceOffset, current.sourceOffset + length)

      const genText = generatedCode.substring(current.genOffset, current.genOffset + length)

      if (sourceText !== genText) {
        length = 0

        for (let i = 0; i < genOffset - current.genOffset; i++) {
          if (sourceText[i] === genText[i]) {
            length = i + 1
          } else {
            break
          }
        }
      }

      if (length > 0) {
        const lastMapping = mappings.length ? mappings[mappings.length - 1] : undefined

        if (lastMapping != null && isAtEndOfCodeMapping(current, lastMapping)) {
          lastMapping.lengths[0] ??= 0
          lastMapping.lengths[0] += length
        } else {
          mappings.push({
            sourceOffsets: [current.sourceOffset],
            generatedOffsets: [current.genOffset],
            lengths: [length],
            data: {
              verification: true,
              completion: true,
              semantic: true,
              navigation: true,
              structure: true,
              format: false,
            },
          })
        }
      }

      current = undefined

      if (segment[2] !== undefined && segment[3] !== undefined) {
        const sourceOffset = generatedPositionConverter.posToIndex(segment[2], segment[3])

        current = {
          genOffset,
          sourceOffset,
        }
      }
    }
  }
  return new SourceMap(mappings)
}

/**
 * @param {(number | undefined)[]} value
 * @returns {value is [number, number]}
 */
function isNumberPair(value) {
  return value[0] != null && value[1] != null
}

/**
 * @template T
 *
 * @param {IterableIterator<T> | Generator<T>} iterator
 * @param {number} index
 * @returns {T | undefined}
 */
function get(iterator, index) {
  for (const item of iterator) {
    if (index-- === 0) return item
  }
  return undefined
}

/**
 * Not sure what this does, just needed a named function...
 *
 * @param {{ genOffset: number, sourceOffset: number }} current
 * @param {import('@volar/language-core').CodeMapping} previous
 * @returns {boolean}
 */
function isAtEndOfCodeMapping(current, previous) {
  if (previous == null) return false

  const lastLength = previous.lengths[0]
  const lastGeneratedOffset = previous.generatedOffsets[0]
  const lastSourceOffset = previous.sourceOffsets[0]

  if (lastLength == null || lastGeneratedOffset == null || lastSourceOffset == null) return false

  return (
    lastGeneratedOffset + lastLength === current.genOffset &&
    lastSourceOffset + lastLength === current.sourceOffset
  )
}

export default createTwoslasher
