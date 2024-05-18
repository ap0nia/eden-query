import type { Enumerate } from './enumerate'

export type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>
