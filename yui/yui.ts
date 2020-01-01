import "reflect-metadata";
import { config } from "dotenv";
import YuiCore from "./yui-core";
import { errorLogger } from "./handlers/error.handler";
config();
// Work In Progress...
(async () => {
  try {
    console.log("Yui is starting...");
    const yui = new YuiCore();
    await yui.start();
  } catch (error) {
    errorLogger(error, "YUI_START");
  }
})();
