export type IsAny<T> = 0 extends 1 & T ? true : false

export type IsNever<T> = [T] extends [never] ? true : false

export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false

export type Not<T> = T extends true ? false : true

export type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

export type ReplaceGeneratorWithAsyncGenerator<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends Generator<infer A, infer B, infer C>
    ? And<Not<IsNever<A>>, void extends B ? true : false> extends true
      ? AsyncGenerator<A, B, C>
      : And<IsNever<A>, void extends B ? false : true> extends true
        ? B
        : AsyncGenerator<A, B, C> | B
    : T[K] extends AsyncGenerator<infer A, infer B, infer C>
      ? And<Not<IsNever<A>>, void extends B ? true : false> extends true
        ? AsyncGenerator<A, B, C>
        : And<IsNever<A>, void extends B ? false : true> extends true
          ? B
          : AsyncGenerator<A, B, C> | B
      : T[K]
} & {}

export type NonEmptyArray<T> = [T, ...T[]]

export type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

export type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>
