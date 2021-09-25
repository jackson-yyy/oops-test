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
  const list = document.querySelectorAll(`[data-o-s-t]`)
  for (const tar of Array.from(list)) {
    if (tar.contains(target as Node)) {
      return `[data-o-s-t="${tar.getAttribute('data-o-s-t')}"]`
    }
  }

  // 没有找到的时候，要用兜底的css选择器
  return getCssSelector(target)
}
