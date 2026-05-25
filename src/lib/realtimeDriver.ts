const normalizeDriver = (value?: string): "webpubsub" | "reverb" => {
  const normalized = (value || "").trim().toLowerCase();
  return normalized === "webpubsub" ? "webpubsub" : "reverb";
};

const isLikelyAzureStaticAppsHost = (hostname: string): boolean => {
  return hostname.toLowerCase().endsWith(".azurestaticapps.net");
};

export const resolveRealtimeDriver = (): "webpubsub" | "reverb" => {
  const envDriver = normalizeDriver(process.env.REACT_APP_REALTIME_DRIVER);
  if (envDriver === "webpubsub") {
    return envDriver;
  }

  if (typeof window !== "undefined" && isLikelyAzureStaticAppsHost(window.location.hostname)) {
    // On Azure Static Web Apps, default to Web PubSub unless explicitly forced.
    return "webpubsub";
  }

  return "reverb";
};