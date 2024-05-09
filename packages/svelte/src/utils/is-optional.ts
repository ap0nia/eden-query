export type IsOptional<T, K extends keyof T> = T[K] extends Required<T>[K] ? false : true
