import "reflect-metadata";
import { config } from "dotenv";
import { YuiCore } from "./yui-core";
config();
// Work In Progress...
(async () => {
  try {
    const yui = new YuiCore();
    await yui.start();
  } catch (err) {
    console.error("ERROR: " + err);
  }
})();
