import { defineComponent } from 'vue'
import { NDialogProvider, NNotificationProvider } from 'naive-ui'
import Toolbar from './toolbar'

export default defineComponent({
  render() {
    return (
      <NDialogProvider>
        <NNotificationProvider>
          <Toolbar></Toolbar>
        </NNotificationProvider>
      </NDialogProvider>
    )
  },
})
