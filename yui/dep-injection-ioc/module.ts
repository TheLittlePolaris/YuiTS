import { CustomValueProvider, Provider, EntryConponent, Type } from './interfaces/di-interfaces'
export class YuiModule {
  private _modules: Map<string, Type<any>> = new Map()
  private _providers: Map<string, Provider<any>> = new Map()
  private _instances: Map<string, any> = new Map()
  private _entryComponent: Type<any> = null

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

  get entryComponent(): Type<any> {
    return this._entryComponent
  }

  get entryInstance(): any {
    return this._instances.get(this.entryComponent.name)
  }

  setEntryComponent(component: Type<any>) {
    this._entryComponent = component
  }

  addInstance(target: Type<any>, compiledInstance: any) {
    this.components.set(target.name, compiledInstance)
  }

  setValueProvider(module: Type<any>, provider: CustomValueProvider<any>) {
    const key = `${module.name}_${provider.provide}`
    this._providers.set(key, provider)
  }

  importModules(modules: Type<any>[]) {
    modules.map((module) => this.addModule(module.name, module))
  }

  getInstance(forTarget: Type<any>) {
    return this._instances.get(forTarget.name)
  }

  getProvider(forModule: Type<any>, paramName: string) {
    const name = `${forModule.name}_${paramName}`
    return this._providers.get(name)
  }

  addModule(key: string, module: Type<any>) {
    this._modules.set(key, module)
  }

  clear() {
    this._instances.clear()
    this._modules.clear()
    this._providers.clear()
  }
}
