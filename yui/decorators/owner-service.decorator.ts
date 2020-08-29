/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { TFunction } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'

export const OwnerServiceInitiator = () => {
  return function <T extends TFunction>(superClass: T) {
    decoratorLogger(superClass['name'], 'Class', 'Initiator')
    return class extends superClass {}
  }
}
