import fs from "node:fs";
import path from "node:path";

export type RouteEntry = {
  route: string;
  team: string;
};

export type RoutesConfig = {
  baseUrl: string;
  routes: RouteEntry[];
};

const ROUTES_FILE = path.join(process.cwd(), "scripts/routes.example.json");

export function loadRoutesConfig(configPath = ROUTES_FILE): RoutesConfig {
  const raw = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(raw) as RoutesConfig;

  if (!config.baseUrl) {
    throw new Error("routes config must include baseUrl");
  }
  if (!Array.isArray(config.routes) || config.routes.length === 0) {
    throw new Error("routes config must include a non-empty routes array");
  }

  return config;
}

export function filterRoutesConfig(
  config: RoutesConfig,
  routePaths: string[]
): RoutesConfig {
  const wanted = new Set(routePaths);
  return {
    baseUrl: config.baseUrl,
    routes: config.routes.filter((entry) => wanted.has(entry.route)),
  };
}
