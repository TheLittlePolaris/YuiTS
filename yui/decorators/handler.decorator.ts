import { MusicService } from '@/handlers/services/music/music.service'
import { FeatureService } from '@/handlers/services/feature/feature.service'
import { AdministrationService } from '@/handlers/services/administration/administration.service'
import { TFunction } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'

export function MessageHandlerInitiator() {
  return <T extends TFunction>(superClass: T) => {
    decoratorLogger(superClass['name'], 'Class', 'Initiator')
    return class extends superClass {
      _musicService = new MusicService()
      _featureService = new FeatureService()
      _administrationService = new AdministrationService()
    }
  }
}
