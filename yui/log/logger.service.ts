import { Injectable } from '@/dep-injection-ioc/decorators'
import { Instance, Chalk } from 'chalk'

// Nestjs logger
export interface LoggerService {
  log(message: any, context?: string)
  error(message: any, trace?: string, context?: string)
  warn(message: any, context?: string)
  debug?(message: any, context?: string)
}

export const isObject = (fn: any): fn is object => !isNil(fn) && typeof fn === 'object'
export const isNil = (obj: any): obj is null | undefined =>
  isUndefined(obj) || obj === null
export const isUndefined = (obj: any): obj is undefined => typeof obj === 'undefined'

@Injectable()
export class YuiLogger implements LoggerService {
  private static chalk = new Instance({ level: 2 })
  private context: string
  private static instance?: typeof YuiLogger | LoggerService = YuiLogger

  // context = class name: target.name || target.constructor.name
  constructor(context?: string) {
    this.context = context
  }

  log(message: string, context?: string) {
    this.callFunction('log', message, context)
  }

  info(message: string, context?: string) {
    return this.callFunction('info', message, context)
  }

  warn(message: string, context?: string) {
    return this.callFunction('warn', message, context)
  }

  error(error: Error | string, context?: string) {
    return this.callFunction('error', error, context)
  }

  debug(message: string, context?: string) {
    return this.callFunction('debug', message, context)
  }

  private callFunction(
    name: 'log' | 'warn' | 'debug' | 'info' | 'error',
    message: any,
    context?: string
  ) {
    const instance = this.getInstance()
    const func = instance && (instance as typeof YuiLogger)[name]
    func && func.call(instance, message, context || this.context)
  }

  static log(message: string, context?: string) {
    return this.printMessage(message, this.chalk.hex('#00ff00'), context)
  }

  static info(message: string, context?: string) {
    return this.printMessage(message, this.chalk.green, context)
  }

  static warn(message: string, context?: string) {
    return this.printMessage(message, this.chalk.yellow)
  }

  static error(error: Error | string, context?: string) {
    this.printMessage(`${error}`, this.chalk.red, context)
  }

  static debug(message: string, context?: string) {
    this.printMessage(message, this.chalk.cyan, context)
  }

  private getInstance(): typeof YuiLogger | LoggerService {
    const { instance } = YuiLogger
    return instance === this ? YuiLogger : instance
  }

  private static printMessage(message: string | Error, color: Chalk, context?: string) {
    const output = isObject(message)
      ? `${color('Object:')}\n${JSON.stringify(message, null, 2)}\n`
      : color(message)

    const localeStringOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      day: '2-digit',
      month: '2-digit',
    }
    const timestamp = new Date(Date.now()).toLocaleString(undefined, localeStringOptions)
    const pid = this.chalk.keyword('orange')(`[Yui - ${process.pid}]`)
    const msgContext = context ? this.chalk.hex('#00ffff')(`[${context}] - `) : ``
    process.stdout.write(`[${timestamp}]${pid} - ${msgContext}${output}\n`)
  }
}
