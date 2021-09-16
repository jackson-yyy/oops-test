import Debug from 'debug'
import { merge } from 'lodash'
import path from 'path'
import { BrowserContext, Browser, Page } from 'playwright'
import { EventEmitter } from 'stream'
import { BrowserName, Action, Signal } from './types'
import { getUuid, getBrowser } from './utils'

const debug = Debug('oops-test:runner')

interface RecorderOptions {
  // 开启时，recorder会自动记录页面的所有请求数据，当做用例重跑时的数据源
  saveMock: boolean
}

class Recorder extends EventEmitter {
  private browser?: Browser
  private context?: BrowserContext
  private contextId?: string

  private actionsRecord: Action[] = []
  // private requestData

  private options: RecorderOptions = {
    saveMock: true,
  }

  get actions() {
    return this.actionsRecord
  }

  constructor(options?: RecorderOptions) {
    super()
    merge(this.options, options)
  }

  private async initContext() {
    this.context = await this.browser!.newContext()
    this.contextId = getUuid()

    this.context.on('page', page => {
      this.onPage(page)
    })

    await this.context.addInitScript({
      path: path.join(__dirname, '../inject/index.js'),
    })

    await this.context.exposeBinding('__oopsTestRecordAction', (_source, action: Action) => {
      this.addAction(action)
    })

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

  private async onPage(page: Page, pageId = getUuid()) {
    this.preparePage(page, pageId)

    await page.waitForEvent('domcontentloaded')

    if (await page.opener()) {
      this.setSignal({
        name: 'popup',
        pageId: pageId,
      })

      this.addAction({
        action: 'assertion',
        context: this.contextId!,
        page: pageId,
        params: {
          type: 'newPage',
          url: page.url(),
        },
      })
    } else {
      this.addAction({
        action: 'newPage',
        context: this.contextId!,
        params: {
          url: page.url(),
          id: pageId,
        },
      })
    }
  }

  private preparePage(page: Page, pageId = getUuid()) {
    page.on('close', () => {
      this.addAction({
        action: 'closePage',
        context: this.contextId!,
        params: {
          id: pageId,
        },
      })
    })

    page.on('requestfinished', debug)
    page.on('response', debug)

    page.on('domcontentloaded', async pg => {
      pg.evaluate(`window.__oopsTestInject.initScript()`)
      page.evaluate(`window.__oopsTestContextId = '${this.contextId}'`)
      page.evaluate(`window.__oopsTestPageId = '${pageId}'`)
    })
  }

  private addAction(action: Action) {
    this.actionsRecord.push(action)
  }

  private setSignal(signal: Signal) {
    let action = this.actionsRecord[this.actionsRecord.length - 1]
    if (!action) return
    action.signals = [...(action?.signals ?? []), signal]
  }

  async start({ url = 'http://localhost:8080', browser = 'chromium' }: { url: string; browser?: BrowserName }) {
    this.browser = await getBrowser(browser).launch({ headless: false })
    this.browser.on('disconnected', this.finish)

    await this.initContext()

    const page = await this.context!.newPage()
    await page.goto(url)
  }

  private finish() {
    this.browser?.close()
    this.emit('finish')
  }
}

export { Recorder }
