/* eslint-disable @typescript-eslint/no-explicit-any */

/* ================================== INTERFACES ===================================== */
export type GenericClassDecorator<T> = (target: T) => void

export interface Type<T> extends Function {
  new (...args: any[]): T
}

export type Provider<T = any> = CustomValueProvider<T> | CustomClassProvider<T>

export interface CustomValueProvider<T> {
  provide: string
  useValue: T
}

export interface CustomClassProvider<T> {
  provide: string
  useClass: Type<T>
}

export type CustomProviderToken = { [key: string]: number | string }

export interface ModuleOption {
  providers?: CustomValueProvider<any>[]
  modules?: Type<any>[]
  components: Type<any>[]
  entryComponent?: Type<any>
}

export interface EntryConponent<T = void | Promise<void>> {
  start: (...args: any) => T
}
/**************************************************************************************/
