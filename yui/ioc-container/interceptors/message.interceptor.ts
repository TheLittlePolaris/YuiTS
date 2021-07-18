import { Message } from "discord.js";
import { Interceptor } from "../decorators";


@Interceptor('message')
export class MessageInterceptor {
  constructor() {}

  async intercept(message: Message, next: () => any) {
    // TODO: message logic here
    console.log("Before Intercept", `<======= "Before Intercept" [message.interceptor.ts - 11]`);
    next()
    console.log("After Intercept", `<======= "After Intercept" [message.interceptor.ts - 13]`);

  }

}