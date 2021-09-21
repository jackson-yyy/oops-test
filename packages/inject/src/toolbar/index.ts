import { createApp } from 'vue'
import Toolbar from './toolbar'
import './toolbar.less'

export default function renderToolbar() {
  const toolbarElement = document.createElement('div')
  toolbarElement.classList.add('oops-test-toolbar')
  createApp(Toolbar).mount(toolbarElement)
  document.body.appendChild(toolbarElement)
}
