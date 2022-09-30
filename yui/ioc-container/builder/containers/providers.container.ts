import { Collection } from 'discord.js';

import { Provider, Type } from '../../interfaces';

export class ProvidersContainer {
  private readonly _providers: Collection<string, Provider<any>> = new Collection<string, any>();

  public get providers() {
    return this._providers;
  }
  public setValueProvider(module: Type<any>, provider: Provider) {
    this._providers.set(this.providerNameConstructor(module, provider.provide), provider);
  }

  public getProvider(forModule: Type<any>, parameterName: string) {
    return this._providers.get(this.providerNameConstructor(forModule, parameterName));
  }

  private providerNameConstructor(module: Type<any>, parameterName: string) {
    return `${module.name}_${parameterName}`;
  }

  public clear() {
    this._providers.clear();
  }
}
