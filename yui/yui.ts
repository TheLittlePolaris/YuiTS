import "reflect-metadata";
import { YuiCore } from "./yui-core";

// Work In Progress...

(async () => {
  try {
    const yui = new YuiCore();
    await yui.start();
  } catch (err) {
    console.error(err + "");
  }
})();
