import { Assertor } from './assertor'
import Debug from 'debug'
import { merge } from 'lodash'
import path, { join } from 'path'
import { BrowserContext, Browser, Page } from 'playwright'
import { EventEmitter } from 'stream'
import { BrowserName, Action, EngineApis } from './types'
import { getBrowser } from './utils/common'
import { getUuid } from './utils/uuid'
import { CaseManger } from './caseManager'

const debug = Debug('oops-test:runner')
interface RecorderOptions {
  output: string
  snapshotFilter?: (snap: string) => string
}

class Recorder extends EventEmitter {
  private browser?: Browser

  private caseManger?: CaseManger
  private assertor?: Assertor

  private options: RecorderOptions = {
    output: process.cwd(),
  }

  private recording = false

  constructor(options?: Partial<RecorderOptions>) {
    super()
    merge(this.options, options)
  }

  private async prepareContext(context: BrowserContext, ctxId = getUuid()) {
    context.on('page', page => {
      this.onPage(page, ctxId)
    })

    context.on('close', () => {
      this.recordAction({
        action: 'closeContext',
        params: {
          id: ctxId,
        },
      })
    })

    await context.addInitScript({
      path: path.join(__dirname, '../inject/index.js'),
    })

    const isRecording: EngineApis['__oopsTest_isRecording'] = () => this.recording

    await context.exposeFunction('__oopsTest_isRecording', isRecording)
    await context.exposeBinding('__oopsTest_recordAction', ({ page }, action: Action) => {
      this.recordAction(action)

      if (action.action === 'assertion') {
        this.assertor?.assert(action, page)
      }
    })
    await context.exposeFunction('__oopsTest_createCase', this.createCase)
    await context.exposeFunction('__oopsTest_startRecord', this.startRecord)
    await context.exposeFunction('__oopsTest_finishRecord', this.finishRecord)
    await context.exposeFunction('__oopsTest_exit', this.exit)
  }

  private async onPage(page: Page, ctxId: string, pageId = getUuid()) {
    this.preparePage(page, ctxId, pageId)

    if (await page.opener()) {
      this.caseManger?.setSignal({
        name: 'popup',
        pageId: pageId,
      })
    } else {
      await page.waitForEvent('domcontentloaded')
      this.recordAction({
        action: 'newPage',
        context: ctxId,
        params: {
          url: page.url(),
          id: pageId,
        },
      })
    }
  }

  private preparePage(page: Page, ctxId: string, pageId = getUuid()) {
    page.on('close', () => {
      this.recordAction({
        action: 'closePage',
        context: ctxId,
        params: {
          id: pageId,
        },
      })
    })

    page.on('requestfinished', debug)
    page.on('response', debug)

    page.on('load', () => {
      page.evaluate(`window.__oopsTest_contextId = '${ctxId}'`)
      page.evaluate(`window.__oopsTest_pageId = '${pageId}'`)
    })
  }

  private async recordAction(action: Action) {
    if (!this.recording) return
    this.caseManger?.recordAction(action)
  }

  private createCase: EngineApis['__oopsTest_createCase'] = caseInfo => {
    this.caseManger = new CaseManger(join(this.options.output, caseInfo.name))
    this.assertor = new Assertor({
      ...this.caseManger.pathResolve,
      snapshotFilter: this.options.snapshotFilter,
    })
    return this.caseManger.create(caseInfo)
  }

  async start({ url = 'http://localhost:8080', browser = 'chromium' }: { url: string; browser?: BrowserName }) {
    this.browser = await getBrowser(browser).launch({ headless: false })
    this.browser.on('disconnected', this.exit)

    const contextId = getUuid()
    const context = await this.browser.newContext()
    await this.prepareContext(context, contextId)

    const page = await context.newPage()
    await page.goto(url)
  }

  private startRecord: EngineApis['__oopsTest_startRecord'] = ({ context, page, url }) => {
    this.recording = true

    this.recordAction({
      action: 'newContext',
      params: {
        id: context,
      },
    })
    this.recordAction({
      action: 'newPage',
      context,
      params: {
        id: page,
        url,
      },
    })

    this.syncStatus()
  }

  private finishRecord: EngineApis['__oopsTest_finishRecord'] = async ({ context }: { context: string }) => {
    this.recordAction({
      action: 'closeContext',
      params: {
        id: context,
      },
    })
    this.recording = false
    this.caseManger?.save()
    this.syncStatus()
  }

  private exit: EngineApis['__oopsTest_exit'] = async () => {
    await Promise.all(this.browser?.contexts().map(ctx => ctx.close()) ?? [])
    this.browser?.close()
    this.emit('exit')
  }

  private syncStatus() {
    this.browser?.contexts().forEach(cxt => {
      cxt.pages().forEach(page => {
        page.evaluate(`window.__oopsTest_syncStatus(${this.recording})`)
      })
    })
  }
}

export { Recorder }
