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

export function useRecorder() {
  const toolsStatus = ref(getDefaultToolsStatus())
  const listeners = ref<(() => void)[]>([])

  const { onAssert } = useAssert()

  function initListeners() {
    listeners.value = [
      addEventListener(document, 'click', event => onClick(event as MouseEvent)),
      addEventListener(document, 'auxclick', event => onClick(event as MouseEvent)),
      // addEventListener(document, 'input', event => _onInput(event), true),
      // addEventListener(document, 'keydown', event => _onKeyDown(event as KeyboardEvent), true),
      // addEventListener(document, 'keyup', event => _onKeyUp(event as KeyboardEvent), true),
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
      event.preventDefault()
    } else if (toolsStatus.value.asserting) {
      onAssert(event)
      event.preventDefault()
    } else {
      window.__oopsTest_recordAction({
        action: 'click',
        context: window.__oopsTest_contextId,
        page: window.__oopsTest_pageId,
        params: {
          selector: getSelector(event.target, document),
        },
      })
    }
    resetToolsStatus()
  }

  function onHover(event: MouseEvent) {
    console.log(event.target)

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
  function onAssert(event: MouseEvent) {
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

  return {
    onAssert,
  }
}
