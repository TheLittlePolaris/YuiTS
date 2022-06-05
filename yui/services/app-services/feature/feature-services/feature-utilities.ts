export const subscriberCountFormatter = (number: number | string): string => {
  number = typeof number === 'string' ? Number(number) : number
  let result: string

  if (number > 0 && number <= 999) result = `${number}`
  else if (number > 999 && number <= 999999) result = `${(number / 1000).toFixed(2)}K`
  else if (number > 999999 && number <= 999999999) result = `${(number / 1000000).toFixed(2)}M`
  else result = `${number}`

  return result.includes('.00') ? result.replace('.00', '') : result
}

export const dateTimeJSTFormatter = (iso8601DateString: string): string =>
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

// export const pingImageGenerator = async (ping: number, rtt: number) => {
//   const sourceImg = readFileSync(
//     join(__dirname, '../../../../assets/images/yuipfp.png')
//   )
//   const html = await readFileSync(
//     join(__dirname, '../../../../assets/views/ping.html')
//   ).toString('utf-8')
//   const base64Image = Buffer.from(sourceImg).toString('base64')
//   const dataURI = 'data:image/png;base64,' + base64Image

//   const image = await imageCompiler({
//     html,
//     content: { imageContent: dataURI, ping, rtt },
//     puppeteerOptions: {
//       defaultViewport: {
//         width: 700,
//         height: 180,
//       },
//     },
//   })
//   return image
// }

// export const imageCompiler = async (compiperOptions: {
//   html: string
//   output?: string
//   type?: string
//   content?: { [key: string]: any }
//   transparent?: boolean
//   puppeteerOptions?: { [key: string]: any }
//   encoding?: string
// }): Promise<Buffer> => {
//   const {
//     html,
//     output,
//     type,
//     content,
//     transparent = false,
//     puppeteerOptions = {},
//     encoding = 'binary',
//   } = compiperOptions

//   if (!html) {
//     throw Error('You must provide an html property.')
//   }

//   const browser = await launch({
//     ...puppeteerOptions,
//     headless: true,
//     args: ['--no-sandbox'],
//   })
//   const page = await browser.newPage()
//   const compileContent = () => {
//     const template = compile(html)
//     return template(content)
//   }
//   const compiledHtml = content ? compileContent() : html
//   await page.setContent(compiledHtml)
//   const element = await page.$('body')
//   const buffer = await element.screenshot({
//     ...(output ? { path: output } : {}),
//     type,
//     omitBackground: transparent,
//     encoding,
//   })
//   await browser.close()
//   return buffer
// }
