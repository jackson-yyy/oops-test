import { defineComponent } from 'vue'
import { NDialogProvider, NNotificationProvider } from 'naive-ui'

export default defineComponent({
  setup(_, { slots }) {
    return () => (
      <NDialogProvider to=".oops-test">
        <NNotificationProvider to=".oops-test">{slots}</NNotificationProvider>
      </NDialogProvider>
    )
  },
})
