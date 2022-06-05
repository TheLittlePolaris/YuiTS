import { Collection } from 'discord.js'

import { EntryComponent, Type } from '../interfaces/dependencies-injection.interfaces'

export type EntryInstance<T extends Type<any>> = InstanceType<T>

export class ComponentsContainer {
  private _instances: Collection<string, InstanceType<any>> = new Collection<string, InstanceType<any>>()
  private _entryComponent: Type<EntryComponent> = null
  public get components() {
    return this._instances
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

  public getInstance<T = any>(forTarget: Type<T>): InstanceType<Type<T>> {
    return this._instances.get(forTarget.name)
  }
}
