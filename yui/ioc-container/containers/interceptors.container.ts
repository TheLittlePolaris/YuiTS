import { Collection } from 'discord.js'
import { EntryComponent, Provider, Type } from '../interfaces/dependencies-injection.interfaces'


export class InterceptorsContainer {
  private _interceptors: Collection<string, InstanceType<Type<any>>> = new Collection<string, InstanceType<Type<any>>>()

  public get interceptors() {
    return this._interceptors
  }
  public addInterceptor<T>(target: Type<T>, instance: InstanceType<Type<T>>) {
    this.interceptors.set(target.name, instance)
  }

  public getInterceptorInstance<T>(interceptorName: string) {
    return this._interceptors.get(interceptorName)
  }

  public clear() {
    this.interceptors.clear()
  }
}
