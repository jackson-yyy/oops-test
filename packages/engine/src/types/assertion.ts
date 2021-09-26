import { BaseAction } from './action'

export type Assertion = NewPageAssertion | InnerTextAssertion | ScreenshotAssertion

export interface BaseAssertion extends BaseAction {
  action: 'assertion'
  context: string
  page: string
  params: {
    type: string
  }
}

export interface NewPageAssertion extends BaseAssertion {
  params: {
    type: 'newPage'
    url: string
  }
}

export interface InnerTextAssertion extends BaseAssertion {
  params: {
    type: 'innerText'
    selector: string
    content: string
  }
}

export interface ScreenshotAssertion extends BaseAssertion {
  params: {
    type: 'screenshot'
    name: string
  }
}
