export abstract class StaticResolver<T> {
  protected readonly _container: { [key: string]: T }
}
