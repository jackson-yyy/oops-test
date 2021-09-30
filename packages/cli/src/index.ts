import { Command } from 'commander'
import record from './record'
import run from './run'
import * as pkg from '../package.json'
import dayjs from 'dayjs'

const program = new Command()

program.version(`oops-test ${pkg.version}`).usage('<command> [options]')

program
  .command('record <url>')
  .description('open a browser to record cases')
  .requiredOption('-o, --output [path]', 'output of cases', process.cwd())
  .requiredOption('-cn, --case-name <name>', 'name of case', dayjs().format('YYYYMMDD_HHmmss'))
  .option('-b, --browser [browser]', 'output of cases')
  .action((url: string, options) => {
    record(url, options)
  })

program
  .command('run <casesDir>')
  .description('run cases under <casesDir>')
  .option('-hl, --headless', 'headless mode', false)
  .option('-ai, --action-interval <number>', 'interval between two actions')
  .requiredOption('-eo, --error-output <dir>', 'output dir of error result', process.cwd())
  .action((casesDir: string, options) => {
    run(casesDir, options)
  })

program.parse(process.argv)
