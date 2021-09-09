import merge from 'lodash-es/merge'
import path from 'path'
import { BrowserContext, Browser } from 'playwright'
import { EventEmitter } from 'stream'
import { BrowserName, Action } from './types'
import { getUuid, getBrowser } from './utils'

interface RecorderOptions {
  // 开启时，recorder会自动记录页面的所有请求数据，当做用例重跑时的数据源
  saveMock: boolean
}

class Recorder extends EventEmitter {
  private browser?: Browser
  private context?: BrowserContext
  private contextId?: string
  private actionsRecord: Action[] = []

  private options: RecorderOptions = {
    saveMock: true,
  }

  get actions() {
    return this.actionsRecord
  }

  constructor(options: RecorderOptions) {
    super()
    merge(this.options, options)
  }

  private async initContext() {
    this.context = await this.browser!.newContext()
    this.contextId = getUuid()

    this.addAction({
      action: 'newContext',
      params: {
        id: this.contextId!,
      },
    })

    this.context?.on('close', () => {
      this.addAction({
        action: 'closeContext',
        params: {
          id: this.contextId!,
        },
      })
      this.finish()
    })
  }

  private async initPage(url: string) {
    const page = await this.context!.newPage()
    const pageId = getUuid()

    page.on('close', () => {
      this.addAction({
        action: 'closePage',
        context: this.contextId!,
        params: {
          id: pageId,
        },
      })
    })

    // FIXME:这里打包后，会找不到node_modules
    await page.addInitScript({
      path: path.join(__dirname, '../node_modules/@oops-test/inject/dist/index.global.js'),
    })

    await page.exposeBinding('_oopsTestRecordAction', (_source, action: Action) => {
      this.addAction({
        ...action,
        page: pageId,
        context: this.contextId!,
      })
    })

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    await page.evaluate(`window._oopsTestInject._oopsTestInitScript()`)

    this.addAction({
      action: 'newPage',
      context: this.contextId!,
      params: {
        url,
        id: pageId,
      },
    })
  }

  private addAction(action: Action) {
    this.actionsRecord.push(action)
    this.emit('addAction', action)
  }

  async start({ url = 'http://localhost:8080', browser = 'chromium' }: { url: string; browser?: BrowserName }) {
    this.browser = await getBrowser(browser).launch({ headless: false })
    this.browser.on('disconnected', this.finish)

    await this.initContext()
    await this.initPage(url)
  }

  private finish() {
    this.browser?.close()
    this.emit('recordFinish')
  }
}

export { Recorder }
