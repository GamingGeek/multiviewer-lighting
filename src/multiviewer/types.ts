// Generated using quicktype.io

export type MultiviewerHeartbeat = {
  Utc: string;
};

export type MultiviewerAllDataGraphQL = {
  data: Data;
};

export type Data = {
  f1LiveTimingState: F1LiveTimingState;
};

export type F1LiveTimingState = {
  RaceControlMessages: RaceControlMessages;
  SessionData: SessionData;
  SessionInfo: SessionInfo;
  SessionStatus: SessionStatus;
  TimingData: TimingData;
  TimingStats: TimingStats;
  TrackStatus: TrackStatus;
  LapCount: LapCount;
  DriverList: DriverList;
};

export type RaceControlMessages = {
  Messages: Message[];
};

export type Message = {
  Utc: `${ReturnType<Date["toISOString"]>}`;
  Category: Category;
  Flag?: string;
  Status?: string;
  Scope?: string;
  Mode?: string;
  Message: string;
  Sector?: number;
};

export enum Category {
  Flag = "Flag",
  Other = "Other",
  SafetyCar = "SafetyCar",
  CarEvent = "CarEvent",
}

export enum SubCategory {
  // Drs = "Drs",
  OvertakeMode = "OvertakeMode",
  Flag = "Flag",
  SessionStartDelayed = "SessionStartDelayed",
  SessionDurationChanged = "SessionDurationChanged",
  LapTimeDeleted = "LapTimeDeleted",
  LappedCarsMayOvertake = "LappedCarsMayOvertake",
  LappedCarsMayNotOvertake = "LappedCarsMayNotOvertake",
  NormalGripConditions = "NormalGripConditions",
  OffTrackAndContinued = "OffTrackAndContinued",
  SpunAndContinued = "SpunAndContinued",
  MissedApex = "MissedApex",
  CarStopped = "CarStopped",
  SafetyCar = "SafetyCar",
  VirtualSafetyCar = "VirtualSafetyCar",
  IncidentNoted = "IncidentNoted",
  IncidentUnderInvestigation = "IncidentUnderInvestigation",
  IncidentInvestigationAfterSession = "IncidentInvestigationAfterSession",
  IncidentNoFurtherAction = "IncidentNoFurtherAction",
  IncidentNoFurtherInvestigation = "IncidentNoFurtherInvestigation",
  TimePenalty = "TimePenalty",
  StopGoPenalty = "StopGoPenalty",
  TrackTestCompleted = "TrackTestCompleted",
  TrackSurfaceSlippery = "TrackSurfaceSlippery",
  LowGripConditions = "LowGripConditions",
  Weather = "Weather",
  PitExit = "PitExit",
  PitEntry = "PitEntry",
  SessionResume = "SessionResume",
  Correction = "Correction",
  Other = "Other",
}

export type SessionData = {
  Series: any[];
  StatusSeries: StatusSeries[];
};

export type StatusSeries = {
  Utc: Date;
  TrackStatus?: string;
  SessionStatus?: SessionStatusValue;
};

export type SessionInfo = {
  Meeting: Meeting;
  SessionStatus: string;
  ArchiveStatus: ArchiveStatus;
  Key: number;
  Type: "Practice" | "Qualifying" | "Race";
  Number: number;
  Name:
    | `Practice ${number}`
    | "Qualifying"
    | "Sprint Qualifying"
    | "Race"
    | "Sprint";
  StartDate: Date;
  EndDate: Date;
  GmtOffset: string;
  Path: string;
};

export type ArchiveStatus = {
  Status: string;
};

export type Meeting = {
  Key: number;
  Name: string;
  OfficialName: string;
  Location: string;
  Number: number;
  Country: Country;
  Circuit: Circuit;
};

export type Circuit = {
  Key: number;
  ShortName: string;
};

export type Country = {
  Key: number;
  Code: string;
  Name: string;
};

