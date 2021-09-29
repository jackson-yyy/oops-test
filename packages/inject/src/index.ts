import { createApp, h } from 'vue'
import { addEventListener } from './utils'
import Toolbar from './toolbar'
import './toolbar.less'
import { NDialogProvider } from 'naive-ui'

export function injectToolbar() {
  const toolbarElement = document.createElement('div')
  toolbarElement.classList.add('oops-test-toolbar')

  // 阻止toolbar的点击冒泡，防止记录无用的action
  addEventListener(toolbarElement, 'click', (e: Event) => e.stopPropagation())

  createApp(h(NDialogProvider, { to: '.oops-test-toolbar' }, [h(Toolbar)])).mount(toolbarElement)
  document.body.appendChild(toolbarElement)
}

export function initInjectScript() {
  if (document.readyState === 'complete') {
    injectToolbar()
    return
  }
  document.addEventListener('readystatechange', event => {
    if ((event.target as Document).readyState === 'complete') {
      injectToolbar()
    }
  })
}
