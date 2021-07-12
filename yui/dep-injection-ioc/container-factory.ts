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
} from '@/dep-injection-ioc/constants/di-connstants'
import { YuiModule } from './module'
import { isValueInjector, isValue, isFunction } from './helper-functions'
import { DiscordEvent } from '@/constants/discord-events'
import { YuiLogger } from '@/log/logger.service'

export class YuiContainerFactory {
  static entryDetected = false

  private container = new YuiModule()
  private logger = new YuiLogger('YuiContainerFactory')

  async create<T = any>(moduleMetadata: Type<any>): Promise<T> {
    await this.initialize(moduleMetadata)

    const entryInstance: EntryComponent = this.container.entryInstance
    this.testEntryInstance(entryInstance)

    /**
     * IMPORTANT:
     *  - Required the entry component to implement EntryComponent interface
     *  - Require events to be defined within entry component
     */

    const entryComponent: Type<any> = this.container.entryComponent
    const boundEvents = Reflect.getMetadata(COMPONENT_METADATA.EVENT_LIST, entryComponent.prototype)
    const eventKeys = Object.keys(boundEvents)
    if (eventKeys.length) {
      eventKeys.forEach((eventKey: DiscordEvent) =>
        entryInstance.client.addListener(eventKey, (...args) =>
          entryInstance[boundEvents[eventKey]](...args)
        )
      )
    } else {
      this.logger.warn('No event listener detected!')
    }

    return entryInstance as unknown as T
  }

  async initialize<T = any>(module: Type<T>) {
    const entryComponent = Reflect.getMetadata(MODULE_METADATA.ENTRY_COMPONENT, module)
    if (entryComponent) this.container.setEntryComponent(entryComponent)

    const providers: CustomValueProvider<T>[] = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      module
    )
    if (providers) {
      for (const provider of providers) this.injectValueProvider(module, provider)
    }

    const modules: Type<T>[] = Reflect.getMetadata(MODULE_METADATA.MODULES, module)
    if (modules) {
      await Promise.all(modules.map((m) => this.initialize(m)))
      this.container.importModules(modules)
    }

    const components: Type<T>[] = Reflect.getMetadata(MODULE_METADATA.COMPONENTS, module)
    if (components) {
      components.map((c) => this.loadComponentInjection(c, module))
    }
  }

  /**
   * Find the instance for injection, if exists then inject it, if not create it and store it
   */
  loadComponentInjection<T = any>(target: Type<T>, module: Type<T>): T {
    const createdInstance = this.container.getInstance<T>(target)
    if (createdInstance) return createdInstance

    const tokens: Type<T>[] = Reflect.getMetadata(PARAMTYPES_METADATA, target) || []

    const customTokens: { [paramIndex: string]: /* param name */ string } =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || []

    const injections = tokens.map((token: Type<T>, paramIndex: number) => {
      if (customTokens && customTokens[paramIndex]) {
        // module-based value provider
        const customToken = this.container.getProvider(module, customTokens[paramIndex])

        /* TODO: class provider */
        if (isValueInjector(customToken)) return (customToken as CustomValueProvider<T>).useValue
        else
          return this.loadComponentInjection(
            (customToken as CustomClassProvider<T>).useClass,
            module
          )
      }
      const created = this.container.getInstance(token)
      if (created) return created
      return this.loadComponentInjection(token, module)
    })

    const newInstance: T = Reflect.construct(target, injections)

    if (isValue(target)) return
    this.container.addInstance(target, newInstance)
    return newInstance
  }

  injectValueProvider<T = any>(module: Type<T>, provider: CustomValueProvider<T>) {
    this.container.setValueProvider(module, provider)
  }

  injectClassProvider<T = any>(module: Type<T>, provider: CustomClassProvider<T>) {}

  testEntryInstance(entryInstance: EntryComponent) {
    if (!entryInstance) throw new Error('No entry detected!')
    const { start, client } = entryInstance
    if (!client) throw new Error('Client for the instance has not been defined')
    if (!(start && isFunction(start))) throw new Error(`Component's starting point not detected!`)
  }
}
