import minimist from 'minimist'
import { build, BuildConfig, buildInject, getAllTargets } from './utils'
import chalk from 'chalk'
// import execa from 'execa'

const args = minimist(process.argv.slice(2))

const targets = args._
// const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)

const buildConfigs: Record<string, Omit<BuildConfig, 'target'>> = {
  cli: {
    formats: ['cjs'],
    banner: '#!/usr/bin/env node',
  },
  engine: {
    formats: ['esm-bundler', 'cjs'],
  },
  marker: {
    formats: ['esm-bundler', 'cjs'],
  },
}

run()

async function run() {
  let targetsToBuild: string[] = targets
  let allTargets = getAllTargets()
  if (!targetsToBuild?.length) {
    targetsToBuild = allTargets
  }

  try {
    for (let target of targetsToBuild) {
      if (allTargets.includes(target)) {
        await build({
          ...buildConfigs[target],
          target,
        })
      }

      if (['engine', 'inject'].includes(target)) {
        await buildInject()
      }
    }
  } catch (error) {
    console.log(chalk.red(error))
  }
}
// async function buildTypes(target: string) {
//   const pkgDir = path.resolve(`packages/${target}`)
//   const pkg = require(`${pkgDir}/package.json`)

//   console.log(chalk.bold(chalk.yellow(`Rolling up type definitions for ${target}...`)))

//   // build types
//   const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor')

//   const extractorConfigPath = path.resolve(pkgDir, `api-extractor.json`)
//   const extractorConfig = ExtractorConfig.loadFileAndPrepare(extractorConfigPath)
//   const extractorResult = Extractor.invoke(extractorConfig, {
//     localBuild: true,
//     showVerboseMessages: true,
//   })

//   if (extractorResult.succeeded) {
//     // concat additional d.ts to rolled-up dts
//     const typesDir = path.resolve(pkgDir, 'types')
//     if (await fs.exists(typesDir)) {
//       const dtsPath = path.resolve(pkgDir, pkg.types)
//       const existing = await fs.readFile(dtsPath, 'utf-8')
//       const typeFiles = await fs.readdir(typesDir)
//       const toAdd = await Promise.all(
//         typeFiles.map(file => {
//           return fs.readFile(path.resolve(typesDir, file), 'utf-8')
//         }),
//       )
//       await fs.writeFile(dtsPath, existing + '\n' + toAdd.join('\n'))
//     }
//     console.log(chalk.bold(chalk.green(`API Extractor completed successfully.`)))
//   } else {
//     console.error(
//       `API Extractor completed with ${extractorResult.errorCount} errors` +
//         ` and ${extractorResult.warningCount} warnings`,
//     )
//     process.exitCode = 1
//   }

//   await fs.remove(`${pkgDir}/dist/packages`)
// }
