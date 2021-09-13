import {Recorder} from './packages/engine/src/recorder'
// import { Runner } from "./packages/engine/src/runner"

const recorder = new Recorder()
// const runner = new Runner()

recorder.start({
  url: 'https://vitejs.dev'
})

recorder.on('recordFinish', () => {
  console.log(JSON.stringify(recorder.actions))
  
})

// runner.run([{"action":"newContext","params":{"id":"1001"}},{"action":"newPage","context":"1001","params":{"url":"https://vitejs.dev/","id":"1002"}},{"action":"mousemove","context":"1001","page":"1002","params":{"x":839,"y":455}},{"action":"mousemove","context":"1001","page":"1002","params":{"x":836,"y":455}},{"action":"mousemove","context":"1001","page":"1002","params":{"x":928,"y":20}},{"action":"mousemove","context":"1001","page":"1002","params":{"x":932,"y":104}},{"action":"mousemove","context":"1001","page":"1002","params":{"x":932,"y":104}},{"action":"click","context":"1001","page":"1002","params":{"selector":"[data-v-675d8756][data-v-eab3edfe] [href='https\\:\\/\\/cn\\.vitejs\\.dev'] .text"},"signals":[{"name":"popup","pageId":"1004"}]},{"action":"assertion","context":"1001","page":"1004","params":{"type":"newPage","url":"https://cn.vitejs.dev/"}},{"action":"mousemove","context":"1001","page":"1003","params":{"x":570,"y":496}},{"action":"click","context":"1001","page":"1003","params":{"selector":".home-hero [href='\\/guide\\/']"}},{"action":"mousemove","context":"1001","page":"1003","params":{"x":568,"y":497}},{"action":"mousemove","context":"1001","page":"1003","params":{"x":846,"y":719}},{"action":"closePage","context":"1001","params":{"id":"1003"}},{"action":"closePage","context":"1001","params":{"id":"1002"}},{"action":"closeContext","params":{"id":"1001"}}])