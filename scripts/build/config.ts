import { resolve } from 'path'
import replace from '@rollup/plugin-replace'
import { Plugin } from 'rollup'
import postcss from 'rollup-plugin-postcss'

export type Format = 'es' | 'cjs' | 'iife' | 'amd'

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
    globalName: '__oopsTest_inject',
    plugins: [
      styleInjectPlugin(),
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

/**
 * inject是iife，所以需要处理下，
 * 在DOMContentLoaded后再inject style
 *
 * @returns
 */
function styleInjectPlugin() {
  return postcss({
    inject(cssVariableName) {
      return `
      import styleInject from 'style-inject'
      document.addEventListener('DOMContentLoaded', () => {
        styleInject(${cssVariableName})
      })
      `
    },
    extensions: ['.css', '.less'],
    // @ts-ignore
    use: [['less', { javascriptEnabled: true }]],
  })
}
