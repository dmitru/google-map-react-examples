export type Point = {
  x: number;
  y: number;
};

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Bounds {
  ne: LatLng;
  nw: LatLng;
  se: LatLng;
  sw: LatLng;
}

export interface MarkerInfo extends LatLng {
  data: any;
  id: string;
}

export interface ClusterInfo extends LatLng {
  id: string;
  markers: MarkerInfo[];
}
