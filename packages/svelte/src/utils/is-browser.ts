/**
 * Determines whether the current environment is a browser or not.
 *
 * @see https://github.com/react-hook-form/react-hook-form/blob/master/src/utils/isWeb.ts
 */
export function isBrowser() {
  return (
    typeof window !== 'undefined' &&
    typeof window.HTMLElement !== 'undefined' &&
    typeof document !== 'undefined'
  )
}
