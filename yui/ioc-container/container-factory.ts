import {
  Type,
  CustomValueProvider,
  CustomClassProvider,
  EntryComponent,
} from './interfaces/di-interfaces'
import {
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  SELF_DECLARED_DEPS_METADATA,
  COMPONENT_METADATA,
  EVENT_HANDLER,
  COMMAND_HANDLER,
  COMMAND_HANDLER_PARAMS,
  APP_INTERCEPTOR,
  INTERCEPTOR_TARGET,
} from '@/ioc-container/constants/di-connstants'
import { EntryInstance, YuiModule } from './module'
import { isValueInjector, isValue, isFunction } from './helper-functions'
import { DiscordEvent } from '@/constants/discord-events'
import { YuiLogger } from '@/log/logger.service'
import { ClientEvents, Message } from 'discord.js'
import { ICommandHandlerMetadata } from './interfaces/di-command-handler.interface'
import { YuiCore } from '@/entrypoint/yui-core.entrypoint'

type CommandHandler = {
  [command: string]: (_arguments: ClientEvents[DiscordEvent]) => {
    handler: () => Promise<any>
    paramList: number[]
  }
}

export class YuiContainerFactory {
  static entryDetected = false

  private container = new YuiModule()
  private logger = new YuiLogger('YuiContainerFactory')
  private eventHandlers: {
    [key in DiscordEvent]?: CommandHandler
  } = {}

  async createRootModule(moduleMetadata: Type<any>) {
    await this.compileModule(moduleMetadata)
    const { entryInstance, entryComponent } = this.container
    this.testEntryInstance(entryInstance)

    /**
     * IMPORTANT:
     *  - Required the entry component to extends EntryComponent class
     *  - Require events to be defined within entry component
     */
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

    client.addListener('message', (message: Message) => {})

    await entryInstance.start()
    return entryInstance
  }

  async compileModule<T = any>(module: Type<T>) {
    const entryComponent = Reflect.getMetadata(MODULE_METADATA.ENTRY_COMPONENT, module)
    if (entryComponent) this.container.entryComponent = entryComponent

    const providers: CustomValueProvider<T>[] = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      module
    )
    if (providers) {
      for (const provider of providers) this.injectValueProvider(module, provider)
    }

    const modules: Type<T>[] = Reflect.getMetadata(MODULE_METADATA.MODULES, module)
    if (modules) {
      await Promise.all(modules.map((m) => this.compileModule(m)))
      this.container.importModules(modules)
    }

    const interceptors: Type<T>[] = Reflect.getMetadata(MODULE_METADATA.INJECTORS, module)
    if (interceptors) {
      interceptors.map((interceptor) => this.compileInterceptor(interceptor, module))
    }

    const components: Type<T>[] = Reflect.getMetadata(MODULE_METADATA.COMPONENTS, module)
    if (components) {
      components.map((component) => this.compileComponent(component, module))
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
      const useIntercept: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target) // TODO
      this.defineHandler(eventHandler, target, newInstance)
    }

    return newInstance
  }

  compileInterceptor<T = any>(interceptorTarget: Type<T>, module: Type<T>): T {
    const interceptor = this.container.getInterceptor<T>(interceptorTarget)
    if (interceptor) return interceptor

    const injections = this.loadInjections(module, interceptorTarget)
    const newInterceptorInstance: T = Reflect.construct(interceptorTarget, injections)
    if (isValue(interceptorTarget)) return
    this.container.addInterceptor(interceptorTarget, newInterceptorInstance)
    
    return newInterceptorInstance
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
        else
          return this.compileComponent(
            (customToken as CustomClassProvider<T>).useClass,
            module
          )
      }
      const created = this.container.getInstance(token)
      if (created) return created
      return this.compileComponent(token, module)
    })
  }

  private defineHandler<T>(onEvent: DiscordEvent, target: Type<T>, handleInstance: T) {
    const commandHandlerMetadata: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target) || []
    const commandHandlerParams = Reflect.getMetadata(COMMAND_HANDLER, target) || []

    const handlers = commandHandlerMetadata.reduce(
      (acc: CommandHandler, { command, propertyKey }) => ({
        ...acc,
        [command]: (_arguments: ClientEvents[DiscordEvent]) => ({
          handler: handleInstance[propertyKey].bind(handleInstance, _arguments),
          paramList: Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target, propertyKey) || [],
        }),
      }),
      {}
    )
    this.eventHandlers[onEvent] = {
      ...(this.eventHandlers[onEvent] || {}),
      ...handlers,
    }
  }

  private getHandler(
    handleEvent: DiscordEvent,
    forCommand: string,
    _arguments: ClientEvents[typeof handleEvent]
  ) {
    console.log('RUN', `<======= "RUN" [container-factory.ts - 154]`)
    // const [] =  Reflect.defineMetadata(HANDLE_PARAMS.MESSAGE, paramIndex, target, propertyKey)
    const { [forCommand]: commandExecutor = null } = this.eventHandlers[handleEvent] || {}
    return commandExecutor && commandExecutor(_arguments).handler()
  }

  private getPresetHandlerForEvent(event: DiscordEvent) {}

  private getPresetHandlerForMessage() {}

  injectValueProvider<T = any>(module: Type<T>, provider: CustomValueProvider<T>) {
    this.container.setValueProvider(module, provider)
  }

  injectClassProvider<T = any>(module: Type<T>, provider: CustomClassProvider<T>) {}

  testEntryInstance(entryInstance: EntryInstance<Type<YuiCore>>) {
    if (!entryInstance) throw new Error('No entry detected!')
    const { start, client } = entryInstance
    if (!client) throw new Error('Client for the instance has not been defined')
    if (!(start && isFunction(start))) throw new Error(`Component's starting point not detected!`)
  }
}
