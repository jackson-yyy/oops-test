import {Recorder} from './packages/engine/src/recorder'
import { Runner } from "./packages/engine/src/runner"

const recorder = new Recorder()
const runner = new Runner()

// recorder.start({
//   url: 'https://vitejs.dev'
// })

recorder.on('recordFinish', () => {
  console.log(recorder.actions)
  
  runner.run(recorder.actions)
})

runner.run([
  { action: 'newContext', params: { id: '1001' } },
  {
    action: 'newPage',
    context: '1001',
    params: { url: 'https://vitejs.dev', id: '1002' }
  },
  {
    action: 'mousemove',
    context: '1001',
    page: '1002',
    params: { x: 874, y: 92 }
  },
  {
    action: 'mousemove',
    context: '1001',
    page: '1002',
    params: { x: 854, y: 27 }
  },
  {
    action: 'mousemove',
    context: '1001',
    page: '1002',
    params: { x: 770, y: 76 }
  },
  {
    action: 'click',
    context: '1001',
    page: '1002',
    params: {
      selector: "[data-v-675d8756][data-v-eab3edfe] [href='https\\:\\/\\/twitter\\.com\\/vite_js']"
    }
  },
  {
    action: 'assertion',
    context: '1001',
    page: '1003',
    params: { type: 'newPage', url: 'https://twitter.com/vite_js' }
  },
  { action: 'closePage', context: '1001', params: { id: '1002' } },
  { action: 'closePage', context: '1001', params: { id: '1002' } },
  { action: 'closeContext', params: { id: '1001' } }
])