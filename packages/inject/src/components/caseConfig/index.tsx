import { NForm, NFormItem, NInput, NSwitch } from 'naive-ui'
import { defineComponent } from 'vue'
import { func, object } from 'vue-types'

interface CaseInfo {
  name: string
  saveMock: boolean
  viewPort?: {
    width: number
    height: number
  }
}

// TODO:校验输入合法性
export default defineComponent({
  props: {
    info: object<CaseInfo>().isRequired,
    onChange: func<(info: CaseInfo) => void>().isRequired,
  },
  setup(props) {
    function onValChange(changedVal: Partial<typeof props.info>) {
      props.onChange({
        ...props.info,
        ...changedVal,
      })
    }

    return () => (
      <NForm>
        <NFormItem label="用例名" path="name">
          <NInput value={props.info.name} minlength={2} maxlength={50} onInput={val => onValChange({ name: val })} />
        </NFormItem>
        <NFormItem label="是否保存接口数据" path="saveMock">
          <NSwitch value={props.info.saveMock} onChange={val => onValChange({ saveMock: val })} />
        </NFormItem>
      </NForm>
    )
  },
})
