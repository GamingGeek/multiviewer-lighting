import CONFIG from "@/config/config.js";
import Centra from "centra";
import ENV from "./env.js";
import type { BasicResponse, Device, DeviceStateResponse } from "./types.js";

const device: Device = {
  sku: CONFIG.GOVEE_DEVICE_SKU,
  device: CONFIG.GOVEE_DEVICE_ID,
};

export const togglePower = async (state: boolean) => {
  const request = await Centra(ENV.BASE_URL, "POST")
    .path(ENV.DEVICE_CONTROL_ENDPOINT)
    .header("Govee-API-Key", CONFIG.GOVEE_API_KEY)
    .body({
      requestId: `${device.sku}-${device.device}-toggle-power`,
      payload: {
        sku: device.sku,
        device: device.device,
        capability: {
          type: "devices.capabilities.on_off",
          instance: "powerSwitch",
          value: Number(state),
        },
      },
    })
    .send();

  if (request.statusCode !== 200) return false;

  try {
    const response = (await request.json()) as BasicResponse;
    return response.capability.state.status === "success";
  } catch {
    // could be a parsing error, an issue with the response structure
    // or idk something else maybe, but whatever it is, it probably didn't work
    return false;
  }
};

export const setDIYScene = async (sceneId: number) => {
  const request = await Centra(ENV.BASE_URL, "POST")
    .path(ENV.DEVICE_CONTROL_ENDPOINT)
    .header("Govee-API-Key", CONFIG.GOVEE_API_KEY)
    .body({
      requestId: `${device.sku}-${device.device}-set-diy-scene`,
      payload: {
        sku: device.sku,
        device: device.device,
        capability: {
          type: "devices.capabilities.dynamic_scene",
          instance: "diyScene",
          value: sceneId,
        },
      },
    })
    .send();

  if (request.statusCode !== 200) return false;

  try {
    const response = (await request.json()) as BasicResponse;
    return response.capability.state.status === "success";
  } catch {
    return false;
  }
};

export const queryDeviceState = async (device: Device) => {
  const request = await Centra(ENV.BASE_URL, "POST")
    .path(ENV.DEVICE_STATE_ENDPOINT)
    .header("Govee-API-Key", CONFIG.GOVEE_API_KEY)
    .body({
      requestId: `${device.sku}-${device.device}-state`,
      payload: {
        sku: device.sku,
        device: device.device,
      },
    })
    .send();

  if (request.statusCode !== 200) return null;

  try {
    const response = (await request.json()) as DeviceStateResponse;
    return response;
  } catch {
    // nothing useful here, just return null
    return null;
  }
};
