import type { IsAny } from './is-any'

export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false
