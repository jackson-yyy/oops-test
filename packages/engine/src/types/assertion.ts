import { BaseManualAction } from './action'

export type Assertion = UrlAssertion | SnapshotAssertion | ScreenshotAssertion

export interface BaseAssertion extends BaseManualAction {
  action: 'assertion'
  context: string
  page: string
  params: {
    type: string
  }
}

export interface UrlAssertion extends BaseAssertion {
  params: {
    type: 'url'
    url: string
  }
}

export interface SnapshotAssertion extends BaseAssertion {
  params: {
    type: 'snapshot'
    selector: string
    name: string
  }
}

export interface ScreenshotAssertion extends BaseAssertion {
  params: {
    type: 'screenshot'
    name: string
    selector?: string
    area?: {
      x: number
      y: number
      height: number
      width: number
    }
  }
}
