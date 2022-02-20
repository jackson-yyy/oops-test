import { defineComponent } from 'vue'
import { NDialogProvider, NNotificationProvider } from 'naive-ui'
import Toolbar from './components/toolbar/index'
import Inspector from './components/inspector/index'
import { useToolbar } from './logics/toolbar/useToolbar'

export default defineComponent({
  setup() {
    const { tools, toolsStatus } = useToolbar()

    return () => (
      <>
        <Toolbar tools={tools.value} />
        <Inspector toolsStatus={toolsStatus.value} />
      </>
    )
  },
})
