import { Recorder, BrowserName, Case } from '@oops-test/engine'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'

interface Options {
  output: string
  browser?: BrowserName
}

export default function record(url: string, options: Options) {
  const recorder = new Recorder()
  recorder.start({
    url,
    browser: options.browser,
  })
  recorder.on('finish', () => {
    writeCase(recorder.case, resolve(process.cwd(), options.output))
    process.exit(1)
  })
}

function writeCase(cas: Case, outputDir: string) {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir)
  }

  writeFileSync(join(outputDir, `${new Date().getTime()}.spec.json`), JSON.stringify(cas, null, 2), { flag: 'a+' })
}
