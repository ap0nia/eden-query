import type { EdenRequestOptions } from './request'

/**
 * Configuration for Eden client. It can also be specified on a request to override the client's defaults.
 */
export type EdenConfig = Omit<EdenRequestOptions, 'domain'>
