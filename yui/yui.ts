import "reflect-metadata";
import { config } from "dotenv";
import YuiCore from "./yui-core";
config();
// Work In Progress...
(async () => {
  try {
    const yui = new YuiCore();
    await yui.start();
  } catch (error) {
    // console.error("ERROR: " + error);
    const now = new Date();
    console.error(
      `=========== ERROR ===========\n===== ${now.toString()} =====\n${error}`
    );
  }
})();
