import Centra from "centra";
import { FireConsole } from "../console.js";
import {
  chequeredFlag,
  delay,
  doubleYellowFlag,
  drsDisabled,
  drsEnabled,
  fastestLap,
  greenFlag,
  newRaceLeader,
  redFlag,
  resetToDefaultLighting,
  safetyCarDeployed,
  safetyCarEnding,
  yellowFlag,
} from "../govee/lightingModes.js";
import { toggleDreamview } from "../govee/utils.js";
import { sleep } from "../utils.js";
import ENV from "./env.js";
import {
  Category,
  DriverList,
  Flags,
  MultiviewerAllDataGraphQL,
  MultiviewerHeartbeat,
  RaceControlMessages,
  SessionData,
  SessionInfo,
  SubCategory,
  TimingData,
} from "./types.js";

const CONSOLE = new FireConsole("Multiviewer|Utils");

export const STATE = {
  CURRENT_QUALI_STATE: undefined as number | undefined,
  CURRENT_FASTEST_LAP: undefined as number | undefined,
  SAFETY_CAR: false,
  LATEST_RACE_CONTROL_MESSAGE_TIME: undefined as number | undefined,
  LATEST_FLAG: Flags.CLEAR as Flags,
  FLAG_SECTORS: [] as number[],
  RACE_LEADER: undefined as `${number}` | undefined,
  RACE_STATE: undefined as SessionInfo["Type"] | undefined,
};

export const FLAGS_TO_ACTION = {
  [Flags.CLEAR]: resetToDefaultLighting,
  [Flags.GREEN]: greenFlag,
  [Flags.YELLOW]: yellowFlag,
  [Flags.DOUBLE_YELLOW]: doubleYellowFlag,
  [Flags.RED]: redFlag,
  [Flags.CHEQUERED]: chequeredFlag,
};

