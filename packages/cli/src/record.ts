import { Recorder, BrowserName, Case } from '@oops-test/engine'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
interface Options {
  output: string
  browser?: BrowserName
  caseName: string
}

function createDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path)
  }
}

export default function record(url: string, options: Options) {
  const recorder = new Recorder()

  recorder.start({
    url,
    browser: options.browser,
  })
  recorder.on('finish', () => {
    const output = resolve(process.cwd(), options.output)
    createDir(output)
    writeCase(recorder.case, resolve(output, options.caseName))
    process.exit(1)
  })
}

function writeCase(cas: Case, outputDir: string) {
  createDir(outputDir)

  writeFileSync(join(outputDir, `case.json`), JSON.stringify(cas, null, 2), { flag: 'a+' })
}
