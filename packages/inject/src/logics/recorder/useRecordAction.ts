import { Action } from '@oops-test/engine'
import { Ref } from 'vue'
import { ToolsStatus } from '../../types'

export function useRecordAction(toolsStatus: Ref<ToolsStatus>): {
  recordAction: (action: Action) => void
  recordPreventedAction: () => void
} {
  let preventedAction: Action | null = null

  function recordPreventedAction() {
    if (preventedAction) {
      window.__oopsTest_recordAction(preventedAction)
      preventedAction = null
    }
  }

  function recordAction(action: Action) {
    if (!toolsStatus.value.recording) return

    // 如果是input，修改上次的action内容
    if (action.action === 'input') {
      if (!preventedAction) {
        preventedAction = action
        return
      }
      if (preventedAction.action === 'input' && preventedAction.params.selector === action.params.selector) {
        preventedAction.params.content = action.params.content
        return
      }
    }

    // 先将上一个action推送过去
    recordPreventedAction()
    window.__oopsTest_recordAction(action)
  }

  return {
    recordAction,
    recordPreventedAction,
  }
}
