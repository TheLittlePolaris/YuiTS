import { Type, CustomValueProvider, CustomClassProvider } from './interfaces/di-interfaces'
import {
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  SELF_DECLARED_DEPS_METADATA,
  COMPONENT_METADATA,
  EVENT_HANDLER,
  COMMAND_HANDLER,
  COMMAND_HANDLER_PARAMS,
  INTERCEPTOR_TARGET,
  MODULE_METADATA_KEY,
} from '@/ioc-container/constants/di-connstants'
import { EntryInstance, YuiModule } from './module'
import { isValueInjector, isValue, isFunction } from './helper-functions'
import { DiscordEvent } from '@/constants/discord-events'
import { YuiLogger } from '@/log/logger.service'
import { ClientEvents, Message } from 'discord.js'
import { ICommandHandlerMetadata } from './interfaces/di-command-handler.interface'
import { YuiCore } from '@/entrypoint/yui-core.entrypoint'
import { MessageInterceptor } from '../interceptors/message.interceptor'
import { ConfigService } from '@/config-service/config.service'
import { IBaseInterceptor } from './interfaces/interceptor.interface'

type CommandHandler = {
  [command: string]: (originalArgument: ClientEvents[DiscordEvent]) => Promise<any>
}

export class YuiContainerFactory {
  static entryDetected = false

  private container = new YuiModule()
  private logger = new YuiLogger('YuiContainerFactory')

  private configService: ConfigService

  private eventHandlers: {
    [key in DiscordEvent]?: CommandHandler
  } = {}

  async createRootModule(moduleMetadata: Type<any>) {
    await this.compileModule(moduleMetadata)
    /**
     * IMPORTANT:
     *  - Required the entry component to extends EntryComponent class
     *  - Require events to be defined within entry component
     */
    const { entryInstance, entryComponent } = this.container

    const { client } = entryInstance
    const boundEvents = Reflect.getMetadata(COMPONENT_METADATA.EVENT_LIST, entryComponent) || {}
    const eventKeys = Object.keys(boundEvents)
    if (eventKeys.length) {
      eventKeys.forEach((eventKey: DiscordEvent) =>
        client.addListener(eventKey, (...args) => entryInstance[boundEvents[eventKey]](...args))
      )
    } else {
      this.logger.warn('No event listener detected!')
    }

    client.addListener('message', (...args: ClientEvents['message']) =>
      this.getHandlerForEvent('message', args)
    )
    await entryInstance.start()
    return entryInstance
  }

  async compileModule<T = any>(module: Type<T>) {
    const entryComponent = Reflect.getMetadata(MODULE_METADATA['entryComponent'], module)
    if (entryComponent) this.container.setEntryComponent(entryComponent)

    const getKey = (key: MODULE_METADATA_KEY) => Reflect.getMetadata(MODULE_METADATA[key], module)

    const [providers, modules, interceptors, components] = [
      getKey(MODULE_METADATA_KEY.PROVIDERS),
      getKey(MODULE_METADATA_KEY.MODULES),
      getKey(MODULE_METADATA_KEY.INTERCEPTOR),
      getKey(MODULE_METADATA_KEY.COMPONENTS),
    ]
    if (providers) {
      providers.map((provider) => this.container.setValueProvider(module, provider))
    }

    if (modules) {
      await Promise.all(modules.map((m) => this.compileModule(m)))
      this.container.importModules(modules)
    }

    if (interceptors) {
      await Promise.all(
        interceptors.map((interceptor) => this.compileInterceptor(interceptor, module))
      )
    }

    if (components) {
      await Promise.all(components.map((component) => this.compileComponent(component, module)))
    }
  }

  /**
   * Find the instance for injection, if exists then inject it, if not create it and store it
   */
  compileComponent<T = any>(target: Type<T>, module: Type<T>): T {
    const createdInstance = this.container.getInstance<T>(target)
    if (createdInstance) return createdInstance

    const injections = this.loadInjections(module, target)
    const newInstance: T = Reflect.construct(target, injections)
    if (isValue(target)) return
    this.container.addInstance(target, newInstance)

    const eventHandler = Reflect.getMetadata(EVENT_HANDLER, target)
    if (eventHandler) {
      this.defineHandler(eventHandler, target, newInstance)
    }
    if (!this.configService && target.name === ConfigService.name) {
      this.configService = newInstance as unknown as ConfigService
    }

    return newInstance
  }

