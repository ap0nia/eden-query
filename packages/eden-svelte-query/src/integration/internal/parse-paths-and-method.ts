import { isHttpMethod } from '@ap0nia/eden'

/**
 * The result of parsing a paths array.
 */
export type ParsedPathAndMethod = {
  /**
   * Array of path segments that make up the path.
   *
   * @example ['api', 'hello', 'index', 'get'] -> ['api', 'hello', 'index']
   */
  paths: string[]

  /**
   * The (absolute) path represented as a single string.
   *
   * @example ['api', 'hello', 'index', 'get'] ->'/api/hello/index'
   */
  path: string

  /**
   * The method from the original paths array, if found.
   *
   * @example ['api', 'hello', 'index', 'get'] -> 'get'
   */
  method?: string
}

/**
 * Given an array of path segments, where the last segment is possibly a method,
 * parse it into proper labels.
 *
 * @example
 *
 * const originalPaths = ['api', 'hello', 'index', 'get']
 *
 * const path = '/api/hello/index'
 *
 * const method = 'get'
 */
export function parsePathsAndMethod(
  originalPaths: string[] | readonly string[],
): ParsedPathAndMethod {
  /**
   * Don't mutate the original array.
   */
  const paths = [...originalPaths]

  /**
   * This may be the method, or part of a route.
   *
   * e.g. since invalidations can be partial and not include it.
   *
   * @example
   *
   * Let there be a GET endpoint at /api/hello/world
   *
   * GET request to /api/hello/world -> paths = ['api', 'hello', 'world', 'get']
   *
   * Invalidation request for all routes under /api/hello -> paths = ['api', 'hello']
   *
   * In the GET request, the last item is the method and can be safely popped.
   * In the invalidation, the last item is actually part of the path, so it needs to be preserved.
   */
  const lastSegment = originalPaths[originalPaths.length - 1]

  const lastSegmentIsHttpMethod = isHttpMethod(lastSegment)

  /**
   * If the last segment is an HTTP method, it's not part of the final path
   * and should be removed before determining the path.
   */
  if (lastSegmentIsHttpMethod) {
    paths.pop()
  }

  const path = '/' + paths.join('/')

  const result: ParsedPathAndMethod = { paths, path }

  if (lastSegmentIsHttpMethod) {
    result.method = lastSegment
  }

  return result
}
