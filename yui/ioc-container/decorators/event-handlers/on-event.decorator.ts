import { EVENT_HANDLER } from "@/ioc-container/constants/dependencies-injection.constant"
import { Type } from "@/ioc-container/interfaces/dependencies-injection.interfaces"
import { ClientEvents } from "discord.js"

export function OnEvent(event: keyof ClientEvents) {
  return (target: Type<any>) => {
    Reflect.defineMetadata(EVENT_HANDLER, event, target)
  }
}