export type Signal = PopupSignal | NavigateSignal

export interface BaseSignal {
  name: string
}

export interface PopupSignal extends BaseSignal {
  name: 'popup'
  pageId: string
}

export interface NavigateSignal extends BaseSignal {
  name: 'navigate'
  pageId: string
}
