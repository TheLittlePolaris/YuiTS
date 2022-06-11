import { COMMAND_HANDLER } from '@/ioc-container/constants/dependencies-injection.constant'
import { ICommandHandlerMetadata, Prototype } from '@/ioc-container/interfaces'
import { createMethodDecorator } from '@/ioc-container/helpers'
import { ExecutionContext } from '@/ioc-container/event-execution-context'

export const EventHandler = createMethodDecorator(
  (context: ExecutionContext) => {
    return context
  },
  (target: Prototype, propertyKey: string) => {
    let commands: ICommandHandlerMetadata[] = Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
    commands = [...commands, { propertyKey, command: 'default' }]
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)
  }
)
