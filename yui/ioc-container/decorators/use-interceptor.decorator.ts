import { INTERCEPTOR_TARGET } from "../constants/di-connstants";
import { Type } from "../interfaces/di-interfaces";
import { decoratorLogger } from "../log/logger";



export function UseInterceptor<T>(targetInstance: Type<T>) {
  return (target: Type<any>) => {
    decoratorLogger(target.name, 'Class')
    Reflect.defineMetadata(INTERCEPTOR_TARGET, targetInstance.name, target)
  }
}