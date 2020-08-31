import { CustomValueProvider, Provider, EntryConponent, Type } from './interfaces/di-interfaces'
export class YuiModule<T = any> {
  private _modules: Map<string, Type<T>> = new Map()
  private _providers: Map<string, Provider<T>> = new Map()
  private _instances: Map<string, T> = new Map()
  private entryComponent: Type<T> = null

  get providers() {
    return this._providers
  }
  get components() {
    return this._instances
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
    return this._instances
  }

  getEntryComponent(): any {
    return this.entryComponent
  }

  getEntryInstance(): T {
    return this._instances.get(this.entryComponent.name)
  }

  setEntryComponent(component: Type<T>) {
    this.entryComponent = component
  }

  addInstance(target: Type<T>, compiledInstance: T) {
    this.components.set(target.name, compiledInstance)
  }

  setValueProvider(module: Type<T>, provider: CustomValueProvider<any>) {
    const key = `${module.name}_${provider.provide}`
    this._providers.set(key, provider)
  }

  importModules(modules: Type<T>[]) {
    modules.map((module) => this.addModule(module.name, module))
  }

  getInstance(forTarget: Type<T>) {
    return this._instances.get(forTarget.name)
  }

  getProvider(forModule: Type<T>, paramName: string) {
    const name = `${forModule.name}_${paramName}`
    return this._providers.get(name)
  }

  addModule(key: string, module: Type<T>) {
    this._modules.set(key, module)
  }

  clear() {
    this._instances.clear()
    this._modules.clear()
    this._providers.clear()
  }
}
