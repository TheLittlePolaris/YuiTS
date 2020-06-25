import { configure, Configuration, Appender, getLogger } from 'log4js'
;(() => {
  const log4jsConfig: Configuration = {
    appenders: {
      output: { type: 'stdout' },
      error: { type: 'stderr' },
    },
    categories: {
      default: {
        appenders: ['output'],
        level: 'all',
        enableCallStack: true,
      },
      YuiMain: {
        appenders: ['error'],
        level: 'all',
      },
    },
  }

  configure(log4jsConfig)
  const logger = getLogger('default')
  logger.info('INIT LOGGER')
})()
