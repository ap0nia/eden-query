import fs from 'node:fs'
import path from 'node:path'

export function isFileReadable(filename: string): boolean {
  try {
    // The "throwIfNoEntry" is a performance optimization for cases where the file does not exist
    if (!fs.statSync(filename, { throwIfNoEntry: false })) {
      return false
    }

    // Check if current process has read permission to the file
    fs.accessSync(filename, fs.constants.R_OK)

    return true
  } catch {
    return false
  }
}

export function findFilesRecursively(directory: string): string[] {
  return fs
    .readdirSync(directory)
    .map((name) => path.join(directory, name))
    .flatMap((fileOrDirectory) =>
      fs.statSync(fileOrDirectory).isDirectory()
        ? findFilesRecursively(fileOrDirectory)
        : fileOrDirectory,
    )
}
