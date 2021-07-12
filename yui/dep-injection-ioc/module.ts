import { Collection } from 'discord.js'
import { CustomValueProvider, Provider, Type } from './interfaces/di-interfaces'
export class YuiModule {
  private _modules: Collection<string, Type<any>> = new Collection<string, Type<any>>()
  private _providers: Collection<string, Provider<any>> = new Collection<string, any>()
  private _instances: Collection<string, any> = new Collection<string, any>()
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

  setEntryComponent<T>(component: Type<T>) {
    this._entryComponent = component
  }

  addInstance<T>(target: Type<T>, compiledInstance: T) {
    this.components.set(target.name, compiledInstance)
  }

  setValueProvider(module: Type<any>, provider: CustomValueProvider<any>) {
    this._providers.set(this.providerNameConstructor(module, provider.provide), provider)
  }

  importModules(modules: Type<any>[]) {
    modules.map((module) => this.addModule(module))
  }

  getInstance<T = any>(forTarget: Type<T>): T {
    return this._instances.get(forTarget.name)
  }

  getProvider(forModule: Type<any>, paramName: string) {
    return this._providers.get(this.providerNameConstructor(forModule, paramName))
  }

  private providerNameConstructor(module: Type<any>, paramName: string) {
    return `${module.name}_${paramName}`
  }

  addModule(module: Type<any>) {
    this._modules.set(module.name, module)
  }

  clear() {
    this._instances.clear()
    this._modules.clear()
    this._providers.clear()
  }
}
