import { NInput, useDialog, useNotification } from 'naive-ui'
import { ref, Ref, h } from 'vue'
import { ToolsStatus } from '../../types'

function useStartRecord(): () => Promise<void> {
  const dialog = useDialog()
  const notice = useNotification()
  const caseName = ref('')
  const saveMock = ref(true)

  const errorMsg = {
    fail: '创建用例失败，请重试！',
    exist: '用例已存在，请删除用例或者更改用例名！',
  }

  return function () {
    return new Promise((res, rej) => {
      dialog.info({
        title: '请输入用例名称',
        content: () =>
          h(NInput, {
            value: caseName.value,
            onInput(value: string) {
              caseName.value = value
            },
          }),
        positiveText: '确认',
        onNegativeClick: rej,
        async onPositiveClick() {
          const result = await window.__oopsTest_startRecord({
            context: window.__oopsTest_contextId,
            page: window.__oopsTest_pageId,
            url: location.href,
            name: caseName.value,
            saveMock: saveMock.value,
          })

          if (result === 'success') {
            res()
            return true
          }

          notice.error({
            content: errorMsg[result],
            duration: 3000,
          })
          return false
        },
      })
    })
  }
}

export function useRecord(toolsStatus: Ref<ToolsStatus>): () => Promise<void> {
  const startRecord = useStartRecord()

  return async function handler() {
    if (!toolsStatus.value.recording) {
      await startRecord()
      toolsStatus.value.recording = true
      window.location.reload()
    } else {
      window.__oopsTest_finishRecord({
        context: window.__oopsTest_contextId,
      })
      toolsStatus.value.recording = false
    }
  }
}
