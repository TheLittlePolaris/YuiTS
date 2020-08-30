import { CustomValueProvider, Type, Provider } from './interfaces/di-interfaces'
export class ModuleContainer {
  private _modules: Set<ModuleContainer>
  private _providers: Map<string, Provider<any>>
  constructor() {}

  get providers() {
    return this._providers
  }

  get modules() {
    return this._modules
  }

  setModules(modules: ModuleContainer[]) {
    modules.map((m) => {
      if (!this._modules.has(m)) this.modules.add(m)
    })
  }

  setProvders(providers: Provider[]) {
    providers.map((p: Provider) => {
      if (p['name']) return this._providers.set(p['name'], p)

      if (p['useClass']) {
        return this._providers.set(p['provide'], p['useClass'])
      }
      if (p['useValue']) {
        return this._providers.set(p['provide'], p['useValue'])
      }
    })
  }
}
