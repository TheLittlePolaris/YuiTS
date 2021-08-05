import { Entrypoint } from '../ioc-container/decorators/entrypoint.decorator'
import { YuiClient } from '../custom-classes/yui-client'
import { YuiLogger } from '../services/logger/logger.service'
import { EntrypointComponent } from '@/ioc-container/entrypoint/entrypoint.component'

@Entrypoint()
export class YuiCore extends EntrypointComponent {
  constructor(private yui: YuiClient) {
    super(yui)
    YuiLogger.info('Created!', YuiCore.name)
  }
}
