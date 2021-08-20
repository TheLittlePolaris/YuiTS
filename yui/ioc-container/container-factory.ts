import { ModuleContainer } from './module'
import { isValueInjector, isValue, isFunction, isClassInjector } from './helpers/helper-functions'
import { DiscordEvent, DiscordEventConfig } from '@/constants/discord-events'
import { ClientEvents, Message } from 'discord.js'
import { ConfigService } from '@/config-service/config.service'
import { IBaseInterceptor } from './interfaces/interceptor.interface'
import { HandleFunction } from './interfaces'
import {
  Type,
  CustomValueProvider,
  CustomClassProvider,
  Provider,
  ICommandHandlerMetadata,
} from './interfaces'
import {
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  SELF_DECLARED_DEPS_METADATA,
  COMPONENT_METADATA,
  EVENT_HANDLER,
  COMMAND_HANDLER,
  INTERCEPTOR_TARGET,
  MODULE_METADATA_KEY,
  EVENT_HANDLER_CONFIG,
  DiscordClient,
} from '@/ioc-container'
import { YuiLogger } from '@/services/logger/logger.service'

export class ContainerFactory {
  static entryDetected = false
  private container = new ModuleContainer()
  public configService: ConfigService

  private eventHandlers: {
    [key in DiscordEvent]?: { handleFunction: HandleFunction; config?: DiscordEventConfig[key] }
  } = {}

  async createInstanceModule(moduleMetadata: Type<any>, entryComponent?: Type<any>) {
    await this.compileModule(moduleMetadata, entryComponent)
    /**
     * IMPORTANT:
     *  - Required the entry component to extends EntryComponent class
     */
    const { entryInstance } = this.container

    const boundEvents =
      Reflect.getMetadata(COMPONENT_METADATA.EVENT_LIST, entryInstance['constructor']) || {}

    const { length: hasEvents, ...events } = Object.keys(boundEvents)
    if (hasEvents) {
      events.forEach((eventKey: DiscordEvent) =>
        entryInstance.client.addListener(eventKey, (...args) =>
          entryInstance[boundEvents[eventKey]](...args)
        )
      )
    }

    Object.keys(this.eventHandlers).map((handler: DiscordEvent) =>
      entryInstance.client.addListener(handler, (...args: ClientEvents[typeof handler]) =>
        this.getHandlerForEvent(handler, args)
      )
    )

    return entryInstance
  }

  async createRootModule(rootModule: Type<any>, entryComponent = DiscordClient) {
    await this.compileModule(rootModule, entryComponent)
    const client = this.container.getInstance(entryComponent)
    const compiledEvents = Object.keys(this.eventHandlers)
    compiledEvents.map((handler: DiscordEvent) =>
      client.addListener(handler, (...args: ClientEvents[typeof handler]) =>
        this.getHandlerForEvent(handler, args)
      )
    )
    return client
  }

  async compileModule<T = any>(module: Type<T>, entryComponent?: Type<any>) {
    const getKey = (key: MODULE_METADATA_KEY) => Reflect.getMetadata(MODULE_METADATA[key], module)

    const [providers, modules, interceptors, components] = [
      getKey(MODULE_METADATA_KEY.PROVIDERS),
      getKey(MODULE_METADATA_KEY.MODULES),
      getKey(MODULE_METADATA_KEY.INTERCEPTOR),
      getKey(MODULE_METADATA_KEY.COMPONENTS),
    ]

    if (providers) {
      await Promise.all(providers.map((provider) => this.compileProvider(module, provider)))
    }

    if (entryComponent) {
      // first entry needs custom config
      this.compileComponent(module, entryComponent)
    }

    if (modules) {
      await Promise.all(modules.map((m) => this.compileModule(m)))
      this.container.importModules(modules)
    }

    if (interceptors) {
      interceptors.map((interceptor) => this.compileInterceptor(module, interceptor))
    }

    if (components) {
      components.map((component) => this.compileComponent(module, component))
    }
  }

  private async compileProvider(module: Type<any>, provider: Provider) {
    if (provider.useValue) {
      this.container.setValueProvider(module, provider)
    } else if (provider.useFactory) {
      const { provide, useFactory } = provider
      const useValue = (isFunction(useFactory) && (await useFactory(this.configService))) || null
      this.container.setValueProvider(module, <Provider>{ provide, useValue })
    } else if (provider.useClass) {
      const { useClass, provide } = provider
      const useValue = this.compileComponent(module, useClass)
      this.container.setValueProvider(module, <Provider>{ provide, useValue })
    }
  }

  private loadInjectionsForTarget(module: Type<any>, target: Type<any>) {
    const tokens: Type<any>[] = Reflect.getMetadata(PARAMTYPES_METADATA, target) || []
    const customTokens: { [paramIndex: string]: /* param name */ string } =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || []
    if (target.name === DiscordClient.name) {
    }
    return tokens.map((token: Type<any>, paramIndex: number) => {
      if (customTokens && customTokens[paramIndex]) {
        // module-based value provider
        const customProvide = this.container.getProvider(module, customTokens[paramIndex])
        if (target.name === DiscordClient.name) {
        }
        /* TODO: class provider */
        if (isValueInjector(customProvide))
          return (customProvide as CustomValueProvider<any>).useValue
        else if (isClassInjector(customProvide))
          return this.compileComponent(module, (customProvide as CustomClassProvider<any>).useClass)
      }
      const created = this.container.getInstance(token)
      if (created) return created
      return this.compileComponent(module, token)
    })
  }

