import { createApp } from 'vue'
import { addEventListener } from '../utils'
import Toolbar from './toolbar'
import './toolbar.less'

export default function renderToolbar() {
  const toolbarElement = document.createElement('div')
  toolbarElement.classList.add('oops-test-toolbar')

  // 阻止toolbar的点击冒泡，防止记录无用的action
  addEventListener(toolbarElement, 'click', (e: Event) => e.stopPropagation())

  createApp(Toolbar).mount(toolbarElement)
  document.body.appendChild(toolbarElement)
}
