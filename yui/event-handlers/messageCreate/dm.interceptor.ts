import { ConfigService } from '@/config-service/config.service'
import { ExecutionContext, IInterceptor, Interceptor } from '@/ioc-container'
import { YuiLogger } from '@/services/logger/logger.service'
import { ClientEvents } from 'discord.js'
import { catchError, finalize, Observable, throwError } from 'rxjs'

@Interceptor('messageCreate')
export class DMInterceptor implements IInterceptor<Observable<any>> {
  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: () => Observable<any>) {
    const [message] = context.getOriginalArguments<ClientEvents['messageCreate']>()

    if (!(message.channel.type === 'DM' && message.author.id === this.configService.ownerId)) return

    const label = `handle_dm_${message.id}_[${message.content}]`
    console.time(label)
    return next().pipe(
      catchError((error) => {
        YuiLogger.error(error, DMInterceptor.name)
        message.channel.send('Something went wrong (╥_╥)')
        return throwError(() => error)
      }),
      finalize(() => {
        console.timeEnd(label)
      })
    )
  }
}