  private compileInstance(module: Type<any>, target: Type<any>) {
    const injections = this.loadInjectionsForTarget(module, target)
    const compiledInstance = Reflect.construct(target, injections)
    if (isFunction(compiledInstance.onComponentInit)) compiledInstance.onComponentInit()
    YuiLogger.debug(`${target.name} created!`, this.constructor.name)
    return compiledInstance
  }
  /**
   * Find the instance for injection, if exists then inject it, if not create it and store it
   */
  compileComponent(module: Type<any>, target: Type<any>) {
    if (target.name === DiscordClient.name) {
    }

    if (isValue(target)) return

    const createdInstance = this.container.getInstance(target)
    if (createdInstance) return createdInstance

    const compiledInstance = this.compileInstance(module, target)
    this.container.addInstance(target, compiledInstance)

    Promise.resolve().then(() => this.compileHandlerForEvent(target, compiledInstance))

    return compiledInstance
  }

  private async compileHandlerForEvent(
    target: Type<any>,
    compiledInstance: InstanceType<Type<any>>
  ) {
    const eventHandler = Reflect.getMetadata(EVENT_HANDLER, target)
    if (eventHandler) {
      this.defineHandler(eventHandler, target, compiledInstance)
    }

    if (!this.configService && /ConfigService/.test(target.name)) {
      this.configService = compiledInstance
    }
  }

  compileInterceptor(module: Type<any>, interceptorTarget: Type<any>) {
    if (isValue(interceptorTarget)) return
    const interceptor = this.container.getInterceptorInstance(interceptorTarget.name)
    if (interceptor) return interceptor

    const compiledInterceptor = this.compileInstance(module, interceptorTarget)
    this.container.addInterceptor(interceptorTarget, compiledInterceptor)

    return compiledInterceptor
  }

  private defineHandler(onEvent: DiscordEvent, target: Type<any>, handleInstance: any) {
    if (!this.eventHandlers[onEvent]) this.eventHandlers[onEvent] = <any>{}

    const handlerMetadata: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target) || []

    const handleConfig: ICommandHandlerMetadata[] = Reflect.getMetadata(
      EVENT_HANDLER_CONFIG,
      target
    )

    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    const interceptorInstance: IBaseInterceptor =
      (useInterceptor && this.container.getInterceptorInstance(useInterceptor)) || null

    const compileCommand = (propertyKey: string) => {
      // bind: passive when go through interceptor, active when call directly
      const handler = (_eventArgs: ClientEvents[DiscordEvent], bind = false) =>
        bind
          ? (handleInstance[propertyKey] as Function).bind(
              handleInstance,
              _eventArgs,
              this.configService
            )
          : (handleInstance[propertyKey] as Function).apply(handleInstance, [
              _eventArgs,
              this.configService,
            ])

      return interceptorInstance
        ? (_eventArgs: ClientEvents[DiscordEvent]) =>
            interceptorInstance.intercept(_eventArgs, handler(_eventArgs, true))
        : handler
    }

    const commandHandlers = handlerMetadata.reduce(
      (acc: HandleFunction, { command, propertyKey, commandAliases }) => {
        const commandFn = compileCommand(propertyKey)
        const compiled = [command, ...(commandAliases || [])].reduce(
          (accAliases, curr) => ({ ...accAliases, [curr]: commandFn }),
          {}
        )
        return { ...acc, ...compiled }
      },
      {}
    )

    if (!this.eventHandlers[onEvent].config) this.eventHandlers[onEvent].config = handleConfig
    this.eventHandlers[onEvent].handleFunction = {
      ...(this.eventHandlers[onEvent].handleFunction || {}),
      ...commandHandlers,
    }
  }

  public getHandlerForEvent(event: keyof ClientEvents, args: ClientEvents[DiscordEvent]) {
    const command = this.getCommandHandler(event, args)
    if (command === false) return

    const { [command]: compiledCommand = null, ['default']: defaultAction } =
      this.eventHandlers[event].handleFunction

    try {
      if (compiledCommand) compiledCommand(args)
      else if (defaultAction) defaultAction(args)
    } catch (error) {
      YuiLogger.error(`Uncaught error: ${error}`, 'AppContainer')
    }
  }

  private getCommandHandler(event: DiscordEvent, args: ClientEvents[DiscordEvent]) {
    switch (event) {
      case 'messageCreate': {
        const {
          author: { bot },
          content,
        } = args[0] as Message
        const { config } = this.eventHandlers['messageCreate']
        if (config) {
          const { ignoreBots, startsWithPrefix } = config
          if (
            (startsWithPrefix && !content.startsWith(this.configService.prefix)) ||
            (ignoreBots && bot)
          )
            return false
        }
        // if (!content.startsWith(this.configService.prefix) || bot) return false
        return content.replace(this.configService.prefix, '').trim().split(/ +/g)[0]
      }

      default:
        return 'default'
    }
  }

  injectClassProvider<T = any>(module: Type<T>, provider: CustomClassProvider<T>) {}
}
