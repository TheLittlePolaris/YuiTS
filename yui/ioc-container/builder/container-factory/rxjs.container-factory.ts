import { ClientEvents } from 'discord.js'
import { catchError, EMPTY, finalize, fromEvent, mergeMap, noop, Observable, of, take } from 'rxjs'
import { RxjsRecursiveCompiler } from '../compilers/rxjs.compiler'
import { DEFAULT_ACTION_KEY, DiscordEvent } from '../../constants'
import { ComponentsContainer, InterceptorsContainer, ModulesContainer, ProvidersContainer } from '../containers'
import { DiscordClient } from '../../entrypoint'
import { ExecutionContext } from '../../event-execution-context/execution-context'
import { Type } from '../../interfaces'
import { Logger } from '../../logger'
import { BaseContainerFactory } from './base.container-factory'

export class RxjsContainerFactory extends BaseContainerFactory<Observable<any>> {
  constructor() {
    const moduleContainer = new ModulesContainer()
    const componentContainer = new ComponentsContainer()
    const interceptorContainer = new InterceptorsContainer()
    const providerContainer = new ProvidersContainer()
    super(new RxjsRecursiveCompiler(moduleContainer, componentContainer, providerContainer, interceptorContainer))
  }

  async initialize(rootModule: Type<any>, entryComponent = DiscordClient) {
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
          // filter incoming events
          mergeMap((args: ClientEvents[DiscordEvent]) => this.filterEvent(event, args)),
          // prepare the context
          mergeMap((args) => this.createObservablePipelineContext(event, args)),
          // execute the context
          mergeMap(({ observable, context }) => {
            return observable.pipe(
              take(1),
              finalize(() => {
                Logger.log(
                  `${context.contextName}.${context.propertyKey} execution time: ${
                    Date.now() - context.executionStartTimestamp
                  }ms`
                )
              }),
              catchError((error: Error) => {
                Logger.error(`Uncaught handler error: ${error?.stack}`, `${context.contextName}.${context.propertyKey}`)
                return EMPTY
              })
            )
          }),
          catchError((error: Error) => {
            Logger.error(`Uncaught event pipeline error: Stack: ${error?.stack}`, 'AppContainer')
            return EMPTY
          })
        )
        .subscribe()
    })
  }

  public get<T>(type: Type<T>): InstanceType<Type<T>> {
    return this.compiler.componentContainer.getInstance(type)
  }

  protected getHandler(event: keyof ClientEvents, command: string | false) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (command === false) return (..._args: any) => of(noop)
    const { [command]: compiledCommand = null, [DEFAULT_ACTION_KEY]: defaultAction } =
      this.eventHandlers[event].handlers

    return compiledCommand || defaultAction
  }

  protected filterEvent(
    event: DiscordEvent,
    args: ClientEvents[DiscordEvent]
  ): Observable<ClientEvents[DiscordEvent] | never> {
    let result: Observable<ClientEvents[DiscordEvent] | never> = of(args)
    switch (event) {
      case 'messageCreate': {
        const {
          author: { bot },
          content
        } = args as any

        const { config } = this.eventHandlers['messageCreate']
        if (!config) break

        const { ignoreBots, startsWithPrefix } = config

        const notStartsWithPrefix = startsWithPrefix && !content.startsWith(this._config['prefix'])
        const isBot = ignoreBots && bot

        if (notStartsWithPrefix || isBot) result = EMPTY

        break
      }
      default:
        break
    }
    return result
  }

  private createObservablePipelineContext(event: DiscordEvent, args: ClientEvents[DiscordEvent]) {
    const context = this.createExecutionContext(args)

    const observable = this.handleEvent(event, context)

    return of({ observable, context }).pipe(take(1))
  }
}
