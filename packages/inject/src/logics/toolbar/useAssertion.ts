import { computed, ComputedRef, Ref } from 'vue'
import { Action } from '@oops-test/engine'
import { ToolInfo, ToolsStatus } from '../../types'
import { getScreenshotAssertion } from '../../utils/actionsFormatter'

export function useFullScreenshot(
  toolsStatus: Ref<ToolsStatus>,
  recordAction: (action: Action) => void,
): ComputedRef<ToolInfo> {
  return computed(() => ({
    text: '全屏截图',
    active: false,
    disabled: !toolsStatus.value.recording,
    handler() {
      if (!toolsStatus.value.recording) return
      recordAction(getScreenshotAssertion())
    },
  }))
}

export function useElementScreenshot(toolsStatus: Ref<ToolsStatus>): ComputedRef<ToolInfo> {
  return computed(() => ({
    text: '选择元素',
    active: toolsStatus.value.asserting.elementScreenshot,
    disabled: !toolsStatus.value.recording,
    handler() {
      if (!toolsStatus.value.recording) return
      toolsStatus.value.asserting.elementScreenshot = !toolsStatus.value.asserting.elementScreenshot
    },
  }))
}

export function useScreenshot(toolsStatus: Ref<ToolsStatus>, recordAction: (action: Action) => void) {
  const fullScreenshot = useFullScreenshot(toolsStatus, recordAction)
  const elementScreenshot = useElementScreenshot(toolsStatus)
  const screenshotTools = computed(() => [fullScreenshot.value, elementScreenshot.value])
  return computed(() => ({
    text: '截图断言',
    active: screenshotTools.value.some(item => item.active),
    disabled: !toolsStatus.value.recording,
    children: screenshotTools.value,
  }))
}
