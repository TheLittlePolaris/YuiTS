import { ClientEvents } from 'discord.js'
import { Interceptor } from '@/ioc-container/decorators/interceptor.decorator'
import { IRxjsInterceptor } from '@/ioc-container/interfaces/interceptor.interface'
import { catchError, finalize, Observable, of, switchMap, tap, throwError } from 'rxjs'
import { YuiLogger } from '@/services/logger'

// @Interceptor('messageCreate')
// export class MessageCreateEventInterceptor implements IBaseInterceptor {
//   intercept([message]: ClientEvents['messageCreate'], next: () => Promise<any>) {
//     if (!(message.channel.type === 'GUILD_TEXT')) return

//     const label = `handle_message_${message.id}_[${message.content}]` //
//     console.time(label)
//     return next()
//       .then(() => console.timeEnd(label))
//       .catch((error) => {
//         YuiLogger.error(error, MessageCreateEventInterceptor.name)
//         message.channel.send('Something went wrong (╥_╥)')
//       })
//   }
// }

@Interceptor('messageCreate')
export class MessageCreateEventInterceptor implements IRxjsInterceptor {
  intercept([message]: ClientEvents['messageCreate'], next: () => Observable<any>) {
    if (!(message.channel.type === 'GUILD_TEXT')) return
    const label = `handle_message_${message.id}_[${message.content}]` //
    console.time(label)
    return next().pipe(
      catchError((error) => {
        YuiLogger.error(error, MessageCreateEventInterceptor.name)
        message.channel.send('Something went wrong (╥_╥)')
        return throwError(() => error)
      }),
      finalize(() => {
        console.timeEnd(label)
      })
    )
  }
}
