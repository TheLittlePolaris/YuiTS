/* ======================== HELPER FUCNTION ======================================== */
export const isUndefined = (object: unknown): object is undefined => typeof object === 'undefined';
export const isFunction = (function_: unknown): boolean => typeof function_ === 'function';
export const isString = (function_: unknown): function_ is string => typeof function_ === 'string';
export const isConstructor = (function_: unknown): boolean => function_ === 'constructor';
export const isNil = (object: unknown): object is null | undefined =>
  isUndefined(object) || object === null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEmpty = (array: any): boolean => !(array && array.length > 0);
export const isSymbol = (function_: unknown): function_ is symbol => typeof function_ === 'symbol';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isValue = (function_: any): boolean =>
  function_ &&
  (function_.name === 'String' || function_.name === 'Object' || function_.name === 'Number');

export const isValueInjector = (object: any): boolean => object && object.useValue;
export const isClassInjector = (object: any): boolean => object && object.useClass;

export const isObject = (function_: any): function_ is object =>
  !isNil(function_) && typeof function_ === 'object';
