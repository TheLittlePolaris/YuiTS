/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type, CustomValueProvider, EntryConponent, CustomProviderToken } from './interfaces/di-interfaces'
import { MODULE_METADATA, PARAMTYPES_METADATA, SELF_DECLARED_DEPS_METADATA } from '@/constants/di-connstants'
import { ModuleContainer } from './module'
import { isEmpty, isValue } from './helper-functions'

export class YuiContainerFactory<T = any> {
  static entryDetected = false

  private container = new YuiContainer<T>()

  async create(target: Type<any>): Promise<Type<T>> {
    await this.initialize(target)

    const entryComponent = this.container.getEntryComponent()
    if (!entryComponent) throw new Error('No entry detected!')

    const componentInstance = this.container.components.get(entryComponent.name)
    return componentInstance
  }

  async initialize(module: Type<any>) {
    const providers: CustomValueProvider<any>[] = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, module)
    if (providers) {
      for (const provider of providers) this.injectCustomProvider(provider)
    }

    const entryComponent = Reflect.getMetadata(MODULE_METADATA.ENTRY_COMPONENT, module)
    if (entryComponent) this.container.setEntryComponent(entryComponent)

    const modules: Type<any>[] = Reflect.getMetadata(MODULE_METADATA.MODULES, module)
    if (modules) {
      for (const module of modules) await this.initialize(module)
    }

    const components: Type<any>[] = Reflect.getMetadata(MODULE_METADATA.COMPONENTS, module)
    if (components) {
      for (const component of components) {
        this.loadComponentInjection(component)
      }
    }
  }

  loadComponentInjection(target: Type<T>) {
    const createdInstance = this.container.components.get(target.name)
    if (createdInstance) return createdInstance

    const tokens = Reflect.getMetadata(PARAMTYPES_METADATA, target)
    const customTokens = Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target)

    const injections =
      (!isEmpty(tokens) &&
        tokens.map((token: Type<T>, i: number) => {
          if (isValue(token) && customTokens) {
            const customToken = this.container.providers.get(customTokens[i])
            return customToken.useValue
          }
          const created = this.container.components.get(token.name)
          if (created) return created
          return this.loadComponentInjection(token)
        })) ||
      []

    const newInstance = Reflect.construct(target, injections)

    if (isValue(target)) return
    this.container.setComponent(target.name, newInstance)
    return newInstance
  }

  injectCustomProvider(provider: CustomValueProvider<T>) {
    const { provide } = provider
    this.container.setProvider(provide, provider)
  }
}

export class YuiContainer<T = any> {
  private _modules: Map<string, ModuleContainer> = new Map()
  private _providers: Map<string, CustomValueProvider<T>> = new Map()
  private _components: Map<string, Type<T>> = new Map()
  private entryComponent: EntryConponent<T> = null

  constructor() {}

  get providers() {
    return this._providers
  }
  get components() {
    return this._components
  }
  get modules() {
    return this._modules
  }

  getModules() {
    return this._modules
  }

  getProviders() {
    return this._providers
  }

  getComponents() {
    return this._components
  }

  getEntryComponent(): any {
    return this.entryComponent
  }

  setEntryComponent(component: EntryConponent<T>) {
    this.entryComponent = component
  }

  setComponent(key: string, component: Type<any>) {
    this.components.set(key, component)
  }

  setProvider(key: string, provider: CustomValueProvider<any>) {
    this._providers.set(key, provider)
  }

  addModule(key: string, module: ModuleContainer) {
    this._modules.set(key, module)
  }

  clear() {
    this._components.clear()
    this._modules.clear()
    this._providers.clear()
  }
}
