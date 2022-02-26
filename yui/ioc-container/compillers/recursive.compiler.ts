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
  private readonly CONTEXT = `Compiler`
  private _eventHandlers: {
    [key in DiscordEvent]?: { handleFunction: HandleFunction; config?: DiscordEventConfig[key] }
  } = {}

  private _config

  constructor(
    private moduleContainer: ModulesContainer,
    private componentContainer: ComponentsContainer,
    private providerContainer: ProvidersContainer,
    private interceptorContainer: InterceptorsContainer
  ) {}

  public get config() {
    return this._config
  }

  public get eventHandlers() {
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

  private async compileProvider(module: Type<any>, provider: Provider) {
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

  private injectExternalConfig(type: Type<any>, instance: InstanceType<Type<any>>) {
    const { entryComponent } = this.moduleContainer
    if (type.name === entryComponent.name) return
    // TODO: create something like: createMethodDecorator(([client,config]) => {...})
    instance[BOT_GLOBAL_CLIENT] = this.componentContainer.getInstance(entryComponent)
    instance[BOT_GLOBAL_CONFIG] = this._config
  }

  private async compileHandlerForEvent(
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

  private compileInstance(module: Type<any>, target: Type<any>) {
    const injections = this.loadInjectionsForTarget(module, target)
    const compiledInstance = Reflect.construct(target, injections)
    if (isFunction(compiledInstance.onComponentInit)) compiledInstance.onComponentInit()
    YuiLogger.debug(`${target.name} created!`, this.CONTEXT)
    return compiledInstance
  }

  private loadInjectionsForTarget(module: Type<any>, target: Type<any>) {
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
      (useInterceptor && this.interceptorContainer.getInterceptorInstance(useInterceptor)) || null

    const compileCommand = (propertyKey: string) => {
      // bind: passive when go through interceptor, active when call directly
      const handler = (_eventArgs: ClientEvents[DiscordEvent], bind = false) =>
        bind
          ? (handleInstance[propertyKey] as Function).bind(handleInstance, _eventArgs, this._config)
          : (handleInstance[propertyKey] as Function).apply(handleInstance, [
              _eventArgs,
              this._config,
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

  compileInterceptor(module: Type<any>, interceptorTarget: Type<any>) {
    if (isValue(interceptorTarget)) return
    const interceptor = this.interceptorContainer.getInterceptorInstance(interceptorTarget.name)
    if (interceptor) return interceptor

    const compiledInterceptor = this.compileInstance(module, interceptorTarget)
    this.interceptorContainer.addInterceptor(interceptorTarget, compiledInterceptor)

    return compiledInterceptor
  }
}
