import { EVENT_HANDLER } from "@/ioc-container/constants/di-connstants"
import { Type } from "@/ioc-container/interfaces/di-interfaces"
import { ClientEvents } from "discord.js"

export function Handle(event: keyof ClientEvents) {
  return (target: Type<any>) => {
    // decoratorLogger(target.constructor.name, 'Class')
    Reflect.defineMetadata(EVENT_HANDLER, event, target)
  }
}