import { EVENT_HANDLER } from "@/ioc-container/constants/di-connstants"
import { Type } from "@/ioc-container/interfaces/di-interfaces"
import { ClientEvents } from "discord.js"

export function OnEvent(event: keyof ClientEvents) {
  return (target: Type<any>) => {
    Reflect.defineMetadata(EVENT_HANDLER, event, target)
  }
}