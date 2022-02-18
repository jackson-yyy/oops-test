import { chromium, firefox, webkit, PageScreenshotOptions, Page, BrowserType } from 'playwright'
import { BrowserName } from '../types'
import pretty from 'pretty'

export function getBrowser(browser: BrowserName): BrowserType {
  return {
    chromium,
    firefox,
    webkit,
  }[browser]
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
export async function screenshot(
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
