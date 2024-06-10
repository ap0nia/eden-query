/**
 * @public
 */
export type DataTransformer = {
  serialize: (object: any) => any
  deserialize: (object: any) => any
}

interface InputDataTransformer extends DataTransformer {
  /**
   * This function runs **on the client** before sending the data to the server.
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
   */
  serialize: (object: any) => any
  /**
   * This function runs **only on the client** to transform the data sent from the server.
   */
  deserialize: (object: any) => any
}

/**
 * @public
 */
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

export function getDataTransformer(
  transformer?: DataTransformerOptions,
): CombinedDataTransformer | undefined {
  if (transformer == null) return undefined

  if ('serialize' in transformer) {
    return { input: transformer, output: transformer }
  }

  return transformer
}
