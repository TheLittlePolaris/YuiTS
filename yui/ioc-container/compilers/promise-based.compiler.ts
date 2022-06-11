import { ComponentsContainer, InterceptorsContainer, ProvidersContainer } from '../containers'
import { ModulesContainer } from '../containers/modules.container'
import { ExecutionContext } from '../event-execution-context/event-execution-context'
import { Type } from '../interfaces/dependencies-injection.interfaces'
import { BaseRecursiveCompiler } from './base/base-recursive.compiler'

/**
 * @description Compile using recursive strategy.
 */
export class PromiseBasedRecursiveCompiler extends BaseRecursiveCompiler<Promise<any>> {
  constructor(
    protected _moduleContainer: ModulesContainer,
    protected _componentContainer: ComponentsContainer,
    protected _providerContainer: ProvidersContainer,
    protected _interceptorContainer: InterceptorsContainer
  ) {
    super(_moduleContainer, _componentContainer, _providerContainer, _interceptorContainer)
  }

  protected compileCommand(target: Type<any>, instance: InstanceType<Type<any>>, propertyKey: string) {
    const interceptor = this.getInterceptor(target)
    // bind: passive when go through interceptor, active when call directly
    const fromHandler = (context: ExecutionContext) => context.call<Promise<any>>()

    const handler = (context: ExecutionContext): Promise<any> => {
      context.setContextMetadata({ target, propertyKey })
      context.setHandler(instance[propertyKey].bind(instance))
      return !interceptor ? fromHandler(context) : interceptor.intercept(context, () => fromHandler(context))
    }

    return handler
  }
}
