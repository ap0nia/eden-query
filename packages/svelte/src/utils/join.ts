export type Stringable = number | string | boolean

export type Join<
  T extends any[],
  TSeparator extends string = '',
  TStart extends string = '',
  TResult extends string = '',
> = T extends [infer Head extends Stringable, ...infer Tail]
  ? TResult extends ''
    ? Join<Tail, TSeparator, TStart, `${TStart}${Head}`>
    : Join<Tail, TSeparator, TStart, `${TResult}${TSeparator}${Head}`>
  : TResult
