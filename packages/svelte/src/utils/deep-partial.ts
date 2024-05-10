/**
 * Makes the object recursively optional
 * @internal
 */
export type DeepPartial<TObject> = TObject extends object
  ? {
      [P in keyof TObject]?: DeepPartial<TObject[P]>
    }
  : TObject
