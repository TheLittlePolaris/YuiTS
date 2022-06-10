import { ClientEvents } from 'discord.js'
import { catchError, finalize, fromEvent, map, noop, Observable, of, take, takeWhile } from 'rxjs'
import { RxjsRecursiveCompiler } from '../compilers'
import { DEFAULT_ACTION_KEY, DiscordEvent } from '../constants'
import { ComponentsContainer, InterceptorsContainer, ModulesContainer, ProvidersContainer } from '../containers'
import { DiscordClient } from '../entrypoint'
import { ExecutionContext } from '../event-execution-context/event-execution-context'
import { RxjsCommands, RxjsHandler, Type } from '../interfaces'
import { Logger } from '../logger'
import { BaseContainerFactory } from './base.container-factory'

export class RxjsContainerFactory extends BaseContainerFactory<RxjsHandler, RxjsCommands> {
  constructor() {
    const moduleContainer = new ModulesContainer()
    const componentContainer = new ComponentsContainer()
    const interceptorContainer = new InterceptorsContainer()
    const providerContainer = new ProvidersContainer()
    super(new RxjsRecursiveCompiler(moduleContainer, componentContainer, providerContainer, interceptorContainer))
  }

  async initialize(rootModule: Type<any>, entryComponent = DiscordClient): Promise<DiscordClient> {
    await this.compiler.compileModule(rootModule, entryComponent)

    this.assignContext()

    const client = this.getClient()

    this.subscribeEvents(client)

    return client
  }

  private assignContext() {
    const config = this.getConfig()
    this.config = config

    ExecutionContext.client = this.getClient()
    ExecutionContext.config = config
  }

  private subscribeEvents(client: DiscordClient) {
    Object.keys(this.eventHandlers).forEach((event: DiscordEvent) => {
      fromEvent(client, event)
        .pipe(
          map((args: ClientEvents[DiscordEvent]) => this.filterCommand(event, args)),
          takeWhile((args: ClientEvents[DiscordEvent]) => !!args),
          map((args: ClientEvents[DiscordEvent]) => this.createExecutionContext(args)),
          map((context: ExecutionContext) => ({
            observable: this.handleEvent(event, context) as Observable<any>,
            context
          })),
          map(({ observable, context }) =>
            observable
              .pipe(
                take(1),
                finalize(() => {
                  Logger.log(
                    `${context.contextName}.${context.propertyKey} execution time: ${
                      Date.now() - context.executionStartTimestamp
                    }ms`
                  )
                }),
                catchError((error: Error) => {
                  Logger.error(
                    `Uncaught handler error: ${error?.stack}`,
                    `${context.contextName}.${context.propertyKey}`
                  )
                  return of(null)
                })
              )
              .subscribe()
          ),
          catchError((error: Error) => {
            Logger.error(`Uncaught event pipeline error: Stack: ${error?.stack}`, 'AppContainer')
            return of(null)
          })
        )
        .subscribe()
    })
  }

  public get<T>(type: Type<T>): InstanceType<Type<T>> {
    return this.compiler.componentContainer.getInstance(type)
  }

  protected getHandler(event: keyof ClientEvents, command: string | false): RxjsHandler {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (command === false) return (..._args: any) => of(noop)
    const { [command]: compiledCommand = null, [DEFAULT_ACTION_KEY]: defaultAction } =
      this.eventHandlers[event].handlers

    return compiledCommand || defaultAction
  }
}
