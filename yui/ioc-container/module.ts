import { Collection } from 'discord.js'
import { EntryComponent, Provider, Type } from './interfaces/dependencies-injection.interfaces'

export type EntryInstance<T extends Type<any>> = InstanceType<T>

export class ModuleContainer {
  private _modules: Collection<string, Type<any>> = new Collection<string, Type<any>>()
  private _providers: Collection<string, Provider<any>> = new Collection<string, any>()
  private _interceptors: Collection<string, InstanceType<Type<any>>> = new Collection<string, InstanceType<Type<any>>>()
  private _instances: Collection<string, InstanceType<any>> = new Collection<string,  InstanceType<any>>()
  private _entryComponent: Type<EntryComponent> = null

  public get providers() {
    return this._providers
  }
  public get components() {
    return this._instances
  }
  public get modules() {
    return this._modules
  }
  public get interceptors() {
    return this._interceptors
  }

  public get entryComponent(): Type<EntryComponent> {
    return this._entryComponent
  }
  public setEntryComponent(component: Type<EntryComponent>) {
    this._entryComponent = component
  }
  public get entryInstance(): EntryInstance<Type<EntryComponent>> {
    return this._instances.get(this.entryComponent.name)
  }


  public addInstance<T>(target: Type<T>, compiledInstance: InstanceType<Type<T>>) {
    this.components.set(target.name, compiledInstance)
  }
  
  public addInterceptor<T>(target: Type<T>, instance: InstanceType<Type<T>>) {
    this.interceptors.set(target.name, instance)
  }

  public setValueProvider(module: Type<any>, provider: Provider) {
    this._providers.set(this.providerNameConstructor(module, provider.provide), provider)
  }

  public importModules(modules: Type<any>[]) {
    modules.map((module) => this.addModule(module))
  }

  public getInstance<T = any>(forTarget: Type<T>): InstanceType<Type<T>> {
    return this._instances.get(forTarget.name)
  }

  public getProvider(forModule: Type<any>, paramName: string) {
    return this._providers.get(this.providerNameConstructor(forModule, paramName))
  }

  public getInterceptorInstance<T>(interceptorName: string) {
    return this._interceptors.get(interceptorName)
  }

  private providerNameConstructor(module: Type<any>, paramName: string) {
    return `${module.name}_${paramName}`
  }

  private addModule(module: Type<any>) {
    this._modules.set(module.name, module)
  }

  private clear() {
    this._instances.clear()
    this._modules.clear()
    this._providers.clear()
  }
}
