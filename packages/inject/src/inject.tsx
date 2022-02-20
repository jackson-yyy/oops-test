import { defineComponent } from 'vue'
import { NDialogProvider, NNotificationProvider } from 'naive-ui'
import Toolbar from './components/toolbar/index'

export default defineComponent({
  render() {
    return (
      <NDialogProvider to=".oops-test">
        <NNotificationProvider to=".oops-test">
          <Toolbar></Toolbar>
        </NNotificationProvider>
      </NDialogProvider>
    )
  },
})
