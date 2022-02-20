import { computed, ComputedRef, Ref } from 'vue'
import { Action } from '@oops-test/engine'
import { ToolInfo, ToolsStatus } from '../../types'
import { getScreenshotAssertion, getUrlAssertion } from '../../utils/actionsFormatter'

/**
 * 全屏截图
 *
 * @export
 * @param {Ref<ToolsStatus>} toolsStatus
 * @param {(action: Action) => void} recordAction
 * @returns {*}  {ComputedRef<ToolInfo>}
 */
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

/**
 * 元素截图
 *
 * @export
 * @param {Ref<ToolsStatus>} toolsStatus
 * @returns {*}  {ComputedRef<ToolInfo>}
 */
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

/**
 * 截图工具的配置
 *
 * @export
 * @param {Ref<ToolsStatus>} toolsStatus
 * @param {(action: Action) => void} recordAction
 * @returns {*}
 */
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

export function useElementSnapshot(toolsStatus: Ref<ToolsStatus>) {
  return computed(() => ({
    text: '元素快照',
    active: toolsStatus.value.asserting.elementSnapshot,
    disabled: !toolsStatus.value.recording,
    handler() {
      if (!toolsStatus.value.recording) return
      toolsStatus.value.asserting.elementSnapshot = !toolsStatus.value.asserting.elementSnapshot
    },
  }))
}

export function useUrlAssertion(toolsStatus: Ref<ToolsStatus>, recordAction: (action: Action) => void) {
  return computed(() => ({
    text: '断言url',
    active: false,
    disabled: !toolsStatus.value.recording,
    handler() {
      if (!toolsStatus.value.recording) return
      recordAction(getUrlAssertion())
    },
  }))
}
