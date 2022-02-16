import { Action } from '@oops-test/engine'
// import { debounce } from 'lodash-es'
import { ref, Ref, onMounted, onUnmounted } from 'vue'
import { ToolsStatus } from '../../types'
import {
  getClickAction,
  getHoverAction,
  getInputAction,
  getPressAction,
  getScrollAction,
} from '../../utils/actionsFormatter'
import { addEventListener, preventEvent } from '../../utils/dom'

export function useRecorder(toolsStatus: Ref<ToolsStatus>, recordAction: (action: Action) => void) {
  const listeners = ref<(() => void)[]>([])

  const getClickAction = useClick(toolsStatus, recordAction)

  function listenerWrapper<T extends Event>(action: (event: T) => void) {
    return (event: Event) => {
      if (!toolsStatus.value.recording || (event as any).path.includes(document.querySelector('.oops-test'))) return

      action(event as T)
    }
  }

  function actionWrapper<T extends Event>(getAction: (event: T) => Action | null) {
    return function (event: T) {
      const action = getAction(event as T)
      if (!action) return

      recordAction(action)
    }
  }

  function initListeners() {
    listeners.value = [
      addEventListener(document, 'click', listenerWrapper(getClickAction), true),
      addEventListener(document, 'auxclick', listenerWrapper(getClickAction), true),
      addEventListener(document, 'input', listenerWrapper(actionWrapper(getInputAction)), true),
      addEventListener(document, 'keydown', listenerWrapper(actionWrapper(getPressAction)), true),
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
      addEventListener(document, 'scroll', listenerWrapper(actionWrapper(getScrollAction)), true),
    ]
  }

  function removeEventListeners() {
    listeners.value.forEach(remove => remove())
    listeners.value = []
  }

  onMounted(initListeners)
  onUnmounted(removeEventListeners)
}

function useClick(toolsStatus: Ref<ToolsStatus>, recordAction: (action: Action) => void): (event: MouseEvent) => void {
  return function (event: MouseEvent) {
    if (!event.target) return
    if (toolsStatus.value.hovering) {
      preventEvent(event)
      toolsStatus.value.hovering = false
      recordAction(getHoverAction(event)!)
      return
    }
    recordAction(getClickAction(event)!)
  }
}
