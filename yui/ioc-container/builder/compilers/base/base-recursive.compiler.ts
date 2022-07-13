import {
  ModuleMetadata,
  getPropertyKey,
  EVENT_HANDLER,
  PARAMTYPES_METADATA,
  SELF_DECLARED_DEPS_METADATA,
  DiscordEvent,
  COMMAND_HANDLER,
  EVENT_HANDLER_CONFIG,
  INTERCEPTOR_TARGET
} from '../../../constants'
import { isValue, isValueInjector, isClassInjector } from '../../../helpers'
import {
  Type,
  Provider,
  CustomValueProvider,
  CustomClassProvider,
  ICommandHandlerMetadata,
  IInterceptor
} from '../../../interfaces'
import { Logger } from '../../../logger'
import { assign, isFunction } from 'lodash'
import {
  ModulesContainer,
  ComponentsContainer,
  ProvidersContainer,
  InterceptorsContainer
} from '../../containers'
import { BaseEventsHandlers, BaseCommands, BaseHandler } from './base-recursive.compiler.type'

export abstract class BaseRecursiveCompiler<TReturn> {
  protected _eventHandlers: BaseEventsHandlers<TReturn> = {}

  protected _config

  constructor(
    protected _moduleContainer: ModulesContainer,
    protected _componentContainer: ComponentsContainer,
    protected _providerContainer: ProvidersContainer,
    protected _interceptorContainer: InterceptorsContainer
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

  get moduleContainer() {
    return this._moduleContainer
  }

  get componentContainer() {
    return this._componentContainer
  }
  get providerContainer() {
    return this._providerContainer
  }
  get interceptorContainer() {
    return this._interceptorContainer
  }

  private getModuleMetadata(module: Type<any>, key: ModuleMetadata) {
    return Reflect.getMetadata(getPropertyKey(key), module)
  }

  async compileModule<T = any>(module: Type<T>, entryComponent?: Type<any>) {
    const [providers, modules, interceptors, components] = [
      this.getModuleMetadata(module, ModuleMetadata.PROVIDERS),
      this.getModuleMetadata(module, ModuleMetadata.MODULES),
      this.getModuleMetadata(module, ModuleMetadata.INTERCEPTOR),
      this.getModuleMetadata(module, ModuleMetadata.COMPONENTS)
    ]

    if (providers) {
      await Promise.all(providers.map((provider) => this.compileProvider(module, provider)))
    }

    if (entryComponent) {
      // first entry needs custom config
      this._moduleContainer.setEntryComponent(entryComponent)
      this.compileComponent(module, entryComponent)
    }

    if (modules) {
      await Promise.all(modules.map((m) => this.compileModule(m)))
      this._moduleContainer.importModules(modules)
    }

    if (interceptors) {
      await Promise.all(
        interceptors.map((interceptor) => this.compileInterceptor(module, interceptor))
      )
    }

    if (components) {
      await Promise.all(components.map((component) => this.compileComponent(module, component)))
    }

    this._moduleContainer.clear()
  }

  protected async compileProvider(module: Type<any>, provider: Provider) {
    if (provider.useValue) {
      this._providerContainer.setValueProvider(module, provider)
    } else if (provider.useFactory) {
      const { provide, useFactory } = provider
      const useValue = (isFunction(useFactory) && (await useFactory(this._config))) || null
      this._providerContainer.setValueProvider(module, <Provider>{
        provide,
        useValue
      })
    } else if (provider.useClass) {
      const { useClass, provide } = provider
      const useValue = this.compileComponent(module, useClass)
      this._providerContainer.setValueProvider(module, <Provider>{
        provide,
        useValue
      })
    }
  }

  /**
   * Find the instance for injection, if exists then inject it, if not create it and store it
   */
  compileComponent(module: Type<any>, target: Type<any>) {
    if (isValue(target)) return

    const createdInstance = this._componentContainer.getInstance(target)
    if (createdInstance) return createdInstance

    const compiledInstance = this.compileInstance(module, target)
    this._componentContainer.addInstance(target, compiledInstance)

    Promise.resolve().then(() => this.compileHandlerForEvent(target, compiledInstance))

    return compiledInstance
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
    Logger.debug(`${target.name} created!`, this.context)
    return compiledInstance
  }

  protected loadInjectionsForTarget(module: Type<any>, target: Type<any>) {
    const tokens: Type<any>[] = Reflect.getMetadata(PARAMTYPES_METADATA, target) || []
    const customTokens: { [paramIndex: string]: /* param name */ string } =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || []
    return tokens.map((token: Type<any>, paramIndex: number) => {
      if (customTokens && customTokens[paramIndex]) {
        // module-based value provider
        const customProvide = this._providerContainer.getProvider(module, customTokens[paramIndex])
        /* TODO: class provider */
        if (isValueInjector(customProvide))
          return (customProvide as CustomValueProvider<any>).useValue
        else if (isClassInjector(customProvide))
          return this.compileComponent(module, (customProvide as CustomClassProvider<any>).useClass)
      }
      const created = this._componentContainer.getInstance(token)
      if (created) return created
      return this.compileComponent(module, token)
    })
  }
  protected createEventHandler(event: DiscordEvent) {
    if (this.eventHandlers[event]) return
    this.eventHandlers[event] = {
      handlers: {} as BaseCommands<TReturn>
    }
  }

  protected defineHandler(
    onEvent: DiscordEvent,
    target: Type<any>,
    handleInstance: InstanceType<Type<any>>
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

  protected compileHandlers(
    target: Type<any>,
    instance: InstanceType<Type<any>>,
    handlerMetadata: ICommandHandlerMetadata[]
  ): BaseCommands<TReturn> {
    return handlerMetadata.reduce(
      (acc: BaseCommands<TReturn>, { command, propertyKey, commandAliases }) => {
        const commandFn = this.compileCommand(target, instance, propertyKey)
        const mainCommand = { [command]: commandFn }
        const aliases = [...(commandAliases || [])].reduce(
          (accAliases, currAlias) => ({
            ...accAliases,
            [currAlias]: mainCommand[command]
          }),
          {}
        )
        return Object.assign(acc, mainCommand, aliases)
      },
      {} as BaseCommands<TReturn>
    )
  }

  protected assignConfig(event: DiscordEvent, config: ICommandHandlerMetadata[]): void {
    if (this.eventHandlers[event].config) return
    this.eventHandlers[event].config = config
  }

  protected assignHandleFunctions(
    event: DiscordEvent,
    commandHandlers: BaseCommands<TReturn>
  ): void {
    assign(this.eventHandlers[event].handlers, commandHandlers)
  }

  protected compileInterceptor(module: Type<any>, interceptorTarget: Type<any>) {
    if (isValue(interceptorTarget)) return
    const interceptor = this._interceptorContainer.getInterceptorInstance(interceptorTarget.name)
    if (interceptor) return interceptor

    const compiledInterceptor = this.compileInstance(module, interceptorTarget)
    this._interceptorContainer.addInterceptor(interceptorTarget, compiledInterceptor)

    return compiledInterceptor
  }

  protected getInterceptor(target: Type<any>): IInterceptor<TReturn> {
    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    return useInterceptor ? this._interceptorContainer.getInterceptorInstance(useInterceptor) : null
  }

  protected abstract compileCommand(
    target: Type<any>,
    instance: InstanceType<Type<any>>,
    propertyKey: string
  ): BaseHandler<TReturn>
}
