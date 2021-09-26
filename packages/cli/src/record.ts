import { Recorder, BrowserName } from '@oops-test/engine'
import { resolve } from 'path'
interface Options {
  output: string
  browser?: BrowserName
  caseName: string
  screenshot: boolean
}

export default function record(url: string, options: Options) {
  const recorder = new Recorder({
    output: resolve(process.cwd(), options.output, options.caseName),
  })
  recorder.start({
    url,
    browser: options.browser,
  })
  recorder.on('finish', () => {
    process.exit(1)
  })
}
