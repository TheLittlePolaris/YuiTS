import { YuiLogger } from '@/log/logger.service'
import { red, yellow, cyan, green } from 'chalk'

export const decoratorLogger = (scope: string, name: string): void => {
  if (!YuiLogger) return // the service itself
  YuiLogger.log(
    `${red.bold(`[Decorator]`)} -- ${yellow.bold(`[${scope}]`)}: ${cyan.bold(
      `${name}`
    )} ${green.bold(`completed!`)}`
  )
}
