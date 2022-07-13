import { Collection } from 'discord.js'

import { EntryComponent, Type } from '../../interfaces'

export type Instance<T extends Type<any>> = InstanceType<T>

export class ModulesContainer {
  private _modules: Collection<string, Type<any>> = new Collection<string, Type<any>>()
  private _entryComponentType: Type<EntryComponent> = null

  public get modules() {
    return this._modules
  }

  public get entryComponent(): Type<EntryComponent> {
    return this._entryComponentType
  }
  public setEntryComponent(component: Type<EntryComponent>) {
    this._entryComponentType = component
  }

  public importModules(modules: Type<any>[]) {
    modules.map((module) => this.addModule(module))
  }
  private addModule(module: Type<any>) {
    this._modules.set(module.name, module)
  }

  public clear() {
    this._modules.clear()
  }
}
