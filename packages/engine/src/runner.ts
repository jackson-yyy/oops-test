import Debug from 'debug'
import { merge } from 'lodash'
import { LaunchOptions, Browser, BrowserContext, Page } from 'playwright'
import { BrowserName, Action, Assertion } from './types'
import { getBrowser } from './utils'
import expect from 'expect'

const debug = Debug('oops-test:runner')

interface RunnerOptions {
  browser: BrowserName
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

  run(actions: Action[]) {
    this.runners.forEach(runner => runner.run(actions))
  }
}

class Runner {
  private options: Required<RunnerOptions> = {
    browser: 'chromium',
    ...DefaultRunnerOptions,
  }

  private browser?: Browser

  private contextIdMap: Map<string, BrowserContext> = new Map()
  private contextMap: Map<BrowserContext, Map<string, Page>> = new Map()

  constructor(options?: RunnerOptions) {
    merge(this.options, options)
  }

  async run(actions: Action[]) {
    await this.initBrowser()
    for (const action of actions) {
      await this.runAction(action)
    }
  }

  private async runAction(action: Action) {
    if (!this.browser) {
      debug(`Action: browser not found.`)
      return
    }
    switch (action.action) {
      case 'assertion':
        await this.runAssertion(action)
        break
      case 'newContext':
        {
          const {
            params: { id },
          } = action
          const context = await this.browser.newContext()
          this.contextIdMap.set(id, context)
        }
        break

      case 'closeContext':
        {
          const {
            params: { id },
          } = action
          await this.getContext(id).close()
        }
        break

      case 'newPage':
        {
          const {
            context: cxtId,
            params: { id: pageId, url },
          } = action
          const context = this.getContext(cxtId)
          const page = await context.newPage()
          await page.goto(url, { waitUntil: 'domcontentloaded' })

          this.setPage(page, cxtId, pageId)
        }
        break

      case 'closePage':
        {
          const {
            context: cxtId,
            params: { id: pageId },
          } = action
          await this.getPage(cxtId, pageId).close()
        }
        break

      case 'click':
        {
          const {
            context: cxtId,
            page: pageId,
            signals,
            params: { selector },
          } = action
          const page = this.getPage(cxtId, pageId)
          await page.click(selector)

          for (const signal of signals ?? [])
            if (signal.name === 'popup') {
              const popupPage = await page.waitForEvent('popup')
              this.setPage(popupPage, cxtId, signal.pageId)
            }
        }
        break

      case 'mousemove':
        {
          const {
            context,
            page,
            params: { x, y },
          } = action
          await this.getPage(context, page!).mouse.move(x, y)
        }
        break
      default:
        debug(`Action: action '${action.action}' is invalid.`)
    }
  }

  private async runAssertion(action: Assertion) {
    const page = this.getPage(action.context, action.page)

    switch (action.params.type) {
      case 'newPage':
        expect(action.params.url).toBe(await page.evaluate('location.href'))
        break
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
}

export { Runner, MultiRunner }
