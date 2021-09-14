import { readdirSync, statSync } from 'fs'
import { resolve } from 'path'
import * as fs from 'fs-extra'
import { OutputOptions, rollup, RollupOptions } from 'rollup'
import chalk from 'chalk'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import typescript from 'rollup-plugin-typescript2'
import { buildConfigs } from './config'
// import flatDts from 'rollup-plugin-flat-dts'
// import { terser } from 'rollup-plugin-terser'

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
        tsconfig: resolve(__dirname, '../../tsconfig.json'),
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

export function getOutputConfigs(target = ''): OutputOptions[] {
  const pkg = getPkgContent(target)
  return buildConfigs[target].formats.map(format => {
    if (format === 'es') {
      return {
        file: resolve(packagesRoot, target, pkg.module),
        format: `es`,
      }
    }
    if (format === 'cjs') {
      return {
        file: resolve(packagesRoot, target, pkg.main),
        format: `cjs`,
        exports: 'named',
      }
    }
    if (format === 'iife') {
      return {
        file: resolve(packagesRoot, target, `dist/index.global.js`),
        format: `iife`,
        name: buildConfigs[target]?.globalName,
      }
    }
    throw Error('target is not valid!')
  })
}

export async function build(target: string, rollupConfig?: RollupOptions): Promise<void> {
  const inputConfigs = getInputConfigs(target, rollupConfig)
  const outputConfigs = getOutputConfigs(target)

  for (const { file } of outputConfigs) {
    file && (await fs.remove(file))
  }

  console.log(chalk.yellow(`building package:${target}`))
  const bundle = await rollup(inputConfigs)

  for (let outputConfig of outputConfigs) {
    await bundle.write(outputConfig as OutputOptions)
    console.log(chalk.green(`Success: ${(outputConfig as OutputOptions).file}`))
  }
}
