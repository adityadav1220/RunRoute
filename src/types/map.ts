export interface MapCoordinate {
  longitude: number;
  latitude: number;
}

export type LocationSource = "search" | "map" | "current-location";

export interface SelectedLocation extends MapCoordinate {
  label: string;
  source: LocationSource;
}
