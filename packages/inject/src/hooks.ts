import { Modifier } from '@oops-test/engine'
import { ref, onMounted, onUnmounted, computed, Ref, h } from 'vue'
import { addEventListener, getSelector } from './utils'
import dayjs from 'dayjs'
import { debounce } from 'lodash-es'
import { NInput, useDialog, useNotification } from 'naive-ui'

function getDefaultToolsStatus() {
  return {
    recording: false,
    visible: true,
    hovering: false,
    asserting: {
      screenshot: false,
      snapshot: false,
    },
  }
}

function preventEvent(event: Event) {
  event.stopImmediatePropagation()
  event.stopPropagation()
  event.preventDefault()
}

function listenerWrapper<T extends Event>(cb: (evt: T) => void) {
  return (evt: Event) => {
    if (!(evt as any).path.includes(document.querySelector('.oops-test'))) {
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

export function useRecorder({
  status: toolsStatus,
}: {
  status: Ref<ReturnType<typeof getDefaultToolsStatus>>
  resetStatus: () => void
}) {
  const listeners = ref<(() => void)[]>([])

  const onInput = useInput()
  const { onKeydown } = useKeyboard()
  const onScroll = useScroll()

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
      addEventListener(document, 'scroll', listenerWrapper(onScroll), true),
    ]
  }

  function removeEventListeners() {
    listeners.value.forEach(remove => remove())
    listeners.value = []
  }

  function onClick(event: MouseEvent) {
    if (!event.target) return
    if (toolsStatus.value.hovering) {
      onHover(event)
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

export function useScroll() {
  return debounce(() => {
    window.__oopsTest_recordAction({
      action: 'scroll',
      context: window.__oopsTest_contextId,
      page: window.__oopsTest_pageId,
      params: {
        x: document.documentElement.scrollLeft || window.pageXOffset || document.body.scrollLeft,
        y: document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop,
      },
    })
  }, 100)
}

function useStartRecord(): () => Promise<void> {
  const dialog = useDialog()
  const notice = useNotification()
  const caseName = ref('')
  const saveMock = ref(true)

  const errorMsg = {
    fail: '创建用例失败，请重试！',
    exist: '用例已存在，请删除用例或者更改用例名！',
  }

  return function () {
    return new Promise((res, rej) => {
      dialog.info({
        title: '请输入用例名称',
        content: () =>
          h(NInput, {
            value: caseName.value,
            onInput(value: string) {
              caseName.value = value
            },
          }),
        positiveText: '确认',
        onNegativeClick: rej,
        async onPositiveClick() {
          const result = await window.__oopsTest_startRecord({
            context: window.__oopsTest_contextId,
            page: window.__oopsTest_pageId,
            url: location.href,
            name: caseName.value,
            saveMock: saveMock.value,
          })

          if (result === 'success') {
            res()
            return true
          }

          notice.error({
            content: errorMsg[result],
            duration: 3000,
          })
          rej()
          return false
        },
      })
    })
  }
}

export function useToolbar() {
  // function toolHandlerWrapper(handler: () => void) {
  //   return () => {
  //     resetToolsStatus()
  //     handler()
  //   }
  // }

  function resetToolsStatus() {
    toolsStatus.value = getDefaultToolsStatus()
  }

  function reloadPage() {
    localStorage.setItem('__oopsTest_toolsStatus', JSON.stringify(toolsStatus.value))
    window.location.reload()
  }

  const toolsStatusHistory = localStorage.getItem('__oopsTest_toolsStatus')

  const toolsStatus = ref((toolsStatusHistory && JSON.parse(toolsStatusHistory)) ?? getDefaultToolsStatus())

  localStorage.removeItem('__oopsTest_toolsStatus')

  const startRecord = useStartRecord()

  const tools = computed(() =>
    [
      {
        icon: '',
        text: toolsStatus.value.recording ? '停止' : '开始',
        active: toolsStatus.value.recording,
        async handler() {
          if (!toolsStatus.value.recording) {
            await startRecord()
            toolsStatus.value.recording = true
            reloadPage()
          } else {
            window.__oopsTest_finishRecord({
              context: window.__oopsTest_contextId,
            })
            toolsStatus.value.recording = false
          }
        },
      },
      {
        icon: '',
        text: 'Hover',
        active: toolsStatus.value.hovering,
        handler() {
          toolsStatus.value.hovering = !toolsStatus.value.hovering
        },
      },
      {
        icon: '',
        text: 'ScreenshotAssert',
        active: false,
        handler() {
          toolsStatus.value.visible = false
          window.__oopsTest_recordAction({
            action: 'assertion',
            context: window.__oopsTest_contextId,
            page: window.__oopsTest_pageId,
            params: {
              type: 'screenshot',
              name: `assertion_${dayjs().valueOf()}.png`,
            },
          })
        },
      },
      {
        icon: '',
        text: 'exit',
        handler: window.__oopsTest_exit,
      },
    ].map(tool => ({
      ...tool,
      handler: tool.handler,
    })),
  )

  const style = computed(() => ({
    visibility: toolsStatus.value.visible ? ('initial' as const) : ('hidden' as const),
  }))

  useRecorder({
    status: toolsStatus,
    resetStatus: resetToolsStatus,
  })

  window.__oopsTest_resetToolbar = resetToolsStatus

  return {
    tools,
    style,
  }
}
