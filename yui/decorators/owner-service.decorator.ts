/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { TFunction } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'
import { INJECTABLE_METADATA } from '@/constants/di-connstants'

export function OwnerServiceInitiator() {
  return function <T extends TFunction>(target: T) {
    decoratorLogger(target['name'], 'Class', 'Initiator')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}
