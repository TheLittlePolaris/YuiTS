import { ChannelType, ClientEvents } from 'discord.js';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { ExecutionContext, IInterceptor, Interceptor } from 'djs-ioc-container';

import { ConfigService } from '@/config-service/config.service';
import { YuiLogger } from '@/logger/logger.service';

@Interceptor('messageCreate')
export class DMInterceptor implements IInterceptor<Observable<any>> {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: () => Observable<any>) {
    const [message] = context.getOriginalArguments<ClientEvents['messageCreate']>();

    if (
      !(message.channel.type === ChannelType.DM && message.author.id === this.configService.ownerId)
    )
      return;

    const label = `handle_dm_${message.id}_[${message.content}]`;
    console.time(label);
    return next().pipe(
      catchError((error) => {
        YuiLogger.error(error, DMInterceptor.name);
        message.channel.send('Something went wrong (╥_╥)');
        return throwError(() => error);
      }),
      finalize(() => {
        console.timeEnd(label);
      })
    );
  }
}
