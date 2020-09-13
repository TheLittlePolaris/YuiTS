import { YuiLogger } from '@/log/logger.service'
import { red, yellow, cyan, green } from 'chalk'

export const decoratorLogger = (type: string, scope: string, name: string): void => {
  YuiLogger.log(
    `${red.bold(`[Decorator]`)} -- ${yellow.bold(`[${scope}]`)}: ${cyan.bold(`${name}`)} ${green.bold(`completed!`)}`
  )
}
