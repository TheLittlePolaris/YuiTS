import { Collection } from 'discord.js'

import { Type } from '../interfaces/dependencies-injection.interfaces'

export class InterceptorsContainer {
  private _interceptors: Collection<string, InstanceType<Type<any>>> = new Collection<string, InstanceType<Type<any>>>()

  public get interceptors() {
    return this._interceptors
  }

  public addInterceptor<T>(target: Type<T>, instance: InstanceType<Type<T>>) {
    this.interceptors.set(target.name, instance)
  }

  public getInterceptorInstance<T extends Type<any>>(interceptorName: string): InstanceType<T> {
    return this._interceptors.get(interceptorName)
  }

  public clear() {
    this.interceptors.clear()
  }
}
