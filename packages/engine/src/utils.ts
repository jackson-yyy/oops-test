import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { chromium, firefox, webkit } from 'playwright'
import { BrowserName, Case, Signal } from './types'

let uuid = 1000
export function getUuid() {
  return (++uuid).toString()
}

export function getBrowser(browser: BrowserName) {
  return {
    chromium,
    firefox,
    webkit,
  }[browser]
}

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

export function formatSignals(signals: Signal[]): Partial<Record<Signal['name'], Omit<Signal, 'name'>>> {
  return signals.reduce((res, signal) => {
    // eslint-disable-next-line no-unused-vars
    const { name, ...params } = signal
    res[signal.name] = params
    return res
  }, {})
}
