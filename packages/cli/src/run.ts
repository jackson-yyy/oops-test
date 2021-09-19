import { readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { Runner } from '@oops-test/engine'
import chalk from 'chalk'
import ora from 'ora'

interface Options {
  headless?: boolean
}

export default async function run(casesDir: string, options: Options) {
  casesDir = resolve(process.cwd(), casesDir)
  const runner = new Runner({
    browserLaunchOptions: {
      headless: options.headless,
    },
  })
  const errorList = []

  const fileList = readdirSync(casesDir).filter(fileName => /(.*).spec.json/.test(fileName))

  // TODO: 优化输出样式
  for (const fileName of fileList) {
    const spinner = ora(chalk.yellow(`running case ${fileName} \n`))
    spinner.color = 'yellow'

    try {
      spinner.start()
      await runner.run(JSON.parse(readFileSync(join(casesDir, fileName), 'utf-8')))
    } catch (error) {
      errorList.push(error)
      console.log(error)
      spinner.fail(chalk.red(fileName))
    } finally {
      spinner.stop()
    }
  }

  console.log(chalk.blue('finish running cases!'))
  console.log(chalk.green(`pass: ${fileList.length - errorList.length}`))
  console.log(chalk.red(`fail: ${errorList.length}`))
  process.exit(1)
}
