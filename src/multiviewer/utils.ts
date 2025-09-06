import { sleep } from "@/utils.js";
import Centra from "centra";
import ENV from "./env.js";
import {
  MultiviewerAllDataGraphQL,
  MultiviewerHeartbeat,
  RaceControlMessages,
  SessionData,
  SessionInfo,
  SessionStatus,
  TimingData,
  TrackStatus,
} from "./types.js";

const STATE = {
  CURRENT_QUALI_STATE: undefined as number | undefined,
  CURRENT_FASTEST_LAP: undefined as number | undefined,
  TRACK_STATUS: undefined as TrackStatus["Status"] | undefined,
  SESSION_STATUS: undefined as SessionStatus["Status"] | undefined,
  LATEST_RACE_CONTROL_MESSAGE: undefined as number | undefined,
};

export const requestAllData = async () => {
  const request = await Centra(ENV.BASE_URL, "POST")
    .path(ENV.GRAPHQL_ENDPOINT)
    .body({
      query: `query QueryAllLiveTimingData {
        f1LiveTimingState {
          RaceControlMessages
          SessionData
          SessionInfo
          SessionStatus
          TimingData
          TimingStats
          TrackStatus
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
  ) {
    return;
  }

  if (typeof STATE.CURRENT_FASTEST_LAP === "number") {
    STATE.CURRENT_FASTEST_LAP = fastestLapTimeSeconds;
    // TODO: trigger lighting effect here
  } else {
    STATE.CURRENT_FASTEST_LAP = fastestLapTimeSeconds;
  }
};

const checkTrackStatus = async (
  trackStatus: TrackStatus["Status"],
  sessionStatus: SessionStatus["Status"]
) => {
  if (
    STATE.TRACK_STATUS !== trackStatus &&
    sessionStatus !== "Ends" &&
    sessionStatus !== "Finalised"
  ) {
    STATE.TRACK_STATUS = trackStatus;
    switch (trackStatus) {
      case "1": {
        // green flag
      }
      case "2": {
        // yellow flag
      }
      case "4": {
        // safety car
      }
      case "5": {
        // red flag
      }
      case "6": {
        // virtual safety car
      }
      case "7": {
        // virtual safety car ending
      }
      default: {
      }
    }
  }
};

const checkRaceControlMessages = async (
  messages: RaceControlMessages["Messages"]
) => {
  const prevLatestMessageIndex = messages.findIndex(
    (msg) =>
      +new Date(msg.Utc) <= (STATE.LATEST_RACE_CONTROL_MESSAGE ?? +new Date())
  );
  messages =
    prevLatestMessageIndex === -1
      ? messages
      : messages.slice(prevLatestMessageIndex);

  if (!messages.length) return;

  const latestMessageUTC = messages.at(-1)?.Utc;
  if (latestMessageUTC)
    STATE.LATEST_RACE_CONTROL_MESSAGE = +new Date(latestMessageUTC);

  for (const message of messages) {
    if (message.Category === "Flag") {
      switch (message.Flag) {
        case "CLEAR": {
          // Track is clear, reset to default state
          break;
        }
        case "GREEN": {
          // green flag, display green flag lighting then reset to default state
          break;
        }
        case "YELLOW": {
          // yellow flag, display yellow flag lighting
          break;
        }
        case "DOUBLE YELLOW": {
          // double yellow flag, display double yellow flag lighting
          break;
        }
        case "RED": {
          // red flag, display red flag lighting
          break;
        }
        case "CHEQUERED": {
          // chequered flag, display chequered flag lighting then reset to default state
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
          // DRS disabled, display DRS disabled lighting then reset to default state
          break;
        }
        case "ENABLED": {
          // DRS enabled, display DRS enabled lighting then reset to default state
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
          // safety car deployed, display safety car lighting
          break;
        }
        case "IN THIS LAP":
        case "ENDING": {
          // safety car ending/in this lap, display safety car ending lighting then reset to default state
          break;
        }
      }
    }
  }
};

export const startSession = async (): Promise<void> => {
  // first we'll try and get the clock to see if live timing is open
  const clock = await isLiveTimingOnline();
  if (!clock) {
    await sleep(2500);
    return startSession(); // restart session
  }

  // Adapted from https://github.com/JustJoostNL/F1MV-Lights-Integration
  setInterval(async () => {
    const liveTiming = await requestAllData();
    if (!liveTiming) return; // do nothing if we can't get data

    const {
      f1LiveTimingState: {
        RaceControlMessages,
        SessionData,
        SessionInfo,
        SessionStatus,
        TimingData,
        TimingStats,
        TrackStatus,
      },
    } = liveTiming;

    checkQualiState({ SessionInfo, SessionData });
    checkForNewFastestLap(TimingData.Lines);
    checkTrackStatus(TrackStatus.Status, SessionStatus.Status);
  }, 500);
};
