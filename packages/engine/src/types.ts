import type { Action as ActionItem } from 'types/action'
export * from '../../../types/action'

export type BrowserName = 'chromium' | 'firefox' | 'webkit'

export type Action = ActionItem & {
  page?: string
  context: string
}
