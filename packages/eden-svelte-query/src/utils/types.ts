/**
 * Makes the object recursively optional
 * @internal
 */
export type DeepPartial<TObject> = TObject extends object
  ? {
      [P in keyof TObject]?: DeepPartial<TObject[P]>
    }
  : TObject

/**
 * Omits the key without removing a potential union
 * @internal
 */
export type DistributiveOmit<TObj, TKey extends keyof any> = TObj extends any
  ? Omit<TObj, TKey>
  : never

/**
 * @internal
 */
export type IntersectionError<TKey extends string> =
  `The property '${TKey}' in your router collides with a built-in method, rename this router or procedure on your backend.`

/**
 * @internal
 */
export type ProtectedIntersection<TType, TWith> = keyof TType & keyof TWith extends never
  ? TType & TWith
  : IntersectionError<string & keyof TType & keyof TWith>

/**
 * Simple utility that overrides top level properties from `T` with the matching properties from `U`.
 */
export type Override<T, U> = Omit<T, keyof U> & U
