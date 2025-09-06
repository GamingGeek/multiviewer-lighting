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
};

export type RaceControlMessages = {
  Messages: Message[];
};

export type Message = {
  Utc: Date;
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
  Drs = "Drs",
  SafetyCar = "SafetyCar",
}

export type SessionData = {
  Series: any[];
  StatusSeries: StatusSery[];
};

export type StatusSery = {
  Utc: Date;
  TrackStatus?: string;
  SessionStatus?: string;
};

export type SessionInfo = {
  Meeting: Meeting;
  SessionStatus: string;
  ArchiveStatus: ArchiveStatus;
  Key: number;
  Type: string;
  Number: number;
  Name: string;
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
  Status: string;
  Started: string;
};

export type TimingData = {
  Lines: { [key: string]: TimingDataLine };
  Withheld: boolean;
};

export type TimingDataLine = {
  // TimeDiffToFastest: string;
  // TimeDiffToPositionAhead: string;
  // Line: number;
  // Position: string;
  // ShowPosition: boolean;
  // RacingNumber: string;
  // Retired: boolean;
  // InPit: boolean;
  // PitOut: boolean;
  // Stopped: boolean;
  // Status: number;
  // Sectors: Sector[];
  // Speeds: Speeds;
  // BestLapTime: BestLapTime;
  // LastLapTime: LastLapTime;
  // NumberOfLaps: number;
  // NumberOfPitStops?: number;
  Stats?: TimingDataLineStats[];
  TimeDiffToFastest?: string;
  TimeDiffToPositionAhead?: string;
  GapToLeader?: string;
  KnockedOut?: boolean;
  Cutoff?: boolean;
  BestLapTimes: BestLapTime[];
  IntervalToPositionAhead?: IntervalToPositionAhead;
  Line: number;
  Position: string;
  ShowPosition: boolean;
  RacingNumber: string;
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
  Status: string;
  Message: string;
};

export enum Flags {
  CLEAR,
  GREEN,
  YELLOW,
  DOUBLE_YELLOW,
  RED,
  CHEQUERED,
}
