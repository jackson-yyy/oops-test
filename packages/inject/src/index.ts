import { createApp } from 'vue'
import { addEventListener } from './utils'
import Toolbar from './toolbar'
import './toolbar.less'
// FIXME:这里引入的一些样式会改变默认样式，比如body会被overflow hidden
import 'ant-design-vue/lib/modal/style'
// import '@idux/components/modal/style'

// TODO:用idux不知道为啥样式引不进来，postcss插件解析完变成空了

document.addEventListener('DOMContentLoaded', () => {
  const toolbarElement = document.createElement('div')
  toolbarElement.classList.add('oops-test-toolbar')

  // 阻止toolbar的点击冒泡，防止记录无用的action
  addEventListener(toolbarElement, 'click', (e: Event) => e.stopPropagation())

  createApp(Toolbar).mount(toolbarElement)
  document.body.appendChild(toolbarElement)
})
