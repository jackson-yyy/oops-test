import { Recorder, BrowserName, Action } from '@oops-test/engine'
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
    writeCase(recorder.actions, resolve(process.cwd(), options.output))
  })
}

function writeCase(actions: Action[], outputDir: string) {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir)
  }

  writeFileSync(join(outputDir, `${new Date().getTime()}.spec.json`), JSON.stringify(actions, null, 2), { flag: 'a+' })
}
