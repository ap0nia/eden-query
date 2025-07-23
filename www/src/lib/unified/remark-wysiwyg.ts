import type { Plugin } from 'unified'

/**
 * Replaces consecutive newlines with <br />, which will be present in the resulting HAST.
 */
export const remarkWysiwyg = function () {
  const parser = this.parser

  if (parser) {
    this.parser = function (document, file) {
      const preprocessedDocument = document.replace(/\n{3,}/g, (match) => {
        return '\n\n' + '<br />\n\n'.repeat(match.length - 2)
      })

      file.value = preprocessedDocument

      return parser(preprocessedDocument, file)
    }
  }
} satisfies Plugin
