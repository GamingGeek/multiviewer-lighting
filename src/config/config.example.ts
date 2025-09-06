// RENAME THIS FILE TO config.ts AND FILL IN YOUR DETAILS
// config.ts IS ALREADY IN .GITIGNORE SO YOUR DETAILS SHOULDN'T BE COMMITTED

export default {
  GOVEE_DEVICE_SKU: "", // example: H713B
  GOVEE_DEVICE_ID: "", // example: AC:3B:D4:AD:FC:B5:BA:CC, obtained from https://developer.govee.com/reference/get-you-devices
  GOVEE_API_KEY: "", // https://developer.govee.com/reference/apply-you-govee-api-key
  SCENES: {
    // current scenes, may add more in the future
    GREEN_FLAG: 12345678, // Temporary scene for green flag, resets to dreamview after 10 seconds
    DRS_ENABLED: 23456789, // Temporary scene for DRS enabled, resets to dreamview after 5 seconds
    DRS_DISABLED: 34567890, // Temporary scene for DRS disabled, resets to dreamview after 5 seconds
    FASTEST_LAP: 45678901, // Temporary scene for fastest lap, resets to dreamview after 5 seconds
    SAFETY_CAR_DEPLOYED: 56789012, // Temporary scene when safety car is deployed, switches to ongoing after 10 seconds
    SAFETY_CAR_ONGOING: 67890123, // Scene used after deploy, used until safety car is ending / in this lap
    SAFETY_CAR_IN_THIS_LAP: 78901234, // Scene used when safety car is coming in this lap, green flag should get triggered when track is clear
    YELLOW_FLAG: 89012345, // Scene used when there's a yellow flag on track
    DOUBLE_YELLOW_FLAG: 90123456, // Scene used when there's a double yellow flag on track
    RED_FLAG: 12345678, // Scene used when session is stopped due to red flag
    CHEQUERED_FLAG: 23456789, // Temporary scene for chequered flag, resets to dreamview after 2 minutes
  },
  SNAPSHOTS: {
    DEFAULT: 12345678, // Snapshot ID for default scene
  },
  USE_DREAMVIEW: false, // Default scene is dreamview instead of snapshot
};
