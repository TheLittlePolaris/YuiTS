import { DiscordEvent, DiscordEventConfig } from '@/constants/discord-events'
import { YuiLogger } from '@/services/logger'
import { ClientEvents } from 'discord.js'
import { BOT_GLOBAL_CLIENT, BOT_GLOBAL_CONFIG } from '../constants/config.constant'
import {
  COMMAND_HANDLER,
  EVENT_HANDLER,
  EVENT_HANDLER_CONFIG,
  getPropertyKey,
  INTERCEPTOR_TARGET,
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '../constants/dependencies-injection.constant'
import { ComponentsContainer, InterceptorsContainer, ProvidersContainer } from '../containers'
import { ModulesContainer } from '../containers/modules.container'
import { isClassInjector, isFunction, isValue, isValueInjector } from '../helpers/helper-functions'
import { HandleFunction } from '../interfaces/container.interface'
import {
  CustomClassProvider,
  CustomValueProvider,
  ICommandHandlerMetadata,
  Provider,
  Type,
} from '../interfaces/dependencies-injection.interfaces'
import { IBaseInterceptor } from '../interfaces/interceptor.interface'

/**
 * @description Compile using recursive strategy.
 */
export class RecursiveCompiler {
  protected _eventHandlers: {
    [key in DiscordEvent]?: { handleFunction: HandleFunction; config?: DiscordEventConfig[key] }
  } = {}

  protected _config

  constructor(
    protected moduleContainer: ModulesContainer,
    protected componentContainer: ComponentsContainer,
    protected providerContainer: ProvidersContainer,
    protected interceptorContainer: InterceptorsContainer
  ) {}

  protected get context() {
    return this.constructor.name
  }

  get config() {
    return this._config
  }

  get eventHandlers() {
    return this._eventHandlers
  }

  private getModuleMetadata(module: Type<any>, key: MODULE_METADATA) {
    return Reflect.getMetadata(getPropertyKey(key), module)
  }

  async compileModule<T = any>(module: Type<T>, entryComponent?: Type<any>) {
    const [providers, modules, interceptors, components] = [
      this.getModuleMetadata(module, MODULE_METADATA.PROVIDERS),
      this.getModuleMetadata(module, MODULE_METADATA.MODULES),
      this.getModuleMetadata(module, MODULE_METADATA.INTERCEPTOR),
      this.getModuleMetadata(module, MODULE_METADATA.COMPONENTS),
    ]

    if (providers) {
      await Promise.all(providers.map((provider) => this.compileProvider(module, provider)))
    }

    if (entryComponent) {
      // first entry needs custom config
      this.moduleContainer.setEntryComponent(entryComponent)
      this.compileComponent(module, entryComponent)
    }

    if (modules) {
      await Promise.all(modules.map((m) => this.compileModule(m)))
      this.moduleContainer.importModules(modules)
    }

    if (interceptors) {
      await Promise.all(
        interceptors.map((interceptor) => this.compileInterceptor(module, interceptor))
      )
    }

    if (components) {
      await Promise.all(components.map((component) => this.compileComponent(module, component)))
    }

    this.moduleContainer.clear()
  }

  protected async compileProvider(module: Type<any>, provider: Provider) {
    if (provider.useValue) {
      this.providerContainer.setValueProvider(module, provider)
    } else if (provider.useFactory) {
      const { provide, useFactory } = provider
      const useValue = (isFunction(useFactory) && (await useFactory(this._config))) || null
      this.providerContainer.setValueProvider(module, <Provider>{ provide, useValue })
    } else if (provider.useClass) {
      const { useClass, provide } = provider
      const useValue = this.compileComponent(module, useClass)
      this.providerContainer.setValueProvider(module, <Provider>{ provide, useValue })
    }
  }

  /**
   * Find the instance for injection, if exists then inject it, if not create it and store it
   */
  compileComponent(module: Type<any>, target: Type<any>) {
    if (isValue(target)) return

    const createdInstance = this.componentContainer.getInstance(target)
    if (createdInstance) return createdInstance

    const compiledInstance = this.compileInstance(module, target)
    this.componentContainer.addInstance(target, compiledInstance)

    Promise.resolve().then(() => this.compileHandlerForEvent(target, compiledInstance))
    setTimeout(() => this.injectExternalConfig(target, compiledInstance))

    return compiledInstance
  }

  protected injectExternalConfig(type: Type<any>, instance: InstanceType<Type<any>>) {
    const { entryComponent } = this.moduleContainer
    if (type.name === entryComponent.name) return
    // TODO: create something like: createMethodDecorator(([client,config]) => {...})
    instance[BOT_GLOBAL_CLIENT] = this.componentContainer.getInstance(entryComponent)
    instance[BOT_GLOBAL_CONFIG] = this._config
  }

  protected async compileHandlerForEvent(
    target: Type<any>,
    compiledInstance: InstanceType<Type<any>>
  ) {
    const eventHandler = Reflect.getMetadata(EVENT_HANDLER, target)
    if (eventHandler) {
      this.defineHandler(eventHandler, target, compiledInstance)
    }
    if (this._config) return

    if (/ConfigService/.test(target.name)) {
      this._config = compiledInstance
    }
  }

  protected compileInstance(module: Type<any>, target: Type<any>) {
    const injections = this.loadInjectionsForTarget(module, target)
    const compiledInstance = Reflect.construct(target, injections)
    if (isFunction(compiledInstance.onComponentInit)) compiledInstance.onComponentInit()
    YuiLogger.debug(`${target.name} created!`, this.context)
    return compiledInstance
  }

  protected loadInjectionsForTarget(module: Type<any>, target: Type<any>) {
    const tokens: Type<any>[] = Reflect.getMetadata(PARAMTYPES_METADATA, target) || []
    const customTokens: { [paramIndex: string]: /* param name */ string } =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || []
    return tokens.map((token: Type<any>, paramIndex: number) => {
      if (customTokens && customTokens[paramIndex]) {
        // module-based value provider
        const customProvide = this.providerContainer.getProvider(module, customTokens[paramIndex])
        /* TODO: class provider */
        if (isValueInjector(customProvide))
          return (customProvide as CustomValueProvider<any>).useValue
        else if (isClassInjector(customProvide))
          return this.compileComponent(module, (customProvide as CustomClassProvider<any>).useClass)
      }
      const created = this.componentContainer.getInstance(token)
      if (created) return created
      return this.compileComponent(module, token)
    })
  }

  protected defineHandler<T extends Type<any>>(
    onEvent: DiscordEvent,
    target: T,
    handleInstance: InstanceType<T>
  ) {
    this.createEventHandler(onEvent)

    const handlerMetadata: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target) || []

    const handleConfig: ICommandHandlerMetadata[] = Reflect.getMetadata(
      EVENT_HANDLER_CONFIG,
      target
    )

    const commandHandlers = this.compileHandlers(target, handleInstance, handlerMetadata)

    this.assignConfig(onEvent, handleConfig)

    this.assignHandleFunctions(onEvent, commandHandlers)
  }

  protected compileCommand<T extends Type<any>>(
    target: T,
    instance: InstanceType<T>,
    propertyKey: string
  ) {
    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    const interceptorInstance: IBaseInterceptor =
      (useInterceptor && this.interceptorContainer.getInterceptorInstance(useInterceptor)) || null
    // bind: passive when go through interceptor, active when call directly
    const handler = (_eventArgs: ClientEvents[DiscordEvent], bind = false) =>
      bind
        ? (instance[propertyKey] as Function).bind(instance, _eventArgs, this._config)
        : (instance[propertyKey] as Function).apply(instance, [_eventArgs, this._config])

    return interceptorInstance
      ? (_eventArgs: ClientEvents[DiscordEvent]) =>
          interceptorInstance.intercept(_eventArgs, handler(_eventArgs, true))
      : handler
  }

  protected createEventHandler(event: DiscordEvent) {
    if (this.eventHandlers[event]) return
    this.eventHandlers[event] = {} as any
  }

  protected compileHandlers<T extends Type<any>>(
    target: T,
    instance: InstanceType<T>,
    handlerMetadata: ICommandHandlerMetadata[]
  ): HandleFunction {
    return handlerMetadata.reduce(
      (acc: HandleFunction, { command, propertyKey, commandAliases }) => {
        const commandFn = this.compileCommand(target, instance, propertyKey)
        const mainCommand = { [command]: commandFn }
        const aliases = [...(commandAliases || [])].reduce(
          (accAliases, curr) => ({ ...accAliases, [curr]: mainCommand[command] }),
          {}
        )
        return Object.assign(acc, mainCommand, aliases)
      },
      {}
    )
  }

  protected assignConfig(event: DiscordEvent, config: ICommandHandlerMetadata[]): void {
    if (this.eventHandlers[event].config) return
    this.eventHandlers[event].config = config
  }

  protected assignHandleFunctions(event: DiscordEvent, commandHandlers: HandleFunction): void {
    this.eventHandlers[event].handleFunction = {
      ...(this.eventHandlers[event].handleFunction || {}),
      ...commandHandlers,
    }
  }

  protected compileInterceptor(module: Type<any>, interceptorTarget: Type<any>) {
    if (isValue(interceptorTarget)) return
    const interceptor = this.interceptorContainer.getInterceptorInstance(interceptorTarget.name)
    if (interceptor) return interceptor

    const compiledInterceptor = this.compileInstance(module, interceptorTarget)
    this.interceptorContainer.addInterceptor(interceptorTarget, compiledInterceptor)

    return compiledInterceptor
  }
}

