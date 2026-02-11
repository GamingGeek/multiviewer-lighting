import CONFIG from "../config/config.js";
import { FireConsole } from "../console.js";
import { Flags } from "../multiviewer/types.js";
import { FLAGS_TO_ACTION, FLAGS_TO_NAME, STATE } from "../multiviewer/utils.js";
import { sleep } from "../utils.js";
import {
  setColorRGB,
  setDIYScene,
  setSnapshot,
  toggleDreamview,
} from "./utils.js";

const CONSOLE = new FireConsole("Govee|LightingModes");

export const greenFlag = async () => {
  CONSOLE.info("Starting green flag lighting...");
  await setDIYScene(CONFIG.SCENES.GREEN_FLAG);

  await sleep(10000);

  CONSOLE.info("Resetting to default lighting after green flag");
  await resetToDefaultLighting();
};

export const yellowFlag = async () => {
  CONSOLE.warn("Setting yellow flag lighting");
  await setDIYScene(CONFIG.SCENES.YELLOW_FLAG);
};

export const doubleYellowFlag = async () => {
  CONSOLE.warn("Setting double yellow flag lighting");
  await setDIYScene(CONFIG.SCENES.DOUBLE_YELLOW_FLAG);
};

export const redFlag = async () => {
  CONSOLE.error("Setting red flag lighting");
  await setDIYScene(CONFIG.SCENES.RED_FLAG);
};

export const chequeredFlag = async () => {
  await setDIYScene(CONFIG.SCENES.CHEQUERED_FLAG);
};

export const safetyCarDeployed = async () => {
  CONSOLE.warn("Starting safety car deployed lighting...");
  await setDIYScene(CONFIG.SCENES.SAFETY_CAR_DEPLOYED);

  await sleep(10000);

  CONSOLE.warn("Setting safety car ongoing lighting");
  await setDIYScene(CONFIG.SCENES.SAFETY_CAR_ONGOING);
};

export const safetyCarEnding = async () => {
  CONSOLE.warn("Setting safety car ending lighting");
  await setDIYScene(CONFIG.SCENES.SAFETY_CAR_IN_THIS_LAP);
};

export const fastestLap = async (time: number) => {
  CONSOLE.info("Starting fastest lap lighting...");
  await setDIYScene(CONFIG.SCENES.FASTEST_LAP);

  await sleep(5000);

  // check if a new fastest lap has been set before resetting
  if (STATE.CURRENT_FASTEST_LAP !== time) return;

  CONSOLE.info(
    STATE.SAFETY_CAR || STATE.LATEST_FLAG
      ? `Resetting to ${
          STATE.SAFETY_CAR ? "Safety Car" : FLAGS_TO_NAME[STATE.LATEST_FLAG]
        } after fastest lap (${time}s)`
      : `Resetting to default lighting after fastest lap (${time}s)`,
  );
  if (STATE.SAFETY_CAR) await safetyCarDeployed().catch(() => {});
  else if (STATE.LATEST_FLAG)
    await FLAGS_TO_ACTION[STATE.LATEST_FLAG]().catch(() => {});
  else await resetToDefaultLighting();
};

export const newRaceLeader = async (teamColor: number) => {
  CONSOLE.info("Switching to team color for new race leader");
  await setColorRGB(teamColor);

  await sleep(5000);

  CONSOLE.info(
    STATE.SAFETY_CAR || STATE.LATEST_FLAG
      ? `Resetting to ${
          STATE.SAFETY_CAR ? "Safety Car" : FLAGS_TO_NAME[STATE.LATEST_FLAG]
        } after new race leader`
      : "Resetting to default lighting after new race leader",
  );
  if (STATE.SAFETY_CAR) await safetyCarDeployed().catch(() => {});
  else if (STATE.LATEST_FLAG)
    await FLAGS_TO_ACTION[STATE.LATEST_FLAG]().catch(() => {});
  else await resetToDefaultLighting();
};

export const overtakeEnabled = async () => {
  CONSOLE.info("Starting Overtake Enabled lighting...");
  await setDIYScene(CONFIG.SCENES.OVERTAKE_ENABLED);

  await sleep(5000);

  CONSOLE.info(
    STATE.SAFETY_CAR || STATE.LATEST_FLAG
      ? `Resetting to ${
          STATE.SAFETY_CAR ? "Safety Car" : FLAGS_TO_NAME[STATE.LATEST_FLAG]
        } after Overtake Enabled`
      : "Resetting to default lighting after Overtake Enabled",
  );
  if (STATE.SAFETY_CAR) await safetyCarDeployed().catch(() => {});
  else if (STATE.LATEST_FLAG)
    await FLAGS_TO_ACTION[STATE.LATEST_FLAG]().catch(() => {});
  else await resetToDefaultLighting();
};

export const overtakeDisabled = async () => {
  CONSOLE.error("Starting Overtake Disabled lighting...");
  await setDIYScene(CONFIG.SCENES.OVERTAKE_DISABLED);

  await sleep(5000);

  CONSOLE.info(
    STATE.SAFETY_CAR || STATE.LATEST_FLAG
      ? `Resetting to ${
          STATE.SAFETY_CAR ? "Safety Car" : FLAGS_TO_NAME[STATE.LATEST_FLAG]
        } after Overtake Disabled`
      : "Resetting to default lighting after Overtake Disabled",
  );
  if (STATE.SAFETY_CAR) await safetyCarDeployed().catch(() => {});
  else if (STATE.LATEST_FLAG)
    await FLAGS_TO_ACTION[STATE.LATEST_FLAG]().catch(() => {});
  else await resetToDefaultLighting();
};

export const delay = async () => {
  CONSOLE.error("Starting delay lighting...");
  await setDIYScene(CONFIG.SCENES.DELAY);

  await sleep(10000);

  CONSOLE.info(
    STATE.SAFETY_CAR || STATE.LATEST_FLAG
      ? `Resetting to ${
          STATE.SAFETY_CAR ? "Safety Car" : FLAGS_TO_NAME[STATE.LATEST_FLAG]
        } after delay`
      : "Resetting to default lighting after delay",
  );
  if (STATE.SAFETY_CAR) await safetyCarDeployed().catch(() => {});
  else if (STATE.LATEST_FLAG)
    await FLAGS_TO_ACTION[STATE.LATEST_FLAG]().catch(() => {});
  else await resetToDefaultLighting();
};

export const resetToDefaultLighting = async () => {
  STATE.LATEST_FLAG = Flags.CLEAR; // remove flag
  if (CONFIG.USE_DREAMVIEW) await toggleDreamview(true);
  else await setSnapshot(CONFIG.SNAPSHOTS.DEFAULT);
};
