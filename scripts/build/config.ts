export type Format = 'es' | 'cjs' | 'iife'

export const buildConfigs: {
  [target: string]: {
    formats: Format[]
    globalName?: string
  }
} = {
  cli: {
    formats: ['cjs'],
  },
  engine: {
    formats: ['es', 'cjs'],
  },
  inject: {
    formats: ['iife'],
    globalName: '__oopsTestInject',
  },
  marker: {
    formats: ['es', 'cjs'],
  },
}
