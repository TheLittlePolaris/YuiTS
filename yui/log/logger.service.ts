import { Injectable } from '@/dep-injection-ioc/decorators'
import { Instance, Chalk } from 'chalk'
import { createLogger, format, Logger as WinstonLogger, transports } from 'winston'

// Nestjs logger
export interface LoggerService {
  log(message: any, context?: string)
  error(message: any, trace?: string, context?: string)
  warn(message: any, context?: string)
  debug?(message: any, context?: string)
}

export const isObject = (fn: any): fn is object => !isNil(fn) && typeof fn === 'object'
export const isNil = (obj: any): obj is null | undefined => isUndefined(obj) || obj === null
export const isUndefined = (obj: any): obj is undefined => typeof obj === 'undefined'


export class YuiLogger implements LoggerService {
  private static chalk = new Instance({ level: 2 })
  private context: string
  private static instance?: typeof YuiLogger | LoggerService = YuiLogger

  private static winstonLogger: WinstonLogger = createLogger({
    format: format.json(),

    transports: [
      new transports.File({
        filename: `logs/${YuiLogger.buildPath('error')}`,
        level: 'error',
      }),
      new transports.File({
        filename: `logs/${YuiLogger.buildPath('warn')}`,
        level: 'warn',
      }),
      new transports.Console({
        level: 'info',
        format: format.combine(
          format.colorize(),
          format.combine(
            format.colorize({
              all: true,
            }),
            format.label({
              label: '[Yui]',
            }),
            format.timestamp({
              format: 'YY-MM-DD HH:MM:SS',
            }),
            format.printf(
              (info) => ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`
            )
          )
        ),
      }),
    ],
  })
  private static buildPath(type: string) {
    const [m, d, y] = new Date().toLocaleDateString().split('/')
    return `${d}-${m}-${y}_${type}.log`
  }
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
    return this.winstonLogger.info(this.printMessage(message, this.chalk.hex('#00ff00'), context))
  }

  static info(message: string, context?: string) {
    return this.winstonLogger.info(this.printMessage(message, this.chalk.green, context))
  }

  static warn(message: string, context?: string) {
    return this.winstonLogger.warn(this.printMessage(message, this.chalk.yellow, context))
  }

  static error(error: Error | string, context?: string) {
    return this.winstonLogger.error(this.printMessage(error, this.chalk.red, context))
  }

  static debug(message: string, context?: string) {
    return this.winstonLogger.debug(this.printMessage(message, this.chalk.cyan, context))
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
    const pid = `[${process.pid}]` // this.chalk.keyword('orange')(`[Yui - ${process.pid}]`)
    const msgContext = context || '' // ? this.chalk.hex('#00ffff')(`[${context}] - `) : ``
    return `[${timestamp}]${pid} - ${msgContext} ${output}\n`
  }
}
