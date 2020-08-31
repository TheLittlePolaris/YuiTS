import { Type, CustomValueProvider, CustomClassProvider } from './interfaces/di-interfaces'
import {
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '@/decorators/dep-injection-ioc/constants/di-connstants'
import { YuiModule } from './module'
import { isValueInjector, isValue } from './helper-functions'

export class YuiContainerFactory {
  static entryDetected = false

  private container = new YuiModule()

  async create<T = any>(moduleMetadata: Type<any>): Promise<T> {
    await this.initialize(moduleMetadata)

    const entryInstance: T = this.container.getEntryInstance()
    if (!entryInstance) throw new Error('No entry detected!')

    return entryInstance
  }

  async initialize<T = any>(module: Type<T>) {
    const providers: CustomValueProvider<T>[] = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, module)
    if (providers) {
      for (const provider of providers) this.injectValueProvider(module, provider)
    }

    const entryComponent = Reflect.getMetadata(MODULE_METADATA.ENTRY_COMPONENT, module)
    if (entryComponent) this.container.setEntryComponent(entryComponent)

    const modules: Type<T>[] = Reflect.getMetadata(MODULE_METADATA.MODULES, module)
    if (modules) {
      for (const module of modules) {
        await this.initialize(module)
      }
      this.container.importModules(modules)
    }

    const components: Type<T>[] = Reflect.getMetadata(MODULE_METADATA.COMPONENTS, module)
    if (components) {
      for (const component of components) {
        this.loadComponentInjection(component, module)
      }
    }
  }

  /**
   * Find the instance for injection, if exists then inject it, if not create it and store it
   */
  loadComponentInjection<T = any>(target: Type<T>, module: Type<T>): T {
    const createdInstance = this.container.getInstance(target)
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
        else return this.loadComponentInjection((customToken as CustomClassProvider<T>).useClass, module)
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
}
