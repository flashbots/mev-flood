import path from 'path'
import fs from "fs/promises"

/** Creates a directory for deployments in the project root (which is 2 dirs above this binary) */
export const getDeploymentDir = (filename?: string) => {
    const dirPath = path.join(__dirname, '..', '..', 'deployments')
    fs.mkdir(dirPath, { recursive: true })
    return `${dirPath}${filename ? '/' + filename : ''}`
}
