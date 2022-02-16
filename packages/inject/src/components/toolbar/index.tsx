import { defineComponent, ref } from 'vue'
import { useToolbar } from '../../logics/toolbar/useToolbar'
import { ToolInfo } from '../../types'
import './index.less'
// import { addEventListener } from '../../utils/dom'

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
            onClick={tool.handler ?? null}
          >
            {tool.text}
          </div>
        ))}
      </div>
    )
  },
})
