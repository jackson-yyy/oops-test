import { ToolInfo, ToolsStatus } from '../../types'
import { ref, computed, ComputedRef, Ref } from 'vue'
import { useRecordAction } from '../recorder/useRecordAction'
import { useRecorder } from '../recorder/useRecorder'
import { useRecord } from './useRecord'
import { useScreenshot, useElementSnapshot, useUrlAssertion } from './useAssertion'
// import { addEventListener } from '../../utils/dom'

function getDefaultToolsStatus(): ToolsStatus {
  return {
    recording: false,
    hovering: false,
    asserting: {
      elementScreenshot: false,
      elementSnapshot: false,
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

export function useToolbar(): { tools: ComputedRef<ToolInfo[]>; toolsStatus: Ref<ToolsStatus> } {
  const toolsStatus = useToolsStatus()
  const { recordAction, recordPreventedAction } = useRecordAction(toolsStatus)

  useRecorder(toolsStatus, recordAction)

  const recordBtnHandler = useRecord(toolsStatus)

  const screenshotAssertion = useScreenshot(toolsStatus, recordAction)
  const snapshotAssertion = useElementSnapshot(toolsStatus)
  const urlAssertion = useUrlAssertion(toolsStatus, recordAction)

  const tools = computed(() => [
    {
      text: toolsStatus.value.recording ? '停止' : '开始',
      active: false,
      disabled: false,
      handler() {
        toolsStatus.value.recording && recordPreventedAction()
        recordBtnHandler()
      },
    },
    {
      text: 'Hover',
      active: toolsStatus.value.hovering,
      disabled: !toolsStatus.value.recording,
      handler() {
        toolsStatus.value.hovering = !toolsStatus.value.hovering
      },
    },
    urlAssertion.value,
    screenshotAssertion.value,
    snapshotAssertion.value,
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
    toolsStatus,
  }
}
