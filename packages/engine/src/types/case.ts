import { Action } from './action'

export interface Case {
  name: string
  saveMock: boolean
  skip: boolean
  actions: Action[]
}
