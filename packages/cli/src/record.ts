import { Recorder, BrowserName } from '@oops-test/engine'
import { resolve } from 'path'
interface Options {
  output: string
  browser?: BrowserName
}

export default function record(url: string, options: Options) {
  const recorder = new Recorder({
    output: resolve(process.cwd(), options.output),
  })
  recorder.start({
    url,
    browser: options.browser,
  })
  recorder.on('exit', () => {
    process.exit(1)
  })
}
