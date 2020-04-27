import { TFunction } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'

export const VoiceStateInitiator = () => {
  return <T extends TFunction>(superClass: T) => {
    decoratorLogger(superClass['name'], 'Class', 'Initiator')
    return class extends superClass {}
  }
}