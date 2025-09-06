import Centra from "centra";
import { FireConsole } from "../console.js";
import {
  chequeredFlag,
  doubleYellowFlag,
  drsDisabled,
  drsEnabled,
  fastestLap,
  greenFlag,
  redFlag,
  resetToDefaultLighting,
  safetyCarDeployed,
  safetyCarEnding,
  yellowFlag,
} from "../govee/lightingModes.js";
import { sleep } from "../utils.js";
import ENV from "./env.js";
import {
  Flags,
  MultiviewerAllDataGraphQL,
  MultiviewerHeartbeat,
  RaceControlMessages,
  SessionData,
  SessionInfo,
  TimingData,
} from "./types.js";

const CONSOLE = new FireConsole("Multiviewer");

export const STATE = {
  CURRENT_QUALI_STATE: undefined as number | undefined,
  CURRENT_FASTEST_LAP: undefined as number | undefined,
  SAFETY_CAR: false,
  LATEST_RACE_CONTROL_MESSAGE: undefined as number | undefined,
  LATEST_FLAG: undefined as Flags | undefined,
};

export const FLAGS_TO_ACTION = {
  [Flags.CLEAR]: resetToDefaultLighting,
  [Flags.GREEN]: greenFlag,
  [Flags.YELLOW]: yellowFlag,
  [Flags.DOUBLE_YELLOW]: doubleYellowFlag,
  [Flags.RED]: redFlag,
  [Flags.CHEQUERED]: chequeredFlag,
};

export const requestAllData = async () => {
  const request = await Centra(ENV.BASE_URL, "POST")
    .path(ENV.GRAPHQL_ENDPOINT)
    .body({
      query: `query QueryAllLiveTimingData {
        f1LiveTimingState {
          RaceControlMessages,
          SessionData
          SessionInfo
          TimingData
        }
      }`,
    })
    .send();

  if (request.statusCode !== 200) return null;

  try {
    const response = (await request.json()) as MultiviewerAllDataGraphQL;
    return response.data ?? null;
  } catch {
    return null;
  }
};

export const isLiveTimingOnline = async () => {
  const request = await Centra(ENV.BASE_URL)
    .path(ENV.HEARTBEAT_ENDPOINT)
    .send();
  if (request.statusCode !== 200) return false;
  const response = (await request
    .json()
    .catch(() => null)) as MultiviewerHeartbeat | null;
  if (!response || !response.Utc) return false;
  return new Date(response.Utc);
};

const checkQualiState = ({
  SessionInfo,
  SessionData,
}: {
  SessionInfo: SessionInfo;
  SessionData: SessionData;
}) => {
  if (SessionInfo.Type !== "Qualifying") return;

  const qualifyingPart = SessionData.Series
    ? SessionData.Series[SessionData.Series.length - 1]?.QualifyingPart
    : null;

  if (qualifyingPart === null) return;

  if (STATE.CURRENT_QUALI_STATE !== qualifyingPart) {
    if (typeof STATE.CURRENT_QUALI_STATE !== "undefined")
      STATE.CURRENT_FASTEST_LAP = 3600; // reset fastest lap on session change
    STATE.CURRENT_QUALI_STATE = qualifyingPart;
  }
};

const parseLapTime = (lapTime: string) => {
  const [minutes, seconds, milliseconds] = lapTime
    .split(/[:.]/)
    .map((number) => parseInt(number.replace(/^0+/, "") || "0", 10));

  if (milliseconds === undefined) {
    return minutes + seconds / 1000;
  }

  return minutes * 60 + seconds + milliseconds / 1000;
};

const checkForNewFastestLap = async (data: TimingData["Lines"]) => {
  const fastestLapTimeSeconds = Object.values(data ?? {})
    .map((line) => {
      if (line.KnockedOut === true) return "";
      if (line.Retired === true) return "";
      if (line.Stopped === true) return "";
      return line.BestLapTime?.Value;
    })
    .filter((lapTime) => lapTime !== "")
    .map((lapTime) => ({ lapTime, parsed: parseLapTime(lapTime) }))
    .sort((a, b) => a.parsed - b.parsed)[0]?.parsed;

  if (fastestLapTimeSeconds === undefined) return;

  if (
    typeof STATE.CURRENT_FASTEST_LAP === "number" &&
    fastestLapTimeSeconds >= STATE.CURRENT_FASTEST_LAP
  )
    return;

  if (typeof STATE.CURRENT_FASTEST_LAP === "number") {
    STATE.CURRENT_FASTEST_LAP = fastestLapTimeSeconds;
    CONSOLE.info(`New fastest lap: ${STATE.CURRENT_FASTEST_LAP} seconds`);
    await fastestLap().catch(() => {});
  } else STATE.CURRENT_FASTEST_LAP = fastestLapTimeSeconds;
};