export type SessionStatus = {
  Status: SessionStatusValue;
  Started: SessionStatusValue;
};

export type SessionStatusValue =
  | "Inactive"
  | "Started"
  | "Finished"
  | "Finalised"
  | "Ends"
  | "Aborted";

export type TimingData = {
  Lines: { [key: string]: TimingDataLine };
  Withheld: boolean;
};

export type TimingDataLine = {
  Stats?: TimingDataLineStats[];
  TimeDiffToFastest?: string;
  TimeDiffToPositionAhead?: string;
  GapToLeader?: string;
  KnockedOut?: boolean;
  Cutoff?: boolean;
  BestLapTimes: BestLapTime[];
  IntervalToPositionAhead?: IntervalToPositionAhead;
  Line: number;
  Position: `${number}`;
  ShowPosition: boolean;
  RacingNumber: `${number}`;
  Retired: boolean;
  InPit: boolean;
  PitOut: boolean;
  Stopped: boolean;
  Status: number;
  Sectors: Sector[];
  Speeds: Speeds;
  BestLapTime: BestLapTime;
  LastLapTime: LastLapTime;
  NumberOfLaps?: number;
  NumberOfPitStops?: number;
  MVStatus: MVStatus;
};

export interface TimingDataLineStats {
  TimeDiffToFastest?: string;
  TimeDifftoPositionAhead?: string;
}

export type BestLapTime = {
  Value: string;
  Lap: number;
};

export interface IntervalToPositionAhead {
  Value: string;
  Catching: boolean;
}

export type LastLapTime = {
  Value: string;
  Status: number;
  OverallFastest: boolean;
  PersonalFastest: boolean;
};

export type MVStatus = {
  Stopped: boolean;
  Retired: boolean;
  InPit: boolean;
  PitOut: boolean;
  ShowPosition: boolean;
  KnockedOut: boolean;
  Cutoff: boolean;
  Outlap: boolean;
  TakenChequered: boolean;
};

export type Sector = {
  Stopped: boolean;
  Value: string;
  Status: number;
  OverallFastest: boolean;
  PersonalFastest: boolean;
  Segments: Segment[];
  PreviousValue: string;
};

export type Segment = {
  Status: number;
};

export type Speeds = {
  I1: LastLapTime;
  I2: LastLapTime;
  FL: LastLapTime;
  ST: LastLapTime;
};

export type TimingStats = {
  Withheld: boolean;
  Lines: { [key: string]: TimingStatsLine };
  SessionType: string;
};

export type TimingStatsLine = {
  Line: number;
  RacingNumber: string;
  PersonalBestLapTime: PersonalBestLapTime;
  BestSectors: BestSector[];
  BestSpeeds: BestSpeeds;
};

export type BestSector = {
  Value: string;
  Position: number;
};

export type BestSpeeds = {
  I1: BestSector;
  I2: BestSector;
  FL: BestSector;
  ST: BestSector;
};

export type PersonalBestLapTime = {
  Value: string;
  Lap: number;
  Position: number;
};

export type TrackStatus = {
  Status: TrackStatusValue;
  Message: `${keyof typeof TrackStatusValue}`;
};

export enum TrackStatusValue {
  AllClear = "1",
  Yellow = "2",
  SCStandBy = "3",
  SCDeployed = "4",
  Red = "5",
  VSCDeployed = "6",
  VSCEnding = "7",
}

export type LapCount = {
  CurrentLap: number;
  TotalLaps: number;
};

export type DriverList = {
  [key: `${number}`]: {
    RacingNumber: string;
    BroadcastName: string;
    FullName: string;
    Tla: string;
    Line: number;
    TeamName: string;
    TeamColour: string;
    FirstName: string;
    LastName: string;
    Reference: string;
    HeadshotUrl?: string;
    PublicIdRight: string;
  };
};

export enum Flags {
  CLEAR,
  GREEN,
  YELLOW,
  DOUBLE_YELLOW,
  RED,
  CHEQUERED,
}
