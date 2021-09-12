import { BaseAction } from './action'

export type Assertion = NewPageAssertion

export type AssertionType = 'newPage' | 'text'

export interface BaseAssertion extends BaseAction {
  action: 'assertion'
  context: string
  page: string
  params: {
    type: AssertionType
  }
}

export interface NewPageAssertion extends BaseAssertion {
  params: {
    type: 'newPage'
    url: string
  }
}