  compileInterceptor<T = any>(interceptorTarget: Type<T>, module: Type<T>): T {
    const interceptor = this.container.getInterceptorInstance<T>(interceptorTarget.name)
    if (interceptor) return interceptor

    const injections = this.loadInjections(module, interceptorTarget)
    const newInterceptor: T = Reflect.construct(interceptorTarget, injections)
    if (isValue(interceptorTarget)) return
    this.container.addInterceptor(interceptorTarget, newInterceptor)

    return newInterceptor
  }

  private loadInjections<T>(module: Type<T>, target: Type<T>) {
    const tokens: Type<T>[] = Reflect.getMetadata(PARAMTYPES_METADATA, target) || []
    const customTokens: { [paramIndex: string]: /* param name */ string } =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || []

    return tokens.map((token: Type<T>, paramIndex: number) => {
      if (customTokens && customTokens[paramIndex]) {
        // module-based value provider
        const customToken = this.container.getProvider(module, customTokens[paramIndex])

        /* TODO: class provider */
        if (isValueInjector(customToken)) return (customToken as CustomValueProvider<T>).useValue
        else return this.compileComponent((customToken as CustomClassProvider<T>).useClass, module)
      }
      const created = this.container.getInstance(token)
      if (created) return created
      return this.compileComponent(token, module)
    })
  }

  private defineHandler<T>(onEvent: DiscordEvent, target: Type<T>, handleInstance: T) {
    const commandHandlersMetadata: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target) || []

    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    const interceptorInstance: IBaseInterceptor =
      (useInterceptor && this.container.getInterceptorInstance(useInterceptor)) || null

    const compileCommand = (propertyKey: string) => {
      // bind: passive when go through interceptor, active when call directly
      const handler = (_eventArgs: ClientEvents[DiscordEvent], bind = false) => {
        if (bind)
          return (handleInstance[propertyKey] as Function).bind(
            handleInstance,
            _eventArgs,
            this.configService
          )
        return (handleInstance[propertyKey] as Function).apply(handleInstance, [
          _eventArgs,
          this.configService,
        ])
      }
      return interceptorInstance
        ? (_eventArgs: ClientEvents[DiscordEvent]) =>
            interceptorInstance.intercept(_eventArgs, handler(_eventArgs, true))
        : handler
    }

    const commandHandlers = commandHandlersMetadata.reduce(
      (acc: CommandHandler, { command, propertyKey, commandAliases }) => {
        const commandFn = compileCommand(propertyKey)
        const aliases = commandAliases.reduce(
          (accAliases, curr) => ({ ...accAliases, [curr]: commandFn }),
          {}
        )
        return { ...acc, [command]: commandFn, ...aliases }
      },
      {}
    )

    this.eventHandlers[onEvent] = {
      ...(this.eventHandlers[onEvent] || {}),
      ...commandHandlers,
    }
  }

  public getHandlerForEvent(event: DiscordEvent, args: ClientEvents[typeof event]) {
    const command = this.commandSelector[event](args)
    if (command === false) return
    const { [command]: compiledCommand = null, ['default']: defaultAction } =
      this.eventHandlers[event]

    if (compiledCommand) compiledCommand(args)
    else defaultAction(args)
  }

  private get commandSelector(): {
    [event in DiscordEvent]: (args: ClientEvents[DiscordEvent]) => any
  } {
    return {
      message: ([
        {
          channel: { type: channelType },
          author: { bot },
          content,
        },
      ]: ClientEvents['message']) => {
        if (!content.startsWith(this.configService.prefix) || bot || channelType !== 'text')
          return false
        return content.replace(this.configService.prefix, '').trim().split(/ +/g)[0]
      },
    } as any
  }

  injectClassProvider<T = any>(module: Type<T>, provider: CustomClassProvider<T>) {}
}
