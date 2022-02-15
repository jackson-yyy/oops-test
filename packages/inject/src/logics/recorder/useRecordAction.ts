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

    // input/scroll先暂存
    if (action.action === 'input' || action.action === 'scroll') {
      const preventCondition =
        !preventedAction ||
        (preventedAction.action === action.action &&
          preventedAction.context === action.context &&
          preventedAction.page === action.page &&
          preventedAction.params.selector === action.params.selector)

      if (preventCondition) {
        preventedAction = action
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