const checkRaceControlMessages = async (
  messages: RaceControlMessages["Messages"]
) => {
  const prevLatestMessageIndex = messages.findIndex(
    (msg) =>
      +new Date(msg.Utc) > (STATE.LATEST_RACE_CONTROL_MESSAGE ?? +new Date())
  );
  messages =
    prevLatestMessageIndex === -1 && !STATE.LATEST_RACE_CONTROL_MESSAGE
      ? messages.slice(-1) // Start off with just the latest message
      : prevLatestMessageIndex === -1
      ? []
      : messages.slice(prevLatestMessageIndex);

  if (!messages.length) return;

  const latestMessageUTC = messages.at(-1)?.Utc;
  if (latestMessageUTC)
    STATE.LATEST_RACE_CONTROL_MESSAGE = +new Date(latestMessageUTC);

  for (const message of messages) {
    CONSOLE.debug("message iter");
    if (message.Category === "Flag") {
      switch (message.Flag) {
        case "CLEAR": {
          // Ignore flag during safety car && red flag
          if (STATE.SAFETY_CAR || STATE.LATEST_FLAG == Flags.RED) break;
          // Track is clear, reset to default state
          CONSOLE.info("Track is clear!");
          STATE.LATEST_FLAG = Flags.CLEAR;
          await resetToDefaultLighting().catch(() => {});
          break;
        }
        case "GREEN": {
          // Ignore flag during safety car
          if (STATE.SAFETY_CAR) break;
          // green flag, display green flag lighting then reset to default state
          CONSOLE.info("Green Flag");
          STATE.LATEST_FLAG = Flags.GREEN;
          await greenFlag().catch(() => {});
          break;
        }
        case "YELLOW": {
          // Ignore flag during safety car
          if (STATE.SAFETY_CAR) break;
          CONSOLE.warn("Yellow Flag");
          STATE.LATEST_FLAG = Flags.YELLOW;
          // yellow flag, display yellow flag lighting
          await yellowFlag().catch(() => {});
          break;
        }
        case "DOUBLE YELLOW": {
          // Ignore flag during safety car
          if (STATE.SAFETY_CAR) break;
          CONSOLE.warn("Double Yellow");
          STATE.LATEST_FLAG = Flags.DOUBLE_YELLOW;
          // double yellow flag, display double yellow flag lighting
          await doubleYellowFlag().catch(() => {});
          break;
        }
        case "RED": {
          CONSOLE.error("Red flag, session stopped!");
          STATE.LATEST_FLAG = Flags.RED;
          // red flag, display red flag lighting
          await redFlag().catch(() => {});
          break;
        }
        case "CHEQUERED": {
          CONSOLE.info("Chequered flag!");
          STATE.LATEST_FLAG = Flags.CHEQUERED;
          // chequered flag, display chequered flag lighting then reset to default state
          await chequeredFlag().catch(() => {});
          break;
        }
        default: {
          // unknown, do nothing
          break;
        }
      }
    } else if (message.Category === "Drs") {
      switch (message.Status) {
        case "DISABLED": {
          CONSOLE.error("DRS Disabled");
          // DRS disabled, display DRS disabled lighting then reset to default state
          await drsDisabled().catch(() => {});
          break;
        }
        case "ENABLED": {
          CONSOLE.info("DRS Enabled");
          // DRS enabled, display DRS enabled lighting then reset to default state
          await drsEnabled().catch(() => {});
          break;
        }
        default: {
          // unknown, do nothing
          break;
        }
      }
    } else if (message.Category === "SafetyCar") {
      const virtual = message.Mode === "VIRTUAL SAFETY CAR";
      switch (message.Status) {
        case "DEPLOYED": {
          CONSOLE.warn(
            virtual ? "Virtual Safety Car Deployed!" : "Safety Car Deployed!"
          );
          // safety car deployed, display safety car lighting
          STATE.SAFETY_CAR = true;
          await safetyCarDeployed().catch(() => {});
          break;
        }
        case "IN THIS LAP":
        case "ENDING": {
          CONSOLE.warn(
            virtual ? "Virtual Safety Car Ending!" : "Safety Car in this lap!"
          );
          STATE.SAFETY_CAR = false;
          // safety car ending/in this lap, display safety car ending lighting then reset to default state
          await safetyCarEnding().catch(() => {});
          break;
        }
      }
    }
  }
};

export const startSession = async (): Promise<void> => {
  CONSOLE.debug("Starting session, checking if live timing is open...");
  // first we'll try and get the clock to see if live timing is open
  const clock = await isLiveTimingOnline();
  if (!clock) {
    CONSOLE.debug("Live timing is not open! Waiting 2.5s then trying again...");
    await sleep(2500);
    return startSession(); // restart session
  }

  CONSOLE.debug("Starting data fetch interval");
  // Adapted from https://github.com/JustJoostNL/F1MV-Lights-Integration
  while (true) {
    const liveTiming = await requestAllData();
    if (!liveTiming) return; // do nothing if we can't get data

    const {
      f1LiveTimingState: {
        RaceControlMessages,
        SessionData,
        SessionInfo,
        TimingData,
      },
    } = liveTiming;

    if (SessionInfo && SessionData)
      checkQualiState({ SessionInfo, SessionData });
    if (TimingData?.Lines) checkForNewFastestLap(TimingData.Lines);
    if (RaceControlMessages?.Messages)
      checkRaceControlMessages(RaceControlMessages.Messages);
    await sleep(500);
  }
};
