import type {
  MockRoute,
  PlannerConfig,
  RoutePersonality,
} from "@/types/routes";

const paceByPersonality: Record<RoutePersonality, number> = {
  balanced: 9.5,
  comfortable: 10.25,
  explorer: 10,
  fast: 8.5,
};

const preferenceLabels = {
  preferParks: "Your park preference is reflected in this demo recommendation.",
  avoidMajorRoads:
    "Your major-road preference is reflected in this demo recommendation.",
  preferFlatter: "Your flatter-route preference is reflected in this demo recommendation.",
  preferNewStreets:
    "Your new-streets preference is reflected in this demo recommendation.",
} as const;

function formatDuration(totalMinutes: number) {
  const roundedMinutes = Math.max(1, Math.round(totalMinutes));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
}

function formatPace(minutesPerUnit: number) {
  let minutes = Math.floor(minutesPerUnit);
  let seconds = Math.round((minutesPerUnit - minutes) * 60);

  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function selectedPreferenceReason(config: PlannerConfig) {
  const selectedPreference = Object.entries(config.preferences).find(
    ([, selected]) => selected,
  )?.[0] as keyof typeof preferenceLabels | undefined;

  return selectedPreference
    ? preferenceLabels[selectedPreference]
    : "No optional route preferences were applied to this demo.";
}

export function generateMockRoutes(config: PlannerConfig): MockRoute[] {
  const miles =
    config.unit === "miles" ? config.distance : config.distance / 1.60934;
  const paceInMiles = paceByPersonality[config.personality];
  const unitPace =
    config.unit === "miles" ? paceInMiles : paceInMiles / 1.60934;
  const distanceVariations = [1, 0.98, 1.03];
  const paceVariations = [1, 1.06, 1.03];
  const elevationPerMile = config.preferences.preferFlatter
    ? [22, 14, 28]
    : [36, 24, 44];
  const loopTurns = [3.5, 2.4, 5.2];
  const outAndBackTurns = [1.8, 1.2, 2.6];
  const repeatPercentages =
    config.routeType === "loop" ? [12, 8, 6] : [48, 52, 44];
  const sharedPreferenceReason = selectedPreferenceReason(config);
  const personalityArticle = config.personality === "explorer" ? "an" : "a";
  const routeDefinitions = [
    {
      id: "best-match" as const,
      name: "Best Match" as const,
      reasons: [
        `Closest match to your ${config.distance} ${config.unit} target.`,
        `Tuned for ${personalityArticle} ${config.personality} running style.`,
        sharedPreferenceReason,
      ],
    },
    {
      id: "most-comfortable" as const,
      name: "Most Comfortable" as const,
      reasons: [
        "Uses fewer turns for an easier-to-follow demo route.",
        "Models a steadier, more relaxed running rhythm.",
        config.preferences.avoidMajorRoads
          ? "Reflects your preference to avoid major roads."
          : "Balances simplicity with the requested route type.",
      ],
    },
    {
      id: "most-exploratory" as const,
      name: "Most Exploratory" as const,
      reasons: [
        "Models more route variety and directional changes.",
        "Keeps repeated segments lower where the route type allows.",
        config.preferences.preferNewStreets
          ? "Reflects your preference for new streets."
          : "Offers the most varied illustrative option.",
      ],
    },
  ];

  return routeDefinitions.map((definition, index) => {
    const distance = Number(
      (config.distance * distanceVariations[index]).toFixed(1),
    );
    const routeMiles = miles * distanceVariations[index];
    const pace = unitPace * paceVariations[index];
    const turnFactor =
      config.routeType === "loop" ? loopTurns[index] : outAndBackTurns[index];

    return {
      ...definition,
      distance,
      unit: config.unit,
      duration: formatDuration(distance * pace),
      pace: formatPace(pace),
      elevationGain: Math.round(routeMiles * elevationPerMile[index] / 5) * 5,
      turns: Math.max(2, Math.round(routeMiles * turnFactor)),
      repeatedRoutePercentage: repeatPercentages[index],
      routeType: config.routeType,
    };
  });
}
