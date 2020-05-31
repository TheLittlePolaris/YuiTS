import { TFunction } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'

export function OwnerServiceInitiator() {
  return function <T extends TFunction>(superClass: T) {
    decoratorLogger(superClass['name'], 'Class', 'Initiator')
    return class extends superClass {}
  }
}
