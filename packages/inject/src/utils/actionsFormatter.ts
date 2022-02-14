import { getModifierByEvent, getScrollOffset, getSelector } from './dom'
import { ClickAction, HoverAction, InputAction, PressAction, ScrollAction } from '@oops-test/engine'

export function getHoverAction(event: MouseEvent): HoverAction | null {
  if (!event.target) return null
  return {
    action: 'hover',
    context: window.__oopsTest_contextId,
    page: window.__oopsTest_pageId,
    params: {
      selector: getSelector(event.target, document),
    },
  }
}

export function getClickAction(event: MouseEvent): ClickAction | null {
  if (!event.target) return null
  return {
    action: 'click',
    context: window.__oopsTest_contextId,
    page: window.__oopsTest_pageId,
    params: {
      selector: getSelector(event.target, document),
      modifier: getModifierByEvent(event),
    },
  }
}

export function getInputAction(event: InputEvent): InputAction | null {
  if (!event.target) return null
  return {
    action: 'input',
    context: window.__oopsTest_contextId,
    page: window.__oopsTest_pageId,
    params: {
      selector: getSelector(event.target, document),
      content: (event.target as HTMLInputElement).value,
    },
  }
}

// TODO:keyboard这里会比较复杂，需要处理奇奇怪怪的按键，后续优化
export function getPressAction(event: KeyboardEvent): PressAction | null {
  if (!canPress(event) || !event.target) return null
  return {
    action: 'press',
    context: window.__oopsTest_contextId,
    page: window.__oopsTest_pageId,
    params: {
      selector: getSelector(event.target, document),
      key: event.key,
      modifier: getModifierByEvent(event),
    },
  }
}

export function getScrollAction(event: MouseEvent): ScrollAction | null {
  if (!event.target) return null
  return {
    action: 'scroll',
    context: window.__oopsTest_contextId,
    page: window.__oopsTest_pageId,
    params: {
      selector: getSelector(event.target, document),
      ...getScrollOffset(event.target),
    },
  }
}

export function canPress(event: KeyboardEvent): boolean {
  // 这三个键属于文本输入，在input处处理
  if (['Backspace', 'Delete', 'AltGraph'].includes(event.key)) return false

  // 忽略ctrl+v，在input处理
  if (/macintosh|mac os x/i.test(navigator.userAgent)) {
    if (event.key === 'v' && event.metaKey) return false
  } else {
    if (event.key === 'v' && event.ctrlKey) return false
    if (event.key === 'Insert' && event.shiftKey) return false
  }

  if (['Shift', 'Control', 'Meta', 'Alt'].includes(event.key)) return false

  // 单字符且没有修饰符的，当做input处理
  if (event.key.length <= 1 && !getModifierByEvent(event)) return false

  return true
}
