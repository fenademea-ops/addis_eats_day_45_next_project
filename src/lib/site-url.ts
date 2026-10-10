const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

const defaultSiteUrl =
  process.env.VERCEL && vercelHost
    ? `https://${vercelHost}`
    : process.env.VERCEL
      ? "https://addis-eats-day-45-next-project.vercel.app"
      : "http://localhost:3000";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl
);
