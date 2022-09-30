import { catchError, finalize, Observable, throwError } from 'rxjs'
import { IInterceptor, Interceptor, ExecutionContext } from 'djs-ioc-container'
import { YuiLogger } from '@/logger/logger.service'
import { ChannelType, Message } from 'discord.js'

@Interceptor('messageCreate')
export class MessageCreateInterceptor implements IInterceptor<Observable<any>> {
  intercept(context: ExecutionContext, next: () => Observable<any>) {
    const [message] = context.getOriginalArguments<[Message]>()

    if (!(message.channel.type === ChannelType.GuildText)) return
    const label = `handle_message_${message.id}_[${message.content}]`
    console.time(label)
    return next().pipe(
      catchError((error) => {
        YuiLogger.error(error, MessageCreateInterceptor.name)
        message.channel.send('Something went wrong (╥_╥)')
        return throwError(() => error)
      }),
      finalize(() => {
        console.timeEnd(label)
      })
    )
  }
}
