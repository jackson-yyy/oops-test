import { resolve } from 'path'

export type Format = 'es' | 'cjs' | 'iife'

export const packagesRoot = resolve(__dirname, '../../', 'packages')

export const buildConfigs: {
  [target: string]: {
    formats: (Format | { format: Format; output?: string })[]
    globalName?: string
    banner?: string
  }
} = {
  cli: {
    formats: ['es'],
    banner: '#!/usr/bin/env node',
  },
  engine: {
    formats: ['es', 'cjs'],
  },
  inject: {
    formats: [
      {
        format: 'iife',
        output: resolve(packagesRoot, 'engine/inject/index.js'),
      },
    ],
    globalName: '__oopsTestInject',
  },
  marker: {
    formats: ['es', 'cjs'],
  },
}
