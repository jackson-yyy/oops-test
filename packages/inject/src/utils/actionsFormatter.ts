import { getModifierByEvent, getScrollOffset, getSelector } from './dom'
import {
  ClickAction,
  HoverAction,
  InputAction,
  PressAction,
  ScreenshotAssertion,
  ScrollAction,
  SnapshotAssertion,
  UrlAssertion,
} from '@oops-test/engine'
import dayjs from 'dayjs'

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

export function getScreenshotAssertion(event?: MouseEvent): ScreenshotAssertion {
  if (!event?.target) {
    return {
      action: 'assertion',
      context: window.__oopsTest_contextId,
      page: window.__oopsTest_pageId,
      params: {
        type: 'screenshot',
        name: `full_screenshot_${dayjs().valueOf()}.png`,
      },
    }
  }

  return {
    action: 'assertion',
    context: window.__oopsTest_contextId,
    page: window.__oopsTest_pageId,
    params: {
      selector: getSelector(event.target, document),
      type: 'screenshot',
      name: `element_screenshot_${dayjs().valueOf()}.png`,
    },
  }
}

export function getSnapshotAssertion(event: MouseEvent): SnapshotAssertion | null {
  if (!event.target) return null
  return {
    action: 'assertion',
    context: window.__oopsTest_contextId,
    page: window.__oopsTest_pageId,
    params: {
      type: 'snapshot',
      selector: getSelector(event.target, document),
      name: `element_snapshot_${dayjs().valueOf()}`,
    },
  }
}

export function getUrlAssertion(): UrlAssertion {
  return {
    action: 'assertion',
    context: window.__oopsTest_contextId,
    page: window.__oopsTest_pageId,
    params: {
      type: 'url',
      url: location.href,
    },
  }
}

function canPress(event: KeyboardEvent): boolean {
  // 只拦截input上的键盘输入
  if ((event.target as HTMLElement).tagName !== 'INPUT') {
    return true
  }

  const modifier = getModifierByEvent(event)

  // 这三个键属于文本输入，在input处处理
  if (['Backspace', 'Delete', 'AltGraph'].includes(event.key)) return false

  // 忽略ctrl+v，在input处理
  if (/macintosh|mac os x/i.test(navigator.userAgent)) {
    if (event.key === 'v' && event.metaKey) return false
  } else {
    if (event.key === 'v' && event.ctrlKey) return false
    if (event.key === 'Insert' && event.shiftKey) return false
  }

  // process为过程中，比如中文输入法在选词之前的阶段，这里不记录
  if (['Shift', 'Control', 'Meta', 'Alt', 'Process', 'CapsLock'].includes(event.key)) return false

  // 单字符且没有修饰符的，当做input处理
  if (event.key.length <= 1 && !modifier) return false

  // shift加单个英文字符当做大小写转换，当做input处理
  if (event.key && modifier === 'Shift') return false

  return true
}
