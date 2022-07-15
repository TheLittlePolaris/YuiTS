import { Message } from 'discord.js'
import { createMethodDecorator, createParamDecorator, ExecutionContext } from 'djs-ioc-container'
import { bold, sendDMMessage } from '../../utilities'

export const AdminCommandValidator = createMethodDecorator((ctx: ExecutionContext) => {
  const [message, args] = ctx.getOriginalArguments<[Message, string[]]>()
  if (!args.length) {
    sendDMMessage(message, bold(`You must specify which action to be executed.`))
    ctx.terminate()
  }
  return ctx
})

export const AdminCommand = createParamDecorator(
  (ctx) => ctx.getOriginalArguments<[Message, string[]]>()[1][0]
)

export const AdminCommandArgs = createParamDecorator((ctx) =>
  ctx.getOriginalArguments<[Message, string[]]>()[1].slice(1)
)
