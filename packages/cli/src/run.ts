import { readdirSync } from 'fs'
import { join, resolve } from 'path'
import { Runner } from '@oops-test/engine'
import chalk from 'chalk'
import ora from 'ora'

interface Options {
  headless?: boolean
  actionInterval?: string
  errorOutput: string
}

export default async function run(casesDir: string, options: Options) {
  casesDir = resolve(process.cwd(), casesDir)

  const actionInterval = Number(options.actionInterval ?? (options.headless ? 0 : 1000))
  const runner = new Runner({
    browserLaunchOptions: {
      headless: options.headless,
      slowMo: actionInterval,
    },
  })
  const errorList: Error[] = []

  const fileList = readdirSync(casesDir)

  // TODO: 优化输出样式
  for (const fileName of fileList) {
    const spinner = ora(chalk.yellow(`running case ${fileName} \n`))
    spinner.color = 'yellow'

    try {
      spinner.start()
      await runner.runCase(join(casesDir, fileName))
    } catch (error) {
      errorList.push(error as Error)
      console.log(error)
      spinner.fail(chalk.red(fileName))
    } finally {
      spinner.stop()
    }
  }

  runner.finish()

  console.log(chalk.blue('finish running cases!'))
  console.log(chalk.green(`pass: ${fileList.length - errorList.length}`))
  console.log(chalk.red(`fail: ${errorList.length}`))
  process.exit(1)
}
