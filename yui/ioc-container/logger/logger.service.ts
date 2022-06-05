import { Chalk, Instance } from 'chalk'
import { createLogger, format, Logger as WinstonLogger, transports } from 'winston'

import { isObject } from '../helpers'

// Nestjs logger
export interface LoggerService {
  log(message: any, context?: string)
  error(message: any, trace?: string, context?: string)
  warn(message: any, context?: string)
  debug?(message: any, context?: string)
}

export class YuiLogger implements LoggerService {
  private static chalk = new Instance({ level: 2 })
  private context: string
  private static instance?: typeof YuiLogger | LoggerService = YuiLogger
  private static yuiPid = process.pid
  private static winstonLogger: WinstonLogger = createLogger({
    format: format.json(),

    transports: [
      new transports.File({
        filename: YuiLogger.buildPath('error'),
        level: 'error'
      }),
      new transports.File({
        filename: YuiLogger.buildPath('warn'),
        level: 'warn'
      }),
      new transports.Console({
        level: 'debug',
        format: format.combine(
          format.colorize(),
          format.combine(
            format.colorize({
              all: true
            }),
            format.label({
              label: `[Yui] ${YuiLogger.chalk.keyword('orange')(`[${process.pid}]`)}`
            }),
            format.timestamp({
              format: 'YY-MM-DD HH:MM:SS'
            }),
            format.printf((info) => ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`)
          )
        )
      })
    ]
  })
  private static buildPath(type: string) {
    const [m, d, y] = new Date().toLocaleDateString().split('/')
    return `logs/${d}-${m}-${y}/${type}.log`
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

  private callFunction(name: 'log' | 'warn' | 'debug' | 'info' | 'error', message: any, context?: string) {
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
    const output = isObject(message) ? `${JSON.stringify(message, null, 2)}\n` : color(message)
    const msgContext = context ? this.chalk.hex('#00ffff')(`[${context}]`) : ``
    return `${msgContext} ${output}\n`
  }
}
