import { Action as ActionItem } from 'types/action'

export type Action = Omit<ActionItem, 'context' | 'page'>
