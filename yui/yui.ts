import "reflect-metadata";
import { config } from "dotenv";
import { YuiCore } from "./yui-core";
config();
// Work In Progress...
let i = 0;
(async () => {
  try {
    const yui = new YuiCore();
    await yui.start();
  } catch (err) {
    console.error(err + "");
  }
})();
