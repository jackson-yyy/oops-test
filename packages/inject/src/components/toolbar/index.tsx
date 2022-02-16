import dayjs from 'dayjs'
import { defineComponent, ref, computed } from 'vue'
import { useRecord } from '../../logics/toolbar/useRecord'
import { useRecordAction } from '../../logics/recorder/useRecordAction'
import { useRecorder } from '../../logics/recorder/useRecorder'
import { ToolsStatus } from '../../types'
import './index.less'
// import { addEventListener } from '../../utils/dom'

function getDefaultToolsStatus(): ToolsStatus {
  return {
    recording: false,
    hovering: false,
    asserting: {
      screenshot: false,
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

function useToolbar() {
  const toolsStatus = useToolsStatus()
  const { recordAction, recordPreventedAction } = useRecordAction(toolsStatus)

  useRecorder(toolsStatus, recordAction)

  const recordBtnHandler = useRecord(toolsStatus)

  const tools = computed(() => [
    {
      icon: '',
      text: toolsStatus.value.recording ? '停止' : '开始',
      active: toolsStatus.value.recording,
      disabled: false,
      handler() {
        toolsStatus.value.recording && recordPreventedAction()
        recordBtnHandler()
      },
    },
    ...[
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
          recordAction({
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
        handler() {
          recordPreventedAction()
          window.__oopsTest_exit()
        },
      },
    ].map(tool => ({
      ...tool,
      handler() {
        if (!toolsStatus.value.recording) return
        tool.handler()
      },
      disabled: !toolsStatus.value.recording,
    })),
  ])

  return {
    tools,
  }
}

export default defineComponent({
  setup() {
    const { tools } = useToolbar()

    const toolbarVisible = ref(true)
    window.__oopsTest_toggleShowToolbar = (visible: boolean) => {
      toolbarVisible.value = visible
    }

    return () => (
      <div class="oops-test-toolbar" v-show={toolbarVisible.value}>
        {tools.value.map(tool => (
          <div
            class={[
              'oops-test-toolbar__item',
              tool.active ? 'oops-test-toolbar__item--active' : '',
              tool.disabled ? 'oops-test-toolbar__item--disabled' : '',
            ]}
            onClick={tool.handler}
          >
            {tool.text}
          </div>
        ))}
      </div>
    )
  },
})
