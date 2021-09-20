import { resolve } from 'path'
import replace from '@rollup/plugin-replace'
import { Plugin } from 'rollup'

export type Format = 'es' | 'cjs' | 'iife'

export const packagesRoot = resolve(__dirname, '../../', 'packages')

export const buildConfigs: {
  [target: string]: {
    formats: (Format | { format: Format; output?: string })[]
    globalName?: string
    banner?: string
    plugins?: Plugin[]
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
    plugins: [
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    ],
  },
  marker: {
    formats: ['es', 'cjs'],
  },
}
