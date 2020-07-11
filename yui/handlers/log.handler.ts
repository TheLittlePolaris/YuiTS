import { LOG_SCOPE } from '@/constants/constants'
import { red, yellow, cyan, green } from 'chalk'
import { getLogger } from 'log4js'

export function errorLogger(error: Error | string, scope?: string): null {
  const logger = getLogger(scope || 'default')
  logger.error(`${error instanceof Error ? error.stack : error}`)
  return null
}

export function debugLogger(scope: string, detail?: string): void {
  const logger = getLogger(`[${scope}]`)
  logger.info(cyan.bold(`${detail ? `[${detail}] initiated!` : `Initiated!`}`))
}

export function infoLogger(scope: string, info: string): void {
  const logger = getLogger(`[${scope}]`)
  logger.info(info)
}

export function successLogger(scope: string, info: string): void {
  const logger = getLogger(`[${scope}]`)
  logger.info(info['success'])
}

export const decoratorLogger = (type: string, scope: string, name: string): void => {
  const logger = getLogger(LOG_SCOPE.DECORATOR)
  logger.info(
    `${red.bold(`[${type}]`)} -- ${yellow.bold(`[${scope}]`)}: ${cyan.bold(`${name}`)} ${green.bold(`completed!`)}`
  )
}
