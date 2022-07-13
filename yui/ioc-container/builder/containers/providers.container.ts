import { Collection } from 'discord.js'

import { Provider, Type } from '../../interfaces'

export class ProvidersContainer {
  private _providers: Collection<string, Provider<any>> = new Collection<string, any>()

  public get providers() {
    return this._providers
  }
  public setValueProvider(module: Type<any>, provider: Provider) {
    this._providers.set(this.providerNameConstructor(module, provider.provide), provider)
  }

  public getProvider(forModule: Type<any>, paramName: string) {
    return this._providers.get(this.providerNameConstructor(forModule, paramName))
  }

  private providerNameConstructor(module: Type<any>, paramName: string) {
    return `${module.name}_${paramName}`
  }

  public clear() {
    this._providers.clear()
  }
}
