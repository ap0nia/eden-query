import type { Transformer } from 'unified'

export type KnownConverter = 'yarn' | 'pnpm' | 'bun'

export type CustomConverter = [name: string, cb: (npmCode: string) => string]

export type Converter = CustomConverter | KnownConverter

export type RemarkNpmToYarnOptions = {
  sync?: boolean
  converters?: Converter[]
}

/**
 */
export function remarkNpmToYarn(options?: RemarkNpmToYarnOptions): Transformer
