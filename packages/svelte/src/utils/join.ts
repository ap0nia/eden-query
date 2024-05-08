export type Stringable = number | string | boolean

export type Join<
  T extends any[],
  TSeparator extends string = '',
  TResult extends string = '',
> = T extends [infer Head extends Stringable, ...infer Tail]
  ? TResult extends ''
    ? Join<Tail, TSeparator, `${Head}`>
    : Join<Tail, TSeparator, `${TResult}${TSeparator}${Head}`>
  : TResult
