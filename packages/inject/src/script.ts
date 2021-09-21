import type { Action } from '@oops-test/engine/types'
import getCssSelector from 'css-selector-generator'
import { addEventListener } from './utils'

// TODO:hover高亮dom

declare let __oopsTest_recordAction: (action: Action) => void
declare let __oopsTest_contextId: string
declare let __oopsTest_pageId: string

function getSelector(target: EventTarget, document: Document) {
  const list = document.querySelectorAll(`[data-o-s-t]`)
  for (const tar of Array.from(list)) {
    if (tar.contains(target as Node)) {
      return `[data-o-s-t="${tar.getAttribute('data-o-s-t')}"]`
    }
  }

  // 没有找到的时候，要用兜底的css选择器
  return getCssSelector(target)
}

class Recorder {
  private listeners: (() => void)[] = []

  constructor() {}

  init() {
    this.removeEventListeners()
    this.initListeners()
  }

  private initListeners() {
    this.listeners = [
      addEventListener(document, 'click', event => this.onClick(event as MouseEvent)),
      addEventListener(document, 'auxclick', event => this.onClick(event as MouseEvent)),
      // addEventListener(document, 'input', event => this._onInput(event), true),
      // addEventListener(document, 'keydown', event => this._onKeyDown(event as KeyboardEvent), true),
      // addEventListener(document, 'keyup', event => this._onKeyUp(event as KeyboardEvent), true),
      // addEventListener(document, 'mousedown', event => this._onMouseDown(event as MouseEvent), true),
      // addEventListener(document, 'mouseup', event => this._onMouseUp(event as MouseEvent), true),
      // addEventListener(
      //   document,
      //   'mousemove',
      //   // 这里给50ms的debounce还得再验证会不会有问题
      //   debounce(event => this.onMousemove(event as MouseEvent), 50),
      //   true,
      // ),
      // addEventListener(document, 'mouseleave', event => this._onMouseLeave(event as MouseEvent), true),
      // addEventListener(document, 'focus', () => this._onFocus(), true),
      // addEventListener(document, 'scroll', () => {
      //   this._hoveredModel = null;
      //   this._actionPointElement.hidden = true;
      //   this._updateHighlight();
      // }, true),
    ]
  }

  private removeEventListeners() {
    this.listeners.forEach(remove => remove())
    this.listeners = []
  }

  private onClick(event: MouseEvent) {
    if (!event.target) return
    __oopsTest_recordAction({
      action: 'click',
      context: __oopsTest_contextId,
      page: __oopsTest_pageId,
      params: {
        selector: getSelector(event.target, document),
      },
    })
  }

  // private onMousemove(event: MouseEvent) {
  //   __oopsTest_recordAction({
  //     action: 'mousemove',
  //     context: __oopsTest_contextId,
  //     page: __oopsTest_pageId,
  //     params: {
  //       x: event.x,
  //       y: event.y,
  //     },
  //   })
  // }
}

export default function initScript() {
  if (!document?.documentElement) {
    __oopsTest_recordAction({
      action: 'error',
      msg: 'error when calling initScript!',
    })
    return
  }
  new Recorder().init()
}
