import { readdirSync, statSync } from 'fs'
import { resolve } from 'path'
import * as fs from 'fs-extra'
import { OutputOptions, rollup, RollupOptions } from 'rollup'
import chalk from 'chalk'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import typescript from 'rollup-plugin-typescript2'
// import flatDts from 'rollup-plugin-flat-dts'
// import { terser } from 'rollup-plugin-terser'

type Format = 'esm-bundler' | 'cjs' | 'global'

const packagesRoot = resolve(__dirname, '../../', 'packages')

export function getAllTargets() {
  return readdirSync(packagesRoot).filter(
    target => statSync(resolve(packagesRoot, target)).isDirectory() && !getPkgContent(target)?.private,
  )
}

export function getPkgContent(target: string): Record<string, any> {
  return require(resolve(packagesRoot, target, 'package.json'))
}

export function getOutputDir(target: string) {
  const pkgContent = getPkgContent(target)
  return (pkgContent.main || pkgContent.module).split('/')[0]
}

export function getInputConfigs(target = '', config: RollupOptions = {}) {
  const pkgRoot = resolve(packagesRoot, target)
  const pkg = getPkgContent(target)
  const { plugins = [], ...others } = config
  return {
    input: resolve(pkgRoot, 'src/index.ts'),
    external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts', '.tsx', '.vue'],
      }),
      commonjs(),
      typescript({
        tsconfigOverride: {
          include: [`${pkgRoot}/src/**/*`],
        },
      }),
      ...plugins,
      // terser(),
      filesize(),
    ],
    ...others,
  }
}

export function getOutputConfigs(target = '', format: Format, globalName?: string) {
  const pkg = getPkgContent(target)
  const config = {
    'esm-bundler': {
      file: resolve(packagesRoot, target, pkg.module),
      format: `es`,
    },
    cjs: {
      file: resolve(packagesRoot, target, pkg.main),
      format: `cjs`,
      exports: 'named',
    },
    global: {
      file: resolve(packagesRoot, target, `dist/index.global.js`),
      format: `iife`,
      name: globalName,
    },
  } as const
  return { ...config[format] }
}

export type BuildFormat = 'esm-bundler' | 'cjs' | 'global'
export type BuildConfig = {
  target: string
  formats?: BuildFormat[]
  globalName?: string
  rollupConfig?: RollupOptions
}

export async function build({
  target,
  formats = ['esm-bundler', 'cjs'],
  globalName = '',
  rollupConfig = {},
}: BuildConfig): Promise<void> {
  const inputConfigs = getInputConfigs(target, rollupConfig)
  const outputConfigs = formats.map(format => getOutputConfigs(target, format, globalName))
  const pkgDir = resolve(packagesRoot, target)

  await fs.remove(`${pkgDir}/${getOutputDir(target)}`)

  console.log(chalk.yellow(`building package:${target}`))
  const bundle = await rollup(inputConfigs)

  for (let outputConfig of outputConfigs) {
    await bundle.write(outputConfig as OutputOptions)
    console.log(chalk.green(`Success: ${(outputConfig as OutputOptions).file}`))
  }
}

export async function buildInject() {
  const pkgRoot = resolve(packagesRoot, 'engine')
  await fs.remove(`${pkgRoot}/inject`)

  const inputConfig = {
    input: `${pkgRoot}/src/inject.ts`,
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts'],
      }),
      commonjs(),
      typescript({
        tsconfigOverride: {
          include: [`${pkgRoot}/src/inject.ts`],
          declaration: false,
        },
      }),
    ],
  }

  const outputConfig = {
    file: resolve(pkgRoot, `inject/index.js`),
    format: `iife`,
    name: '__oopsTestInject',
  } as const

  console.log(chalk.yellow(`building inject.js`))
  const bundle = await rollup(inputConfig)

  await bundle.write(outputConfig)

  console.log(chalk.green(`Success: ${outputConfig.file}`))
}
