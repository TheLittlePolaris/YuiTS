import { ModuleContainer } from './module'
import { isValueInjector, isValue, isFunction } from './helpers/helper-functions'
import { DiscordEvent } from '@/constants/discord-events'
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
} from '@/ioc-container/constants'

export class ContainerFactory {
  static entryDetected = false
  private container = new ModuleContainer()
  public configService: ConfigService

  private eventHandlers: {
    [key in DiscordEvent]?: HandleFunction
  } = {}

  async createRootModule(moduleMetadata: Type<any>) {
    await this.compileModule(moduleMetadata)
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

    if (modules) {
      await Promise.all(modules.map((m) => this.compileModule(m)))
      this.container.importModules(modules)
    }

    if (providers) {
      await Promise.all(providers.map((provider) => this.compileProvider(module, provider)))
    }

    if (interceptors) {
      interceptors.map((interceptor) => this.compileInterceptor(interceptor, module))
    }

    if (components) {
      components.map((component) => this.compileComponent(component, module))
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
      const useValue = this.compileComponent(useClass, module)
      this.container.setValueProvider(module, <Provider>{ provide, useValue })
    }
  }

  /**
   * Find the instance for injection, if exists then inject it, if not create it and store it
   */
  compileComponent(target: Type<any>, module: Type<any>) {
    if (isValue(target)) return

    const createdInstance = this.container.getInstance(target)
    if (createdInstance) return createdInstance

    const injections = this.loadInjectionsForTarget(module, target)
    const compiledInstance = Reflect.construct(target, injections)

    this.container.addInstance(target, compiledInstance)

    if (isFunction(compiledInstance.onComponentInit)) compiledInstance.onComponentInit()

    const eventHandler = Reflect.getMetadata(EVENT_HANDLER, target)
    if (eventHandler) {
      this.defineHandler(eventHandler, target, compiledInstance)
    }

    if (!this.configService && target.name === 'ConfigService') {
      this.configService = compiledInstance as ConfigService
    }

    return compiledInstance
  }

  compileInterceptor(interceptorTarget: Type<any>, module: Type<any>) {
    if (isValue(interceptorTarget)) return
    const interceptor = this.container.getInterceptorInstance(interceptorTarget.name)
    if (interceptor) return interceptor

    const injections = this.loadInjectionsForTarget(module, interceptorTarget)
    const newInterceptor = Reflect.construct(interceptorTarget, injections)
    this.container.addInterceptor(interceptorTarget, newInterceptor)

    return newInterceptor
  }

  private loadInjectionsForTarget(module: Type<any>, target: Type<any>) {
    const tokens: Type<any>[] = Reflect.getMetadata(PARAMTYPES_METADATA, target) || []
    const customTokens: { [paramIndex: string]: /* param name */ string } =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || []

    return tokens.map((token: Type<any>, paramIndex: number) => {
      if (customTokens && customTokens[paramIndex]) {
        // module-based value provider
        const customToken = this.container.getProvider(module, customTokens[paramIndex])

        /* TODO: class provider */
        if (isValueInjector(customToken)) return (customToken as CustomValueProvider<any>).useValue
        else
          return this.compileComponent((customToken as CustomClassProvider<any>).useClass, module)
      }
      const created = this.container.getInstance(token)
      if (created) return created
      return this.compileComponent(token, module)
    })
  }

  private defineHandler(onEvent: DiscordEvent, target: Type<any>, handleInstance: any) {
    const commandHandlersMetadata: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target) || []

    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    const interceptorInstance: IBaseInterceptor =
      (useInterceptor && this.container.getInterceptorInstance(useInterceptor)) || null

    const compileCommand = (propertyKey: string) => {
      // bind: passive when go through interceptor, active when call directly
      const handler = (_eventArgs: ClientEvents[DiscordEvent], bind = false) => {
        return bind
          ? (handleInstance[propertyKey] as Function).bind(
              handleInstance,
              _eventArgs,
              this.configService
            )
          : (handleInstance[propertyKey] as Function).apply(handleInstance, [
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

    this.eventHandlers[onEvent] = {
      ...(this.eventHandlers[onEvent] || {}),
      ...commandHandlers,
    }
  }

  public getHandlerForEvent(event: DiscordEvent, args: ClientEvents[DiscordEvent]) {
    const command = this.getCommandHandler(event, args)
    if (command === false) return
    const { [command]: compiledCommand = null, ['default']: defaultAction } =
      this.eventHandlers[event]

    if (compiledCommand) compiledCommand(args)
    else if (defaultAction) defaultAction(args)
  }

  private getCommandHandler(event: DiscordEvent, args: ClientEvents[DiscordEvent]) {
    switch (event) {
      case 'message': {
        const {
          author: { bot },
          content,
        } = args[0] as Message
        if (!content.startsWith(this.configService.prefix) || bot) return false
        return content.replace(this.configService.prefix, '').trim().split(/ +/g)[0]
      }

      default:
        return 'default'
    }
  }

  injectClassProvider<T = any>(module: Type<T>, provider: CustomClassProvider<T>) {}
}
