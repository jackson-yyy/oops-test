import dayjs from 'dayjs'
import { defineComponent, ref, computed } from 'vue'
import { useRecord } from '../../logics/toolbar/useRecord'
import { useRecorder } from '../../logics/useRecorder'
import { ToolsStatus } from '../../types'
import './index.less'

export default defineComponent({
  setup() {
    const { tools } = useToolbar()

    return () => (
      <div class="oops-test-toolbar">
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

function useToolsStatus() {
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

  const toolsStatusHistory = localStorage.getItem('__oopsTest_toolsStatus')

  const toolsStatus = ref<ToolsStatus>(toolsStatusHistory ? JSON.parse(toolsStatusHistory) : getDefaultToolsStatus())

  localStorage.removeItem('__oopsTest_toolsStatus')

  return toolsStatus
}

function useToolbar() {
  const toolsStatus = useToolsStatus()

  useRecorder(toolsStatus)

  const recordHandler = useRecord(toolsStatus)

  const tools = computed(() => [
    {
      icon: '',
      text: toolsStatus.value.recording ? '停止' : '开始',
      active: toolsStatus.value.recording,
      disabled: false,
      handler: recordHandler,
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