export const FLAGS_TO_NAME = {
  [Flags.CLEAR]: "CLEAR",
  [Flags.GREEN]: "GREEN",
  [Flags.YELLOW]: "YELLOW",
  [Flags.DOUBLE_YELLOW]: "DOUBLE_YELLOW",
  [Flags.RED]: "RED",
  [Flags.CHEQUERED]: "CHEQUERED",
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
          TimingData
          LapCount
          DriverList
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

const enhanceRaceControlMessage = (
  message: RaceControlMessages["Messages"][0],
  index: number
): RaceControlMessages["Messages"][0] & { SubCategory: SubCategory } => {
  message.Utc = `${message.Utc}.${index.toString().slice(-3).padStart(3, "0")}`;

  if (message.Message.match(/DRS/i)) {
    const enabled = message.Message.match(/ENABLED/i);
    const flag = enabled ? "ENABLED" : "DISABLED";

    return {
      ...message,
      SubCategory: SubCategory.Drs,
      Flag: flag,
    };
  }

  if (message.Message.match(/FIRST CAR TO TAKE THE FLAG/i)) {
    return {
      ...message,
      Category: Category.Flag,
      SubCategory: SubCategory.Flag,
      Flag: "CHEQUERED",
    };
  }

  if (message.Message.match(/BLACK AND ORANGE/i)) {
    return {
      ...message,
      Category: Category.Flag,
      SubCategory: SubCategory.Flag,
      Flag: "BLACK AND ORANGE",
    };
  }

  if (
    message.Message.match(/WILL START AT (\d{1,2}:\d{1,2})/i) ||
    message.Message.match(/WILL BE DELAYED/i) ||
    message.Message.match(/START OF THE SESSION IS DELAYED/i) ||
    message.Message.match(/START(ING)? PROCEDURE SUSPENDED/i) ||
    message.Message.match(/DELAYED START/i) ||
    message.Message.match(/\d+ MIN SIGNAL WILL BE SHOWN/i)
  ) {
    return {
      ...message,
      SubCategory: SubCategory.SessionStartDelayed,
    };
  }

  if (message.Message.match(/REMAINING SESSION DURATION WILL BE/i)) {
    return {
      ...message,
      SubCategory: SubCategory.SessionDurationChanged,
    };
  }

  if (message.Message.match(/(LAP| TIME .*) DELETED/i)) {
    return {
      ...message,
      SubCategory: SubCategory.LapTimeDeleted,
    };
  }

  if (message.Message.match(/LAPPED CARS MAY (NOW) OVERTAKE/i)) {
    return {
      ...message,
      SubCategory: SubCategory.LappedCarsMayOvertake,
    };
  }

  if (message.Message.match(/LAPPED CARS WILL NOT BE ALLOWED TO OVERTAKE/i)) {
    return {
      ...message,
      SubCategory: SubCategory.LappedCarsMayNotOvertake,
    };
  }

  if (message.Message.match(/NORMAL GRIP CONDITIONS/i)) {
    return {
      ...message,
      SubCategory: SubCategory.NormalGripConditions,
    };
  }

  if (message.Message.match(/(OFF TRACK AND CONTINUED)/i)) {
    return {
      ...message,
      SubCategory: SubCategory.OffTrackAndContinued,
    };
  }

  if (message.Message.match(/(SPUN AND CONTINUED)/i)) {
    return {
      ...message,
      SubCategory: SubCategory.SpunAndContinued,
    };
  }

  if (message.Message.match(/MISSED THE APEX OF TURN/i)) {
    return {
      ...message,
      SubCategory: SubCategory.MissedApex,
    };
  }

  if (message.Message.match(/CAR (.*) STOPPED (AT|ON|NEAR)/i)) {
    return {
      ...message,
      SubCategory: SubCategory.CarStopped,
    };
  }

  if (message.Message.match(/SAFETY CAR/i)) {
    return { ...message, SubCategory: SubCategory.SafetyCar };
  }

  if (message.Message.match(/VIRTUAL SAFETY CAR/i)) {
    return {
      ...message,
      SubCategory: SubCategory.VirtualSafetyCar,
    };
  }

  if (message.Message.match(/INCIDENT (.*) NOTED/i)) {
    return {
      ...message,
      SubCategory: SubCategory.IncidentNoted,
    };
  }

  if (message.Message.match(/INCIDENT (.*) UNDER INVESTIGATION/i)) {
    return {
      ...message,
      SubCategory: SubCategory.IncidentUnderInvestigation,
    };
  }

  if (message.Message.match(/INCIDENT (.*) WILL BE INVESTIGATED/i)) {
    return {
      ...message,
      SubCategory: SubCategory.IncidentInvestigationAfterSession,
    };
  }

  if (message.Message.match(/INCIDENT (.*) NO FURTHER ACTION/i)) {
    return {
      ...message,
      SubCategory: SubCategory.IncidentNoFurtherAction,
    };
  }

  if (message.Message.match(/INCIDENT (.*) NO (FURTHER )?INVESTIGATION/i)) {
    return {
      ...message,
      SubCategory: SubCategory.IncidentNoFurtherInvestigation,
    };
  }

  if (message.Message.match(/TIME PENALTY/i)) {
    return {
      ...message,
      SubCategory: SubCategory.TimePenalty,
    };
  }

  if (message.Message.match(/STOP\/GO PENALTY FOR CAR/i)) {
    return {
      ...message,
      SubCategory: SubCategory.StopGoPenalty,
    };
  }

  if (message.Message.match(/TRACK TEST COMPLETED/i)) {
    return {
      ...message,
      SubCategory: SubCategory.TrackTestCompleted,
    };
  }

  if (message.Message.match(/TRACK SURFACE SLIPPERY/i)) {
    return {
      ...message,
      SubCategory: SubCategory.TrackSurfaceSlippery,
    };
  }

  if (message.Message.match(/LOW GRIP CONDITIONS/i)) {
    return {
      ...message,
      SubCategory: SubCategory.LowGripConditions,
    };
  }

  if (message.Message.match(/WET TRACK/i)) {
    return { ...message, SubCategory: SubCategory.Weather };
  }

  if (message.Message.match(/RISK OF RAIN/i)) {
    return { ...message, SubCategory: SubCategory.Weather };
  }

  if (message.Message.match(/PIT EXIT (OPEN|CLOSED)/i)) {
    return {
      ...message,
      SubCategory: SubCategory.PitExit,
    };
  }

  if (message.Message.match(/PIT ENTRY (OPEN|CLOSED)/i)) {
    return {
      ...message,
      SubCategory: SubCategory.PitEntry,
    };
  }

  if (message.Message.match(/(SESSION|RACE) WILL( NOT| NOT BE)? RESUME/i)) {
    return {
      ...message,
      SubCategory: SubCategory.SessionResume,
    };
  }

  if (message.Message.match(/CORRECTION/i)) {
    return {
      ...message,
      SubCategory: SubCategory.Correction,
    };
  }

  return {
    ...message,
    SubCategory: SubCategory.Other,
  };
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
      if (line.KnockedOut || line.Retired || line.Stopped) return "";
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
    await fastestLap(fastestLapTimeSeconds).catch(() => {});
  } else STATE.CURRENT_FASTEST_LAP = fastestLapTimeSeconds;
};

const checkForNewRaceLeader = async (
  data: TimingData["Lines"],
  drivers: DriverList
) => {
  const leader = Object.values(data).find((line) => line.Position == "1");
  if (!leader) return; // unsure if/when this could happen but nothing we can do here

  if (!STATE.RACE_LEADER) {
    // set state and return
    STATE.RACE_LEADER = leader.RacingNumber;
    return;
  } else if (leader.RacingNumber !== STATE.RACE_LEADER) {
    // we have a new leader
    STATE.RACE_LEADER = leader.RacingNumber;
    const leadingDriver = drivers[leader.RacingNumber],
      leadingColorHex = leadingDriver.TeamColour,
      leadingColor = parseInt(leadingColorHex, 16);

    CONSOLE.info(
      `New Race Leader! ${leadingDriver.FullName} - ${leadingDriver.TeamName}`
    );
    await newRaceLeader(leadingColor);
  }
};

