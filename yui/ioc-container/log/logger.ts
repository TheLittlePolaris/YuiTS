import { YuiLogger } from '@/log/logger.service'
import { yellow, cyan, green } from 'chalk'

export const decoratorLogger = (type: string, scope: string, propertyName?: string): void => {
  YuiLogger.log(
    `${yellow.bold(`[${scope}]`)}: ${cyan.bold(`${propertyName || type}`)} ${green.bold(
      `completed!`
    )}`
  )
}
