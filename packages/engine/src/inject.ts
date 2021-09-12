import type { Action as ActionItem } from './types'
import getCssSelector from 'css-selector-generator'

type Action = Omit<ActionItem, 'context' | 'page'>

declare let _oopsTestRecordAction: (action: Action) => void

export function addEventListener(
  target: EventTarget,
  eventName: string,
  listener: (evt: Event) => void,
  useCapture?: boolean,
): () => void {
  target.addEventListener(eventName, listener, useCapture)
  const remove = () => {
    target.removeEventListener(eventName, listener, useCapture)
  }
  return remove
}

export function getSelector(target: EventTarget, document: Document) {
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
      addEventListener(document, 'click', event => this.onClick(event as MouseEvent), true),
      addEventListener(document, 'auxclick', event => this.onClick(event as MouseEvent), true),
      // addEventListener(document, 'input', event => this._onInput(event), true),
      // addEventListener(document, 'keydown', event => this._onKeyDown(event as KeyboardEvent), true),
      // addEventListener(document, 'keyup', event => this._onKeyUp(event as KeyboardEvent), true),
      // addEventListener(document, 'mousedown', event => this._onMouseDown(event as MouseEvent), true),
      // addEventListener(document, 'mouseup', event => this._onMouseUp(event as MouseEvent), true),
      // addEventListener(document, 'mousemove', event => this._onMouseMove(event as MouseEvent), true),
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
    _oopsTestRecordAction({
      action: 'click',
      params: {
        selector: getSelector(event.target, document),
      },
    })
  }
}

function _oopsTestInitScript() {
  if (!document?.documentElement) {
    _oopsTestRecordAction({
      action: 'initScriptError',
    })
    return
  }
  new Recorder().init()
}

export { _oopsTestInitScript }
