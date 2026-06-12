const changeMonitoringSetting = import.meta.env.VITE_ENABLE_CHANGE_MONITORING;

export const CHANGE_MONITORING_ENABLED =
  changeMonitoringSetting === "true"
  || (import.meta.env.DEV && changeMonitoringSetting !== "false");
