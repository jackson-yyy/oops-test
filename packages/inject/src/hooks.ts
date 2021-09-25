import { Modifier } from '@oops-test/engine'
import { ref, onMounted, onUnmounted, h } from 'vue'
import { addEventListener, getSelector } from './utils'
// import { useModal } from '@idux/components/modal'
import { Modal } from 'ant-design-vue/es'

function getDefaultToolsStatus() {
  return {
    hovering: false,
    asserting: false,
  }
}

function preventEvent(event: Event) {
  event.stopImmediatePropagation()
  event.stopPropagation()
  event.preventDefault()
}

function listenerWrapper<T extends Event>(cb: (evt: T) => void) {
  return (evt: Event) => {
    if (!(evt as any).path.includes(document.querySelector('.oops-test-toolbar'))) {
      cb(evt as T)
    }
  }
}

function getModifierByEvent(event: MouseEvent | KeyboardEvent): Modifier | undefined {
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

function canPress(event: KeyboardEvent): boolean {
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

export function useRecorder() {
  const toolsStatus = ref(getDefaultToolsStatus())
  const listeners = ref<(() => void)[]>([])

  const onAssert = useAssert()
  const onInput = useInput()
  const { onKeydown } = useKeyboard()

  function initListeners() {
    listeners.value = [
      addEventListener(document, 'click', listenerWrapper(onClick), true),
      addEventListener(document, 'auxclick', listenerWrapper(onClick), true),
      addEventListener(document, 'input', listenerWrapper(onInput), true),
      addEventListener(document, 'keydown', listenerWrapper(onKeydown), true),
      // addEventListener(document, 'keyup', listenerWrapper(onKeyup), true),
      // addEventListener(document, 'mousedown', event => _onMouseDown(event as MouseEvent), true),
      // addEventListener(document, 'mouseup', event => _onMouseUp(event as MouseEvent), true),
      // addEventListener(
      //   document,
      //   'mousemove',
      //   // 这里给50ms的debounce还得再验证会不会有问题
      //   debounce(event => onMousemove(event as MouseEvent), 50),
      //   true,
      // ),
      // addEventListener(document, 'mouseleave', event => _onMouseLeave(event as MouseEvent), true),
      // addEventListener(document, 'focus', () => _onFocus(), true),
      // addEventListener(document, 'scroll', () => {
      //   _hoveredModel = null;
      //   _actionPointElement.hidden = true;
      //   _updateHighlight();
      // }, true),
    ]
  }

  function removeEventListeners() {
    listeners.value.forEach(remove => remove())
    listeners.value = []
  }

  function resetToolsStatus() {
    toolsStatus.value = getDefaultToolsStatus()
  }

  function onClick(event: MouseEvent) {
    if (!event.target) return
    if (toolsStatus.value.hovering) {
      onHover(event)
      preventEvent(event)
    } else if (toolsStatus.value.asserting) {
      onAssert(event)
      preventEvent(event)
    } else {
      window.__oopsTest_recordAction({
        action: 'click',
        context: window.__oopsTest_contextId,
        page: window.__oopsTest_pageId,
        params: {
          selector: getSelector(event.target, document),
          modifier: getModifierByEvent(event),
        },
      })
    }
    resetToolsStatus()
  }

  function onHover(event: MouseEvent) {
    if (!event.target) return
    window.__oopsTest_recordAction({
      action: 'hover',
      context: window.__oopsTest_contextId,
      page: window.__oopsTest_pageId,
      params: {
        selector: getSelector(event.target, document),
      },
    })
  }

  // function onMousemove(event: MouseEvent) {
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

  onMounted(initListeners)
  onUnmounted(removeEventListeners)

  return {
    toolsStatus,
  }
}

export function useAssert() {
  return function onAssert(event: MouseEvent) {
    if (!event.target) return
    const assertValue = ref((event.target as HTMLElement).innerText)
    Modal.confirm({
      getContainer() {
        return document.querySelector('.oops-test-toolbar') ?? document.body
      },
      title: '输入断言内容',
      content: () =>
        h('input', {
          value: assertValue.value,
          onInput(event: InputEvent) {
            assertValue.value = (event.target as HTMLInputElement).value
          },
        }),
      onOk() {
        window.__oopsTest_recordAction({
          action: 'assertion',
          context: window.__oopsTest_contextId,
          page: window.__oopsTest_pageId,
          params: {
            type: 'innerText',
            selector: getSelector(event.target!, document),
            content: assertValue.value,
          },
        })
      },
    })
  }
}

export function useInput() {
  return function onInput(event: InputEvent) {
    window.__oopsTest_recordAction({
      action: 'input',
      context: window.__oopsTest_contextId,
      page: window.__oopsTest_pageId,
      params: {
        selector: getSelector(event.target, document),
        content: (event.target as HTMLInputElement).value,
      },
    })
  }
}

// TODO:keyboard这里会比较复杂，需要处理奇奇怪怪的按键，后续优化
export function useKeyboard() {
  function onKeydown(event: KeyboardEvent) {
    if (canPress(event)) {
      window.__oopsTest_recordAction({
        action: 'press',
        context: window.__oopsTest_contextId,
        page: window.__oopsTest_pageId,
        params: {
          selector: getSelector(event.target, document),
          key: event.key,
          modifier: getModifierByEvent(event),
        },
      })
    }
  }
  return {
    onKeydown,
  }
}
