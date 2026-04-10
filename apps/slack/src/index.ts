import { App, LogLevel } from "@slack/bolt";
import { loadConfig } from "./config";
import { registerMessageListeners } from "./listeners/messages";
import { registerCommandListeners } from "./listeners/commands";
import { registerActionListeners } from "./listeners/actions";

const config = loadConfig();

const app = new App({
  token: config.SLACK_BOT_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET,
  appToken: config.SLACK_APP_TOKEN,
  socketMode: true,
  logLevel: LogLevel.INFO,
});

// Register all listeners
registerMessageListeners(app, config);
registerCommandListeners(app, config);
registerActionListeners(app, config);

(async () => {
  await app.start();
  console.log("[edify-slack] Bot is running in socket mode");
})();
