import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { Case } from '../types'

export function createDir(paths: string | string[]) {
  if (typeof paths === 'string') {
    paths = [paths]
  }
  paths.forEach(path => {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true })
    }
  })
}

export function writeJson(cas: Case, output: string) {
  writeFileSync(output, JSON.stringify(cas, null, 2), { flag: 'a+' })
}

export function readJson<T extends Record<string, any>>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8'))
}
