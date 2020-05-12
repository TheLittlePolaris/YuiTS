import request from 'request'
import { errorLogger } from '@/handlers/log.handler'
import { TenorApiQueryResult } from '../feature-interfaces/tenor-query.interface'
import { launch } from 'puppeteer'
import { compile } from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'

export function isMyOwner(userId: string) {
  return userId === global?.config?.ownerId
}

export function tenorRequestService(
  query: string
): Promise<TenorApiQueryResult> {
  return new Promise<TenorApiQueryResult>((resolve, reject) => {
    request(
      `https://api.tenor.com/v1/search?q=${encodeURIComponent(
        `anime ${query}`
      )}&key=${global?.config?.tenorKey}&limit=10&media_filter=basic&anon_id=${
        global?.config?.tenorAnonymousId
      }`,
      (err: string, _, body: string) => {
        if (err) return reject(err)
        const json = JSON.parse(body)
        const { error } = json
        if (error) reject(handleRequestErrors(error))
        resolve(json)
      }
    )
  })
}

function handleRequestErrors(error: string): null {
  return errorLogger(error, 'UTILITY_SERVICE')
}

export const subscriberCountFormatter = (number: number | string) => {
  number = typeof number === 'string' ? Number(number) : number
  let result: string

  if (number > 0 && number <= 999) result = `${number}`
  else if (number > 999 && number <= 999999)
    result = `${(number / 1000).toFixed(2)}K`
  else if (number > 999999 && number <= 999999999)
    result = `${(number / 1000000).toFixed(2)}M`
  else result = `${number}`

  return result.includes('.00') ? result.replace('.00', '') : result
}

export const dateTimeJSTFormatter = (iso8601DateString: string) =>
  `${new Date(iso8601DateString).toLocaleString('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })} JST`

export const pingImageGenerator = async (ping: number, rtt: number) => {
  const sourceImg = readFileSync(
    join(__dirname, '../../../../assets/images/yuipfp.png')
  )
  const html = await readFileSync(
    join(__dirname, '../../../../assets/views/ping.html')
  ).toString('utf-8')
  const base64Image = Buffer.from(sourceImg).toString('base64')
  const dataURI = 'data:image/png;base64,' + base64Image

  const image = await imageCompiler({
    html,
    content: { imageContent: dataURI, ping, rtt },
    puppeteerOptions: {
      defaultViewport: {
        width: 700,
        height: 180,
      },
    },
  })
  return image
}

export const imageCompiler = async (compiperOptions: {
  html: string
  output?: string
  type?: string
  content?: { [key: string]: any }
  transparent?: boolean
  puppeteerOptions?: { [key: string]: any }
  encoding?: string
}): Promise<Buffer> => {
  const {
    html,
    output,
    type,
    content,
    transparent = false,
    puppeteerOptions = {},
    encoding = 'binary',
  } = compiperOptions

  if (!html) {
    throw Error('You must provide an html property.')
  }

  const browser = await launch({
    ...puppeteerOptions,
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  const compileContent = () => {
    const template = compile(html)
    return template(content)
  }
  const compiledHtml = content ? compileContent() : html
  await page.setContent(compiledHtml)
  const element = await page.$('body')
  const buffer = await element.screenshot({
    ...(output ? { path: output } : {}),
    type,
    omitBackground: transparent,
    encoding,
  })
  await browser.close()
  return buffer
}

/**
 * : `<html>
        <head>
          <style>
            .polaris-content {
              background-image: radial-gradient(
                circle,
                rgba(255, 255, 255, 0.904) 20%,
                rgba(0, 235, 219, 0.849),
                rgba(198, 110, 248, 0.884)
              );
              background-size: cover;
              background-repeat: no-repeat;
              display: flex;
              justify-content: center;
              padding: 15px;
              height: 150px;
            }      
            .image {
              width: 150px;
              height: 150px;
              border-radius: 50%;
              justify-content: center;
            }
            .content {
              text-align: left;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .ping {
              font-family: "Times New Roman", Times, serif;
              font-weight: bolder;
              font-size: 30px;
              margin: 0;
              padding-left: 15px;
              line-height: 66px;
              color: darkorange;
            }
          </style>
        </head>
        <body>
          <div class="polaris-content">
            <img class="image" src="{{ imageContent }}" alt="" />
            <div class="content">
              <p class="ping">Yui's ping: {{ ping }}ms</p>
              <p class="ping">Estimated message RTT: {{ rtt }}ms</p>
            </div>
          </div>
        </body>
      </html>
      `
 */
