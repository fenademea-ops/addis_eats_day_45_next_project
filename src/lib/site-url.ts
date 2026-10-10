const isVercelDeployment = Boolean(process.env.VERCEL);
const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const configuredUrl = configuredSiteUrl
  ? new URL(configuredSiteUrl)
  : undefined;
const configuredHost = configuredUrl?.hostname;
const configuredUrlIsLocal =
  configuredHost === "localhost" ||
  configuredHost?.endsWith(".localhost") ||
  configuredHost === "127.0.0.1" ||
  configuredHost === "[::1]";
const vercelDefaultUrl = vercelHost
  ? `https://${vercelHost}`
  : "https://addis-eats-day-45-next-project.vercel.app";
const defaultSiteUrl = isVercelDeployment
  ? vercelDefaultUrl
  : "http://localhost:3000";

export const siteUrl = new URL(
  isVercelDeployment && configuredUrlIsLocal
    ? defaultSiteUrl
    : configuredSiteUrl ?? defaultSiteUrl
);

if (isVercelDeployment) {
  siteUrl.protocol = "https:";
}
