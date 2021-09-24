import Debug from 'debug'
import { merge } from 'lodash'
import { LaunchOptions, Browser, BrowserContext, Page } from 'playwright'
import { BrowserName, Action, Assertion, ManualAction, Case } from './types'
import { getBrowser } from './utils'
import expect from 'expect'
import { EventEmitter } from 'stream'

const debug = Debug('oops-test:runner')
interface RunnerOptions {
  browser?: BrowserName
  browserLaunchOptions?: LaunchOptions
}

interface MultiRunnerOptions {
  browsers: BrowserName[]
  browserLaunchOptions?: LaunchOptions
}

const DefaultRunnerOptions = {
  browserLaunchOptions: {
    headless: false,
    slowMo: 1000,
  },
}

class MultiRunner {
  private runners: Runner[] = []
  private options: MultiRunnerOptions = {
    browsers: ['chromium'],
    ...DefaultRunnerOptions,
  }

  constructor(options?: MultiRunnerOptions) {
    merge(this.options, options)
    for (const browser of this.options.browsers) {
      this.runners.push(
        new Runner({
          browser,
          browserLaunchOptions: this.options.browserLaunchOptions,
        }),
      )
    }
  }

  runCase(ca: Case) {
    this.runners.forEach(runner => runner.runCase(ca))
  }

  finish() {
    this.runners.forEach(runner => runner.finish())
  }
}

class Runner extends EventEmitter {
  private options: Required<RunnerOptions> = {
    browser: 'chromium',
    ...DefaultRunnerOptions,
  }

  private browser?: Browser

  private contextIdMap: Map<string, BrowserContext> = new Map()
  private contextMap: Map<BrowserContext, Map<string, Page>> = new Map()

  constructor(options?: RunnerOptions) {
    super()
    merge(this.options, options)
  }

  async runCase(cas: Case) {
    if (!this.browser) {
      await this.initBrowser()
    }

    for (const action of cas.actions) {
      await this.runAction(action)
    }
  }

  private async runAction(action: Action) {
    if (!this.browser) {
      debug(`Action: browser not found.`)
      return
    }
    if (action.action === 'assertion') {
      await this.runAssertion(action)
      return
    }
    if (action.action === 'newContext') {
      const {
        params: { id },
      } = action
      const context = await this.browser.newContext()
      this.contextIdMap.set(id, context)
      return
    }

    if (action.action === 'closeContext') {
      const {
        params: { id },
      } = action
      await this.getContext(id).close()
      return
    }

    if (action.action === 'newPage') {
      const {
        context: cxtId,
        params: { id: pageId, url },
      } = action
      const context = this.getContext(cxtId)
      const page = await context.newPage()
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      this.setPage(page, cxtId, pageId)
      return
    }

    if (action.action === 'closePage') {
      const {
        context: cxtId,
        params: { id: pageId },
      } = action
      await this.getPage(cxtId, pageId).close()
      return
    }

    if (action.action === 'error') {
      debug(`Action: action '${action.action}' is invalid.`)
      return
    }

    await this.runManualAction(action)
  }

  private async runManualAction(action: ManualAction) {
    const { context: cxtId, page: pageId, signals } = action
    const page = this.getPage(cxtId, pageId)

    let actionPromise = () => Promise.resolve()

    if (action.action === 'click') {
      actionPromise = () => page.click(action.params.selector)
    }
    if (action.action === 'hover') {
      actionPromise = () => page.hover(action.params.selector)
    }

    if (signals?.popup) {
      const [popupPage] = await Promise.all([page.waitForEvent('popup'), actionPromise()])
      this.setPage(popupPage, cxtId, signals.popup.pageId)
    } else {
      await actionPromise()
    }
  }

  private async runAssertion(action: Assertion) {
    const page = this.getPage(action.context, action.page)

    try {
      switch (action.params.type) {
        case 'newPage':
          expect(action.params.url).toBe(await page.evaluate('location.href'))
          break
        case 'innerText':
          expect(await page.textContent(action.params.selector)).toBe(action.params.content)
          break
      }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  private async initBrowser() {
    if (!this.browser) {
      this.browser = await getBrowser(this.options.browser).launch(this.options.browserLaunchOptions)
    }
  }

  private getContext(cxtId: string) {
    const context = this.contextIdMap.get(cxtId.toString())
    if (!context) {
      throw new Error(`Context(${cxtId}) not found.`)
    }
    return context
  }

  private getPage(cxtId: string, pageId: string) {
    const page = this.contextMap.get(this.getContext(cxtId))?.get(pageId)
    if (!page) {
      throw new Error(`Page(${pageId}) under Context(${cxtId}) not found.`)
    }
    return page
  }

  private setPage(page: Page, cxtId: string, pageId: string) {
    const context = this.getContext(cxtId)
    const pageMap = this.contextMap.get(context) ?? new Map()
    pageMap.set(pageId, page)
    this.contextMap.set(context, pageMap)
  }

  finish() {
    this.browser?.close()
  }
}

export { Runner, MultiRunner }
