import { resolve } from 'path'

export type Format = 'es' | 'cjs' | 'iife'

export const packagesRoot = resolve(__dirname, '../../', 'packages')

export const buildConfigs: {
  [target: string]: {
    formats: (Format | { format: Format; output?: string })[]
    globalName?: string
  }
} = {
  cli: {
    formats: ['cjs'],
  },
  engine: {
    formats: ['es', 'cjs'],
  },
  inject: {
    formats: [
      {
        format: 'iife',
        output: resolve(packagesRoot, 'engine/inject/index.global.js'),
      },
    ],
    globalName: '__oopsTestInject',
  },
  marker: {
    formats: ['es', 'cjs'],
  },
}
