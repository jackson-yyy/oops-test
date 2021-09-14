import { Command } from 'commander'
const program = new Command()

program.version(`oops-test ${require('../package').version}`).usage('<command> [options]')

program.command('record <url>').description('open a browser and start to record case').action(console.log)

program.parse(process.argv)
