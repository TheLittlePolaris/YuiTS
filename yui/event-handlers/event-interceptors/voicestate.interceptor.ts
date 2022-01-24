import { ClientEvents } from "discord.js";
import { IBaseInterceptor } from "@/ioc-container/interfaces/interceptor.interface";

export class VoiceStateInterceptor implements IBaseInterceptor {

  intercept([oldState, newState]: ClientEvents['voiceStateUpdate'], next: () => Promise<any> ) {

    next()
  }
}