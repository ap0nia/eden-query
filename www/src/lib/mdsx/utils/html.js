// @ts-check

/**
 * Character RegEx strings mapped to HTML entities.
 *
 * Use the keys to create a global {@link RegExp} object for matching.
 */
export const HTML_ENTITIES = {
  '\\{': '&#123;',
  '\\}': '&#125;',
  '\\<': '&#60;',
  '\\>': '&#62;',
  '`': '&#96;',
  '\\\\': '&#92;',
}

/**
 * Array of tuples containing a RegExp and the HTML entity replacement.
 */
export const htmlEntityReplacements = Object.entries(HTML_ENTITIES).map(([key, value]) => {
  const regex = new RegExp(key, 'g')
  return /** @type const */ ([regex, value])
})

/**
 * Replace all special sequences with their respective HTML entity.
 *
 * @param {string} str
 */
export function escapeHtmlEntities(str) {
  let result = str

  for (const [original, replacement] of htmlEntityReplacements) {
    result = result.replace(original, replacement)
  }

  return result
}
