const colors = require('colors')
import { getLogger } from 'log4js'
import { LOG_SCOPE } from '@/constants/constants'

colors.setTheme({
  info: ['cyan', 'bold'],
  help: 'cyan',
  warn: 'yellow',
  success: 'blue',
  error: ['red', 'bold'],
})

export function errorLogger(error: Error | string, scope?: string): null {
  const logger = getLogger(scope || 'default')
  logger.error(`${error instanceof Error ? error.stack : error}`)
  return null
}

export function debugLogger(scope: string): void {
  const logger = getLogger(scope)
  logger.info(`[${scope}] initiated!`['info'])
}

export function infoLogger(scope: string, info: string) {
  const logger = getLogger(`[${scope}]`)
  logger.info(info)
}

export const decoratorLogger = (type: string, scope: string, name: string) => {
  const logger = getLogger(LOG_SCOPE.DECORATOR)
  logger.info(
    `${colors.red.bold(`[${type}]`)} -- ${colors.yellow.bold(
      `[${scope}]`
    )}: ${colors.cyan.bold(`${name}`)} ${colors.green.bold(`completed!`)}`
  )
}
