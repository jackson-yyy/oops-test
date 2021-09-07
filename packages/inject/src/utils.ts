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

// TODO: 更强大的selector计算器，考虑使用组件时的情况，xpath+marker
export function getSelector(target: EventTarget, document: Document) {
  const list = document.querySelectorAll(`[data-o-s-t]`)
  for (const tar of Array.from(list)) {
    if (tar.contains(target as Node)) {
      return `[data-o-s-t="${tar.getAttribute('data-o-s-t')}"]`
    }
  }

  // 没有找到的时候，要用兜底的css选择器
  return 'xxx'
}
