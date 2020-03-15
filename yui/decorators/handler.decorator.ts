import { MusicService } from '@/handlers/services/music/music.service'
import { FeatureService } from '@/handlers/services/feature/feature.service'
import { AdministrationService } from '@/handlers/services/administration/administration.service'
import { TFunction } from '@/constants/constants'
// import { AccessControlerHandler } from '@/handlers/access-control.handler'

export const MessageHandlerInitiator = () => {
  return <T extends TFunction>(superClass: T) => {
    return class extends superClass {
      _musicService = new MusicService()
      _featureService = new FeatureService()
      _administrationService = new AdministrationService()
      // _accessController = new AccessControlerHandler(this._musicService) // unused
    }
  }
}
