export type BasicResponse = {
  requestId: string;
  msg: string;
  code: number;
  capability: PowerCapability | DynamicSceneCapability | DreamviewCapability;
};

export type DeviceStateResponse = Exclude<BasicResponse, "capability"> & {
  payload: {
    sku: string;
    device: string;
    capabilities: Capabilities[];
  };
};

type Capability = {
  type: string;
  instance: string;
  state: State;
  value: string | boolean | number;
};

export type Capabilities =
  | PowerCapability
  | OnlineCapability
  | GradientCapability
  | BrightnessCapability
  | SegmentedBrightnessCapability
  | SegmentedColorRGBCapability
  | ColorRGBCapability
  | ColorTemperatureCapability
  | DynamicSceneCapability
  | DreamviewCapability;

export type PowerCapability = Capability & {
  type: "devices.capabilities.on_off";
  instance: "powerSwitch";
  value: 0 | 1;
};

export type OnlineCapability = Capability & {
  type: "devices.capabilities.online";
  instance: "online";
  value: boolean;
};

export type GradientCapability = Capability & {
  type: "devices.capabilities.toggle";
  instance: "gradientToggle";
  value: string; // unknown content
};

export type BrightnessCapability = Capability & {
  type: "devices.capabilities.range";
  instance: "brightness";
  value: number; // 1-100
};

export type SegmentedBrightnessCapability = Capability & {
  type: "devices.capabilities.segment_color_setting";
  instance: "segmentedBrightness";
  value: string; // unknown content
};

export type SegmentedColorRGBCapability = Capability & {
  type: "devices.capabilities.segment_color_setting";
  instance: "segmentedColorRgb";
  value: string; // unknown content
};

export type ColorRGBCapability = Capability & {
  type: "devices.capabilities.color_setting";
  instance: "colorRgb";
  value: number; // RGB decimal value
};

export type ColorTemperatureCapability = Capability & {
  type: "devices.capabilities.color_setting";
  instance: "colorTemperatureK";
  value: number; // color temperature in Kelvin
};

export type DynamicSceneCapability = Capability & {
  type: "devices.capabilities.dynamic_scene";
  instance: "lightScene" | "diyScene" | "snapshot";
  value: number;
};

export type DreamviewCapability = Capability & {
  type: "devices.capabilities.toggle";
  instance: "dreamViewToggle";
  dreamType: "movie"; // other values currently unknown
  value: number;
};

export interface State {
  status: "success"; // other values currently unknown
}

export interface Device {
  sku: string;
  device: string;
}
