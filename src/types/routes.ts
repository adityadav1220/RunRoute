export type DistanceUnit = "miles" | "kilometers";

export type RouteType = "loop" | "out-and-back";

export type RoutePersonality =
  | "balanced"
  | "comfortable"
  | "explorer"
  | "fast";

export type RoutePreference =
  | "preferParks"
  | "avoidMajorRoads"
  | "preferFlatter"
  | "preferNewStreets";

export type RoutePreferences = Record<RoutePreference, boolean>;

export interface PlannerConfig {
  startingLocation: string;
  distance: number;
  unit: DistanceUnit;
  routeType: RouteType;
  personality: RoutePersonality;
  preferences: RoutePreferences;
}

export interface MockRoute {
  id: "best-match" | "most-comfortable" | "most-exploratory";
  name: "Best Match" | "Most Comfortable" | "Most Exploratory";
  distance: number;
  unit: DistanceUnit;
  duration: string;
  pace: string;
  elevationGain: number;
  turns: number;
  repeatedRoutePercentage: number;
  reasons: string[];
  routeType: RouteType;
}
