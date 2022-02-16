import { ToolInfo, ToolsStatus } from '../../types'
import { ref, computed, ComputedRef } from 'vue'
import { useRecordAction } from '../recorder/useRecordAction'
import { useRecorder } from '../recorder/useRecorder'
import { useRecord } from './useRecord'
import { useElementScreenshot, useFullScreenshot } from './useAssertion'
// import { addEventListener } from '../../utils/dom'

function getDefaultToolsStatus(): ToolsStatus {
  return {
    recording: false,
    hovering: false,
    asserting: {
      elementScreenshot: false,
      snapshot: false,
    },
  }
}

function useToolsStatus() {
  const toolsStatus = ref<ToolsStatus>(getDefaultToolsStatus())
  window.__oopsTest_isRecording().then(isRecording => (toolsStatus.value.recording = isRecording))

  // FIXME:这里不知道为啥visibilitychange不生效，需要提个issue问一下，暂时采用__oopsTest_syncStatus规避
  // addEventListener(document, 'visibilitychange', async () => {
  //   if (document.visibilityState === 'visible') {
  //     window.__oopsTest_isRecording().then(isRecording => (toolsStatus.value.recording = isRecording))
  //   }
  // })

  window.__oopsTest_syncStatus = (isRecording: boolean) => {
    toolsStatus.value.recording = isRecording
  }

  return toolsStatus
}

export function useToolbar(): { tools: ComputedRef<ToolInfo[]> } {
  const toolsStatus = useToolsStatus()
  const { recordAction, recordPreventedAction } = useRecordAction(toolsStatus)

  useRecorder(toolsStatus, recordAction)

  const recordBtnHandler = useRecord(toolsStatus)

  const fullScreenshot = useFullScreenshot(toolsStatus, recordAction)
  const elementFullScreenshot = useElementScreenshot(toolsStatus)

  const featureTools = computed<ToolInfo[]>(() => [
    {
      text: 'Hover',
      active: toolsStatus.value.hovering,
      disabled: !toolsStatus.value.recording,
      handler() {
        toolsStatus.value.hovering = !toolsStatus.value.hovering
      },
    },
    {
      text: '截图断言',
      active: false,
      disabled: !toolsStatus.value.recording,
      children: [fullScreenshot.value, elementFullScreenshot.value],
    },
  ])

  const tools = computed<ToolInfo[]>(() => [
    {
      text: toolsStatus.value.recording ? '停止' : '开始',
      active: false,
      disabled: false,
      handler() {
        toolsStatus.value.recording && recordPreventedAction()
        recordBtnHandler()
      },
    },
    ...featureTools.value,
    {
      text: 'exit',
      active: false,
      disabled: toolsStatus.value.recording,
      handler() {
        recordPreventedAction()
        window.__oopsTest_exit()
      },
    },
  ])

  return {
    tools,
  }
}
