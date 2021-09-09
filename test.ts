// import {Recorder} from './packages/engine/src/index'
import { Runner } from "./packages/engine/src/runner"

// const recorder = new Recorder()
const runner = new Runner()

// recorder.start({
//   url: 'http://localhost:3001/'
// })

// recorder.on('recordFinish', () => {
//   console.log(recorder.actions)
  
//   runner.run(recorder.actions)
// })

runner.run([
  { action: 'newContext', context: '1001', params: { id: '1001' } },
  {
    action: 'newPage',
    page: '1002',
    context: '1001',
    params: { url: 'http://localhost:3001/', id: '1002' }
  },
  {
    action: 'click',
    params: { selector: '[data-o-s-t="100"]' },
    page: '1002',
    context: '1001'
  },
  {
    action: 'closePage',
    page: '1002',
    context: '1001',
    params: { id: '1002' }
  },
  { action: 'closeContext', context: '1001', params: { id: '1001' } }
])