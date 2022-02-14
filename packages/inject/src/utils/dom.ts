import { Modifier } from '@oops-test/engine'
import getCssSelector from 'css-selector-generator'

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

export function getSelector(target: EventTarget | null, document: Document) {
  if (!target) return 'body'
  if (target === document) return 'body'
  const list = document.querySelectorAll(`[data-o-s-t]`)
  for (const tar of Array.from(list)) {
    if (tar.contains(target as Node)) {
      return `[data-o-s-t="${tar.getAttribute('data-o-s-t')}"]`
    }
  }

  // 没有找到的时候，要用兜底的css选择器
  return getCssSelector(target)
}

/**
 * 获取修饰符
 *
 * @export
 * @param {(MouseEvent | KeyboardEvent)} event
 * @returns {(Modifier | undefined)}
 */
export function getModifierByEvent(event: MouseEvent | KeyboardEvent): Modifier | undefined {
  let modifier: Modifier | undefined = undefined
  if (event.ctrlKey) {
    modifier = 'Control'
  }
  if (event.altKey) {
    modifier = 'Alt'
  }
  if (event.shiftKey) {
    modifier = 'Shift'
  }
  if (event.metaKey) {
    modifier = 'Meta'
  }

  return modifier
}

/**
 * 让事件失效
 *
 * @export
 * @param {Event} event
 */
export function preventEvent(event: Event) {
  event.stopImmediatePropagation()
  event.stopPropagation()
  event.preventDefault()
}

export function getScrollOffset(target: EventTarget): {
  x: number
  y: number
} {
  if (target === document) {
    return {
      x: document.documentElement.scrollLeft ?? window.pageXOffset ?? document.body.scrollLeft,
      y: document.documentElement.scrollTop ?? window.pageYOffset ?? document.body.scrollTop,
    }
  }

  return {
    x: (target as HTMLElement).scrollLeft,
    y: (target as HTMLElement).scrollTop,
  }
}