const checkAllFinished = async (data: TimingData["Lines"], lastLap: number) => {
  const allOnLast = Object.values(data)
    .filter((line) => !line.Retired && !line.Stopped && !line.InPit)
    .every(
      (line) =>
        line.NumberOfLaps === lastLap ||
        (line.NumberOfLaps == lastLap - 1 && line.GapToLeader == "1 L") ||
        line.MVStatus?.TakenChequered
    );
  if (!allOnLast) return;

  if (STATE.LATEST_FLAG == Flags.CHEQUERED) {
    CONSOLE.info(
      "Resetting to default lighting after all drivers on track have passed the chequered flag"
    );
    await resetToDefaultLighting().catch(() => {});
    await toggleDreamview(true).catch(() => {});

    // If we're at the end of a race, kill the process
    if (STATE.RACE_STATE == "Race") process.exit(0);
  }
};

const checkRaceControlMessages = async (
  raceControlMessages: RaceControlMessages["Messages"]
) => {
  const enhancedRaceControlMessages = raceControlMessages.map(
    enhanceRaceControlMessage
  );

  const prevLatestMessageIndex = enhancedRaceControlMessages.findIndex(
    (msg, index) =>
      +new Date(msg.Utc) >
      (STATE.LATEST_RACE_CONTROL_MESSAGE_TIME ?? +new Date())
  );
  const messages =
    prevLatestMessageIndex === -1 && !STATE.LATEST_RACE_CONTROL_MESSAGE_TIME
      ? enhancedRaceControlMessages.slice(-1) // Start off with just the latest message
      : prevLatestMessageIndex === -1
      ? []
      : enhancedRaceControlMessages.slice(prevLatestMessageIndex);

  if (!messages.length) return;

  const latestMessageUTC = messages.at(-1)?.Utc;
  if (latestMessageUTC)
    STATE.LATEST_RACE_CONTROL_MESSAGE_TIME = +new Date(latestMessageUTC);

  for (const message of messages) {
    CONSOLE.debug(message);
    if (message.Category === "Flag") {
      switch (message.Flag) {
        case "CLEAR": {
          // Ignore flag during safety car, red and chequered flag
          if (
            STATE.SAFETY_CAR ||
            STATE.LATEST_FLAG === Flags.RED ||
            STATE.LATEST_FLAG === Flags.CHEQUERED
          ) {
            // check if clear in specific sector, filter if so
            // to ensure we can properly clear when needed
            if (message.Scope === "Sector")
              STATE.FLAG_SECTORS = STATE.FLAG_SECTORS.filter(
                (sector) => sector !== message.Sector
              );
            break;
          }
          CONSOLE.info(message.Message);
          if (message.Scope === "Track") {
            // Track is clear, reset to default state
            STATE.LATEST_FLAG = Flags.CLEAR;
            STATE.FLAG_SECTORS = [];
            await resetToDefaultLighting().catch(() => {});
          } else if (message.Scope === "Sector") {
            STATE.FLAG_SECTORS = STATE.FLAG_SECTORS.filter(
              (sector) => sector !== message.Sector
            );
            if (STATE.FLAG_SECTORS.length === 0) {
              // Track is clear, reset to default state
              STATE.LATEST_FLAG = Flags.CLEAR;
              await resetToDefaultLighting().catch(() => {});
            } else
              CONSOLE.debug("Not setting to clear flag due to flag sectors", {
                sectors: STATE.FLAG_SECTORS,
              });
          }
          break;
        }
        case "GREEN": {
          // Ignore flag during safety car and chequered flag
          if (STATE.SAFETY_CAR || STATE.LATEST_FLAG === Flags.CHEQUERED) break;
          // green flag, display green flag lighting then reset to default state
          CONSOLE.info(message.Message);
          STATE.LATEST_FLAG = Flags.GREEN;
          STATE.FLAG_SECTORS = [];
          await greenFlag().catch(() => {});
          break;
        }
        case "YELLOW": {
          CONSOLE.warn(message.Message);
          // Ignore flag during safety car and chequered flag
          if (STATE.SAFETY_CAR || STATE.LATEST_FLAG === Flags.CHEQUERED) break;
          else if (STATE.LATEST_FLAG === Flags.DOUBLE_YELLOW) {
            // if we're currently in double yellow, we'll check scope & break
            if (
              message.Scope === "Sector" &&
              typeof message.Sector === "number"
            )
              STATE.FLAG_SECTORS.push(message.Sector);
            else if (message.Scope === "Track") STATE.FLAG_SECTORS = [];
            break;
          } else if (STATE.LATEST_FLAG !== Flags.YELLOW) {
            // yellow flag, display yellow flag lighting
            STATE.LATEST_FLAG = Flags.YELLOW;
            await yellowFlag().catch(() => {});
          }
          if (message.Scope === "Sector" && typeof message.Sector === "number")
            STATE.FLAG_SECTORS.push(message.Sector);
          else if (message.Scope === "Track") STATE.FLAG_SECTORS = [];
          break;
        }
        case "DOUBLE YELLOW": {
          CONSOLE.warn(message.Message);
          // Ignore flag during safety car and chequered flag
          if (STATE.SAFETY_CAR || STATE.LATEST_FLAG === Flags.CHEQUERED) break;
          STATE.LATEST_FLAG = Flags.DOUBLE_YELLOW;
          // double yellow flag, display double yellow flag lighting
          await doubleYellowFlag().catch(() => {});
          if (message.Scope === "Sector" && typeof message.Sector === "number")
            STATE.FLAG_SECTORS.push(message.Sector);
          else if (message.Scope === "Track") STATE.FLAG_SECTORS = [];
          break;
        }
        case "RED": {
          CONSOLE.error("Red flag, session stopped!");
          STATE.LATEST_FLAG = Flags.RED;
          STATE.FLAG_SECTORS = [];
          // red flag, display red flag lighting
          await redFlag().catch(() => {});
          break;
        }
        case "CHEQUERED": {
          // scope isn't track for "first to take the flag"
          if (message.Scope !== "Track") break;
          CONSOLE.info("Chequered flag!");
          STATE.LATEST_FLAG = Flags.CHEQUERED;
          STATE.FLAG_SECTORS = [];
          // chequered flag, display chequered flag lighting
          await chequeredFlag().catch(() => {});
          break;
        }
        default: {
          // unknown, do nothing
          break;
        }
      }
    } else if (
      message.Category === Category.Drs ||
      message.SubCategory === SubCategory.Drs
    ) {
      switch (message.Status) {
        case "DISABLED": {
          CONSOLE.error(message.Message);
          // DRS disabled, display DRS disabled lighting then reset to default state
          await drsDisabled().catch(() => {});
          break;
        }
        case "ENABLED": {
          CONSOLE.info(message.Message);
          // DRS enabled, display DRS enabled lighting then reset to default state
          await drsEnabled().catch(() => {});
          break;
        }
        default: {
          // unknown, do nothing
          break;
        }
      }
    } else if (message.Category === Category.SafetyCar) {
      CONSOLE.warn(message.Message);
      switch (message.Status) {
        case "DEPLOYED": {
          // safety car deployed, display safety car lighting
          STATE.SAFETY_CAR = true;
          await safetyCarDeployed().catch(() => {});
          break;
        }
        case "IN THIS LAP":
        case "ENDING": {
          STATE.SAFETY_CAR = false;
          // safety car ending/in this lap, display safety car ending lighting then reset to default state
          await safetyCarEnding().catch(() => {});
          break;
        }
      }
    } else if (message.SubCategory === SubCategory.SessionStartDelayed) {
      CONSOLE.error(message.Message);
      await delay().catch(() => {});
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

  CONSOLE.debug("Starting off with default lighting state");
  await resetToDefaultLighting();
  await toggleDreamview(true);

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
        TrackStatus,
        LapCount,
        DriverList,
      },
    } = liveTiming;

    if (SessionInfo?.Type && SessionInfo.Type !== STATE.RACE_STATE) {
      CONSOLE.info(
        `Session type changed to ${SessionInfo.Type} - ${SessionInfo.Name}`
      );
      STATE.RACE_STATE = SessionInfo.Type;
    }
    if (SessionInfo && SessionData)
      checkQualiState({ SessionInfo, SessionData });
    if (TimingData?.Lines) {
      if (SessionInfo?.Type == "Qualifying" || SessionInfo.Type == "Race")
        checkForNewFastestLap(TimingData.Lines);
      if (SessionInfo?.Type == "Race")
        checkForNewRaceLeader(TimingData.Lines, DriverList);
    }
    if (RaceControlMessages?.Messages)
      checkRaceControlMessages(RaceControlMessages.Messages);
    if (
      TimingData?.Lines &&
      STATE.LATEST_FLAG === Flags.CHEQUERED &&
      LapCount?.CurrentLap
    )
      checkAllFinished(TimingData.Lines, LapCount.CurrentLap);

    // Fallback check for track clear status
    if (
      TrackStatus?.Message === "AllClear" &&
      STATE.LATEST_FLAG !== Flags.CLEAR
    )
      resetToDefaultLighting().catch(() => {});

    await sleep(500);
  }
};
