import 'reflect-metadata'

/* TEST IMPLEMENTINGn DI */
export type GenericClassDecorator<T> = (target: T) => void
export interface Type<T> {
  new (...args: any[]): T
}

export const Injectable = (): GenericClassDecorator<Type<any>> => {
  return (target: Type<any>) => {
    // do something with `target`, e.g. some kind of validation or passing it to the Injector and store them
  }
}

export const Injector = new (class {
  // resolving instances
  resolve<T>(target: Type<any>): T {
    // tokens are required dependencies, while injections are resolved tokens from the Injector
    const tokens = Reflect.getMetadata('design:paramtypes', target) || []
    console.log(tokens, ' <==== design param type tokens')
    const injections = tokens.map((token) => Injector.resolve<any>(token))

    return new target(...injections)
  }
})()
