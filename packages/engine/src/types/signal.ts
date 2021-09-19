export type Signal = PopupSignal

export type SignalType = 'popup'

export interface BaseSignal {
  name: SignalType
}
export interface PopupSignal extends BaseSignal {
  name: 'popup'
  pageId: string
}
