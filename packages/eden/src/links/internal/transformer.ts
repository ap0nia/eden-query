/**
 * @see https://github.com/trpc/trpc/blob/next/packages/server/src/unstable-core-do-not-import/transformer.ts
 */

/**
 * Data-transformers share the same interface, but have different semantics depending
 * on where they are executed during a request.
 */
export type DataTransformer = {
  /**
   * Convert a raw value from the program into a JSON-serializable value.
   *
   * The raw JSON value needs to be a valid input into {@link JSON.stringify}.
   */
  serialize: (object: any) => any

  /**
   * Take a raw JSON value and convert it into the desired value to be used in the program.
   *
   * The raw JSON value can be anything returned from {@link JSON.parse}.
   */
  deserialize: (object: any) => any
}

interface InputDataTransformer extends DataTransformer {
  /**
   * This function runs **on the client** before sending the data to the server.
   *
   * This should return a JSON-serializable value, e.g. a string.
   */
  serialize: (object: any) => any

  /**
   * This function runs **on the server** to transform the data before it is passed to the resolver
   */
  deserialize: (object: any) => any
}

interface OutputDataTransformer extends DataTransformer {
  /**
   * This function runs **on the server** before sending the data to the client.
   *
   * This should return a JSON-serializable value, e.g. a string.
   */
  serialize: (object: any) => any

  /**
   * This function runs **only on the client** to transform the data sent from the server.
   */
  deserialize: (object: any) => any
}

export interface CombinedDataTransformer {
  /**
   * Specify how the data sent from the client to the server should be transformed.
   */
  input: InputDataTransformer
  /**
   * Specify how the data sent from the server to the client should be transformed.
   */
  output: OutputDataTransformer
}

export type DataTransformerOptions = CombinedDataTransformer | DataTransformer

const defaultTransformer: DataTransformer = {
  serialize: (value) => value,
  deserialize: (value) => value,
}

const defaultDataTransformer: CombinedDataTransformer = {
  input: defaultTransformer,
  output: defaultTransformer,
}

export function getDataTransformer(transformer?: DataTransformerOptions): CombinedDataTransformer {
  if (transformer == null) {
    return defaultDataTransformer
  }

  if ('serialize' in transformer) {
    return { input: transformer, output: transformer }
  }

  return transformer
}
