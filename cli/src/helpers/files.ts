import path from 'node:path'
import fs from 'node:fs/promises'

/**
 * Creates a directory for deployments in the project root (which is 2 dirs above this binary).
 *
 * @param filename Optional filename to append to the directory path.
 * @returns The path to the deployments directory, or path to file if `filename` is specified.
 */
export const getDeploymentDir = (filename?: string): string => {
  const dirPath = path.join(__dirname, '..', '..', 'deployments')
  fs.mkdir(dirPath, {recursive: true})
  return `${dirPath}${filename ? '/' + filename : ''}`
}
