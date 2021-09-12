import {Recorder} from './packages/engine/src/recorder'
import { Runner } from "./packages/engine/src/runner"

const recorder = new Recorder()
const runner = new Runner()

// recorder.start({
//   url: 'https://vitejs.dev'
// })

recorder.on('recordFinish', () => {
  console.log(JSON.stringify(recorder.actions))
  
  runner.run(recorder.actions)
})

runner.run([
  {"action":"newContext","params":{"id":"1001"}},
  {"action":"newPage","context":"1001","params":{"url":"https://vitejs.dev","id":"1002"}},
  {"action":"mousemove","context":"1001","page":"1002","params":{"x":829,"y":130}},
  {"action":"mousemove","context":"1001","page":"1002","params":{"x":855,"y":20}},
  {"action":"mousemove","context":"1001","page":"1002","params":{"x":855,"y":20}},
  {"action":"mousemove","context":"1001","page":"1002","params":{"x":844,"y":29}},
  {"action":"mousemove","context":"1001","page":"1002","params":{"x":757,"y":67}},
  {"action":"click","context":"1001","page":"1002","params":{"selector":"[data-v-675d8756][data-v-eab3edfe] [href='https\\:\\/\\/twitter\\.com\\/vite_js'] .text"},"signals":[{"name":"popup","pageId":"1003"}]},{"action":"assertion","context":"1001","page":"1003","params":{"type":"newPage","url":"https://twitter.com/vite_js"}},{"action":"mousemove","context":"1001","page":"1002","params":{"x":121,"y":142}},{"action":"click","context":"1001","page":"1002","params":{"selector":".r-1ydqjzz"}},{"action":"mousemove","context":"1001","page":"1002","params":{"x":122,"y":142}},{"action":"closePage","context":"1001","params":{"id":"1002"}},{"action":"closePage","context":"1001","params":{"id":"1002"}},{"action":"closeContext","params":{"id":"1001"}}])