import { createApp, h } from 'vue'
import { addEventListener } from './utils'
import Toolbar from './toolbar'
import './toolbar.less'
import { NDialogProvider } from 'naive-ui'

document.addEventListener('DOMContentLoaded', () => {
  const toolbarElement = document.createElement('div')
  toolbarElement.classList.add('oops-test')

  // 阻止toolbar的点击冒泡，防止记录无用的action
  addEventListener(toolbarElement, 'click', (e: Event) => e.stopPropagation())

  createApp(h(NDialogProvider, { to: '.oops-test' }, [h(Toolbar)])).mount(toolbarElement)
  document.body.appendChild(toolbarElement)
})
