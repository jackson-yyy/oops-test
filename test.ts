import {Recorder} from './packages/engine/src/recorder'
import { Runner } from "./packages/engine/src/runner"

const recorder = new Recorder()
const runner = new Runner()

recorder.start({
  url: 'https://vitejs.dev'
})

recorder.on('recordFinish', () => {
  console.log(recorder.actions)
  
  runner.run(recorder.actions)
})

// runner.run([
//   { action: 'newContext', params: { id: '1001' } },
//   {
//     action: 'newPage',
//     context: '1001',
//     params: { url: 'http://localhost:3000/', id: '1002' }
//   },
//   {
//     action: 'click',
//     params: { selector: '[data-o-s-t="100"]' },
//     page: '1002',
//     context: '1001'
//   },
//   {
//     action: 'click',
//     params: { selector: 'button' },
//     page: '1002',
//     context: '1001'
//   },
//   {
//     action: 'click',
//     params: { selector: "[href='https\\:\\/\\/code\\.visualstudio\\.com\\/']" },
//     page: '1002',
//     context: '1001'
//   },
//   {
//     action: 'assertion',
//     context: '1001',
//     page: '1002',
//     params: { type: 'newPage', url: 'https://code.visualstudio.com/' }
//   },
//   { action: 'closePage', context: '1001', params: { id: '1002' } },
//   { action: 'closeContext', params: { id: '1001' } }
// ])