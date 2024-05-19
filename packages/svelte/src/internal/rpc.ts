/* eslint-disable @typescript-eslint/no-namespace */

/**
 * JSON-RPC 2.0 Specification
 *
 * @see https://github.com/trpc/trpc/blob/db2ec5cae339cabd8dfa19bdc1d596214568d205/packages/server/src/unstable-core-do-not-import/rpc/envelopes.ts#L17
 */
export namespace JSONRPC2 {
  export type RequestId = number | string | null

  /**
   * All requests/responses extends this shape
   */
  export interface BaseEnvelope {
    id?: RequestId
    jsonrpc?: '2.0'
  }

  export interface ResultResponse<TResult = unknown> extends BaseEnvelope {
    result: TResult
  }
}
