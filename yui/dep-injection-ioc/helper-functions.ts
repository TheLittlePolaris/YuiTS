/* ======================== HELPER FUCNTION ======================================== */
export const isUndefined = (obj: unknown): obj is undefined => typeof obj === 'undefined'
export const isFunction = (fn: unknown): boolean => typeof fn === 'function'
export const isString = (fn: unknown): fn is string => typeof fn === 'string'
export const isConstructor = (fn: unknown): boolean => fn === 'constructor'
export const isNil = (obj: unknown): obj is null | undefined => isUndefined(obj) || obj === null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEmpty = (array: any): boolean => !(array && array.length > 0)
export const isSymbol = (fn: unknown): fn is symbol => typeof fn === 'symbol'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isValue = (fn: any): boolean =>
  fn && (fn.name === 'String' || fn.name === 'Object' || fn.name === 'Number')

export const isValueInjector = (obj: any): boolean => obj && obj['useValue']
export const isClassInjector = (obj: any): boolean => obj && obj['useClass']
