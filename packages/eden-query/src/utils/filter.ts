/**
 * Filter route endpoints that support the specified methods.
 *
 * @example
 * type Routes = {
 *   index: {
 *     get: {
 *       body: unknown;
 *       params: {
 *         hello: string;
 *       };
 *       query: unknown;
 *       headers: unknown;
 *       response: {
 *         200: string;
 *       };
 *     post: {
 *       body: unknown;
 *       params: {
 *         hello: string;
 *       };
 *       query: unknown;
 *       headers: unknown;
 *       response: {
 *         200: string;
 *       };
 *     };
 *   };
 *   hello: {
 *     post: {
 *       body: unknown;
 *       params: {
 *         hello: string;
 *       };
 *       query: unknown;
 *       headers: unknown;
 *       response: {
 *         200: string;
 *       };
 *     };
 *   }
 * };
 *
 * Filtering for "get" methods will only return the "index" route.
 * Filtering for "post" methods will return both the "index" and "hello" routes.
 */
export type Filter<T extends Record<string, any>, TInclude extends string> = {
  [K in keyof T as TInclude extends keyof T[K] ? K : never]: T[K]
}
