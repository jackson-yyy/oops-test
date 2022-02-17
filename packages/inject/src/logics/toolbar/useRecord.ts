import { useDialog, useNotification } from 'naive-ui'
import { ref, Ref, h } from 'vue'
import { ToolsStatus } from '../../types'
import CaseConfig from '../../components/caseConfig/index'

function useStartRecord(): () => Promise<void> {
  const dialog = useDialog()
  const notice = useNotification()

  const caseInfo = ref({
    name: '',
    saveMock: true,
  })

  const errorMsg = {
    fail: '创建用例失败，请重试！',
    exist: '用例已存在，请删除用例或者更改用例名！',
  }

  return function () {
    return new Promise((res, rej) => {
      dialog.info({
        title: '请输入用例名称',
        content: () =>
          h(CaseConfig, {
            info: caseInfo.value,
            onChange(info) {
              caseInfo.value = info
            },
          }),
        positiveText: '确认',
        onNegativeClick: rej,
        async onPositiveClick() {
          const createResult = await window.__oopsTest_createCase(caseInfo.value)

          if (createResult !== 'success') {
            notice.error({
              title: '创建用例失败！',
              content: errorMsg[createResult],
              duration: 3000,
            })
            rej()
            return false
          }

          notice.success({
            content: '创建用例成功！',
            duration: 3000,
          })

          await window.__oopsTest_startRecord({
            context: window.__oopsTest_contextId,
            page: window.__oopsTest_pageId,
            url: location.href,
          })
          res()
          return true
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
