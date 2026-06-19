import "dotenv/config";

export const PORT = Number(process.env.PORT ?? 3001);

const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const parseClientOrigins = () => {
  const configuredOrigins = process.env.CLIENT_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins?.length ? configuredOrigins : DEFAULT_CLIENT_ORIGINS;
};

export const CLIENT_ORIGINS = parseClientOrigins();

const isLocalNetworkOrigin = (origin) => {
  if (process.env.NODE_ENV === "production") return false;

  try {
    const { hostname, protocol } = new URL(origin);
    const isDevelopmentProtocol = protocol === "http:";

    return (
      isDevelopmentProtocol &&
      (hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname))
    );
  } catch {
    return false;
  }
};

export const isAllowedClientOrigin = (origin) => {
  if (!origin) return true;

  if (origin.endsWith(".netlify.app")) return true;

  return CLIENT_ORIGINS.includes(origin) || isLocalNetworkOrigin(origin);
};
