import { createApp, h } from 'vue'
import { addEventListener } from './utils/dom'
import Inject from './inject'

const toolbarElement = document.createElement('div')
toolbarElement.classList.add('oops-test')

// 阻止toolbar的点击冒泡，防止记录无用的action
addEventListener(toolbarElement, 'click', (e: Event) => e.stopPropagation())

createApp(h(Inject)).mount(toolbarElement)
document.body.appendChild(toolbarElement)
