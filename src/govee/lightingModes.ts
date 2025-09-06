import CONFIG from "../config/config.js";
import { Flags } from "../multiviewer/types.js";
import { FLAGS_TO_ACTION, STATE } from "../multiviewer/utils.js";
import { sleep } from "../utils.js";
import { setDIYScene, setSnapshot, toggleDreamview } from "./utils.js";

export const greenFlag = async () => {
  await setDIYScene(CONFIG.SCENES.GREEN_FLAG);

  await sleep(11500); // extra 1.5s to account for potential delays in the light updating

  await resetToDefaultLighting();
};

export const yellowFlag = async () => {
  await setDIYScene(CONFIG.SCENES.YELLOW_FLAG);
};

export const doubleYellowFlag = async () => {
  await setDIYScene(CONFIG.SCENES.DOUBLE_YELLOW_FLAG);
};

export const redFlag = async () => {
  await setDIYScene(CONFIG.SCENES.RED_FLAG);
};

export const chequeredFlag = async () => {
  await setDIYScene(CONFIG.SCENES.CHEQUERED_FLAG);

  await sleep(123000); // extra 3s

  if (STATE.LATEST_FLAG && STATE.LATEST_FLAG == Flags.CHEQUERED)
    await resetToDefaultLighting();
};

export const safetyCarDeployed = async () => {
  await setDIYScene(CONFIG.SCENES.SAFETY_CAR_DEPLOYED);

  await sleep(11500); // extra 1.5s

  await setDIYScene(CONFIG.SCENES.SAFETY_CAR_ONGOING);
};

export const safetyCarEnding = async () => {
  await setDIYScene(CONFIG.SCENES.SAFETY_CAR_IN_THIS_LAP);
};

export const fastestLap = async () => {
  await setDIYScene(CONFIG.SCENES.FASTEST_LAP);

  await sleep(6500); // extra 1.5s

  if (STATE.LATEST_FLAG)
    await FLAGS_TO_ACTION[STATE.LATEST_FLAG]().catch(() => {});
  else await resetToDefaultLighting();
};

export const drsEnabled = async () => {
  await setDIYScene(CONFIG.SCENES.DRS_ENABLED);

  await sleep(6500); // extra 1.5s

  if (STATE.LATEST_FLAG)
    await FLAGS_TO_ACTION[STATE.LATEST_FLAG]().catch(() => {});
  else await resetToDefaultLighting();
};

export const drsDisabled = async () => {
  await setDIYScene(CONFIG.SCENES.DRS_DISABLED);

  await sleep(6500); // extra 1.5s

  if (STATE.LATEST_FLAG)
    await FLAGS_TO_ACTION[STATE.LATEST_FLAG]().catch(() => {});
  else await resetToDefaultLighting();
};

export const resetToDefaultLighting = async () => {
  STATE.LATEST_FLAG = undefined; // remove flag
  if (CONFIG.USE_DREAMVIEW) await toggleDreamview(true);
  else await setSnapshot(CONFIG.SNAPSHOTS.DEFAULT);
};
