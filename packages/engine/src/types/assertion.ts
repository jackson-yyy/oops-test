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
    type: 'snapShot'
    selector: string
    snapshot: string
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
    }[]
  }
}
