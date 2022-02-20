import odiff from 'odiff-bin'
import { Page, PageScreenshotOptions } from 'playwright'
import expect from 'expect'
import pretty from 'pretty'
import { Assertion, ScreenshotAssertion, SnapshotAssertion, UrlAssertion } from './types'
import { appendFile } from './utils/fs'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

/**
 * 获取
 *
 * @export
 * @param {Page} page
 * @param {{
 *     path: string
 *     selector: string
 *     filter?: (snap: string) => string
 *   }} {
 *     path,
 *     selector,
 *     filter = str => str,
 *   }
 */
export async function getSnapshot(
  page: Page,
  {
    selector,
    filter = str => str,
  }: {
    selector: string
    filter?: (snap: string) => string
  },
) {
  const snapshot = await page.locator(selector).evaluate(node => node.outerHTML)
  return filter(pretty(snapshot))
}

/**
 * 读取快照信息
 *
 * @param {string} snapshotPath
 * @returns {Record<string, string>}
 */
function readSnapshots(snapshotPath: string): Record<string, string> {
  const data = Object.create(null)
  let snapshotContents = ''

  if (existsSync(snapshotPath)) {
    snapshotContents = readFileSync(snapshotPath, 'utf8')
    const populate = new Function('exports', snapshotContents)
    populate(data)
  }

  return data
}

/**
 * 截图工具
 *
 * @export
 * @param {Page} page
 * @param {{
 *     path: string
 *     selector?: string
 *   }} options
 */
async function screenshot(
  page: Page,
  options: {
    path: string
    selector?: string
  },
) {
  const screenshotParams: PageScreenshotOptions = {}
  if (options.selector) {
    const boudingRect = await page.locator(options.selector).boundingBox()
    if (boudingRect) {
      screenshotParams.clip = boudingRect
    }
  }
  // FIXME:odiff暂时不支持buffer对比和输出，官方近期会开始支持，这里先直接生成图片
  await page.screenshot({
    path: options.path,
    ...screenshotParams,
  })
}

interface AssertorOptions {
  runtimeDir: string
  snapshotFile: string
  screenshotsDir: string
  snapshotFilter?: (snap: string) => string
}

export class Assertor {
  private options!: AssertorOptions
  private snapshots: Record<string, string> = {}

  constructor(options: AssertorOptions) {
    this.options = options
  }

  /**
   * 加载本地的快照信息
   *
   * @memberof Assertor
   */
  loadSnapshots() {
    this.snapshots = readSnapshots(this.options.snapshotFile)
  }

  /**
   * 断言
   *
   * @param {Assertion} assertion
   * @param {Page} page
   * @memberof Assertor
   */
  async assert(assertion: Assertion, page: Page) {
    switch (assertion.params.type) {
      case 'url':
        await this.runUrlAssertion(assertion as UrlAssertion, page)
        break
      case 'snapshot':
        await this.assertSnapshot(assertion as SnapshotAssertion, page)
        break
      case 'screenshot':
        await this.assertScreenshot(assertion as ScreenshotAssertion, page)
        break
    }
  }

  /**
   * 截图断言
   *
   * @param {ScreenshotAssertion} assertion
   * @param {Page} page
   * @memberof Assertor
   */
  async assertScreenshot(assertion: ScreenshotAssertion, page: Page) {
    await screenshot(page, {
      path: join(this.options.screenshotsDir, assertion.params.name),
      selector: assertion.params.selector,
    })
  }

  /**
   * 快照断言
   *
   * @param {SnapshotAssertion} assertion
   * @param {Page} page
   * @memberof Assertor
   */
  async assertSnapshot(assertion: SnapshotAssertion, page: Page) {
    const snapshot = await getSnapshot(page, {
      selector: assertion.params.selector,
      filter: this.options.snapshotFilter,
    })
    appendFile(this.options.snapshotFile, `exports[\`${assertion.params.name}\`] = \`${snapshot}\`\n\n`)
  }

  /**
   * 执行断言
   *
   * @param {Assertion} assertion
   * @param {Page} page
   * @memberof Assertor
   */
  async runAssertion(assertion: Assertion, page: Page) {
    switch (assertion.params.type) {
      case 'url':
        await this.runUrlAssertion(assertion as UrlAssertion, page)
        break

      case 'screenshot':
        await this.runScreenshotAssertion(assertion as ScreenshotAssertion, page)
        break

      case 'snapshot':
        await this.runSnapshotAssertion(assertion as SnapshotAssertion, page)
        break

      default:
        throw new Error('[Assertor] 不支持当前断言类型！')
    }
  }

  /**
   * 执行url断言
   *
   * @param {UrlAssertion} assertion
   * @param {Page} page
   * @memberof Assertor
   */
  runUrlAssertion(assertion: UrlAssertion, page: Page) {
    expect(page.url()).toBe(assertion.params.url)
  }

  /**
   * 执行截图断言
   *
   * @param {ScreenshotAssertion} assertion
   * @param {Page} page
   * @memberof Assertor
   */
  async runScreenshotAssertion(assertion: ScreenshotAssertion, page: Page) {
    await screenshot(page, {
      path: join(this.options.runtimeDir, assertion.params.name),
      selector: assertion.params.selector,
    })

    const { match } = await odiff.compare(
      join(this.options.screenshotsDir, assertion.params.name),
      join(this.options.runtimeDir, assertion.params.name),
      join(this.options.runtimeDir, `diff_${assertion.params.name}`),
    )

    if (!match) throw new Error(chalk.red(`screenshot ${assertion.params.name} compare fail!`))
  }

  /**
   * 执行快照断言
   *
   * @param {SnapshotAssertion} assertion
   * @param {Page} page
   * @param {string} expectSnap
   * @memberof Assertor
   */
  async runSnapshotAssertion(assertion: SnapshotAssertion, page: Page) {
    expect(
      await getSnapshot(page, {
        selector: assertion.params.selector,
      }),
    ).toBe(this.snapshots[assertion.params.name])
  }
}
