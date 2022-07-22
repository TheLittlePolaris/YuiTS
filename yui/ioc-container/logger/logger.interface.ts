export interface ILoggerService {
  log(message: any, context?: string)
  error(message: any, trace?: string, context?: string)
  warn(message: any, context?: string)
  debug?(message: any, context?: string)
}
