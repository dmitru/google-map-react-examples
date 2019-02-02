import React, { Component } from "react";
import _ from "lodash";
import GoogleMap from "google-map-react";
// @ts-ignore
import { meters2ScreenPixels } from "google-map-react/utils";
import styled from "styled-components";
// @ts-ignore
import supercluster from "points-cluster";
import { MarkerInfo, Bounds, LatLng, ClusterInfo } from "../types";
import {
  Marker,
  MarkerPinWithHoleIcon,
  RenderTooltipProps,
  MarkerLabel
} from "./marker";
import { Circle } from "./circle";
import { ClusterMarker } from "./cluster-marker";

import { Tooltip } from "./tooltip";
import { distanceToMouse } from "../utils";

const defaultCenter = {
  lat: 10,
  lng: 10
};

const defaultMapOptions = {
  center: defaultCenter,
  zoom: 12
};

const markerColors = [
  "#F2DD6E",
  "#539987",
  "#A53860",
  "#1C77C3",
  "#40BCD8",
  "#F39237"
];

const generateRandomMarkersInArea: (
  arg: { bounds: Bounds; count: number }
) => MarkerInfo[] = ({ bounds, count = 100 }) => {
  const { ne, nw, se, sw } = bounds;
  return _.range(count).map((value, index) => ({
    id: `${index}`,
    data: {
      text: `Marker #${index}`,
      label: `${index}`,
      color: markerColors[Math.floor(markerColors.length * Math.random())]
    },
    lat: _.random(se.lat, ne.lat, true),
    lng: _.random(nw.lng, ne.lng, true)
  }));
};

const generateRandomMarkersInAreaWithMockedServerDelay: (
  arg: {
    bounds: Bounds;
    count: number;
  }
) => Promise<MarkerInfo[]> = async arg => {
  // Wait some time to simulate server delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return generateRandomMarkersInArea(arg);
};

export interface MapChildProps {
  lat: number;
  lng: number;
  key: string;
}

const Wrapper = styled.div`
  width: 100vh;
  height: 100vh;
`;

const GoogleMapWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

interface MapState {
  mapOptions: {
    bounds?: Bounds;
    center: LatLng;
    zoom: number;
  };
  markers: MarkerInfo[];
  clusters: ClusterInfo[];
  isDraggingMarker: boolean;

  hoveredChildId?: string;
  markerIdWithTooltipShown?: string;

  draggableMarkerLocationStart?: LatLng;
  draggableMarkerMouseLocationStart?: LatLng;
  draggableMarkerLocation?: LatLng;
}

export class Map extends Component<{}, MapState> {
  map: any;

  state: MapState = {
    mapOptions: {
      ...defaultMapOptions
    },
    markers: [],
    clusters: [],

    isDraggingMarker: false,
    markerIdWithTooltipShown: undefined,
    draggableMarkerLocationStart: undefined,
    draggableMarkerLocation: {
      ...defaultCenter
    }
  };

  getClusters = (markers: MarkerInfo[]) => {
    const clusters = supercluster(markers, {
      minZoom: 0,
      maxZoom: 16,
      radius: 80
    });

    return clusters(this.state.mapOptions);
  };

  createClusters = (markers: MarkerInfo[]) => {
    this.setState({
      clusters: this.state.mapOptions.bounds
        ? this.getClusters(markers).map(
            ({
              wx,
              wy,
              points
            }: {
              wx: number;
              wy: number;
              points: MarkerInfo[];
            }) =>
              ({
                lat: wy,
                lng: wx,
                id: `cluster_${points.length}_${points[0].id}`,
                markers: points
              } as ClusterInfo)
          )
        : []
    });
  };

  handleChildMouseDown = (childKey: string, childProps: any, mouse: LatLng) => {
    if (!childProps.draggable) {
      return;
    }
    this.setState({
      isDraggingMarker: true,
      draggableMarkerMouseLocationStart: {
        lat: this.state.draggableMarkerLocation!.lat,
        lng: this.state.draggableMarkerLocation!.lng
      },
      draggableMarkerLocationStart: {
        lat: mouse.lat,
        lng: mouse.lng
      }
    });
  };

  handleChildMouseMove = (childKey: string, childProps: any, mouse: LatLng) => {
    if (!childProps.draggable) {
      return;
    }
    this.setState({
      isDraggingMarker: true,
      draggableMarkerLocation: {
        lat:
          this.state.draggableMarkerMouseLocationStart!.lat +
          (mouse.lat - this.state.draggableMarkerLocationStart!.lat),
        lng:
          this.state.draggableMarkerMouseLocationStart!.lng +
          (mouse.lng - this.state.draggableMarkerLocationStart!.lng)
      }
    });
  };

  handleChildMouseUp = (childId: string, childProps: any, mouse: LatLng) => {
    if (!childProps.draggable) {
      return;
    }
    this.setState({ isDraggingMarker: false });
  };

  handleChildMouseEnter = (childId: string, childProps: any) => {
    this.setState({ hoveredChildId: childId });
  };

  handleChildMouseLeave = (childId: string, childProps: any) => {
    this.setState({ hoveredChildId: undefined });
  };

  handleMapClick = (position: LatLng) => {
    if (this.state.markerIdWithTooltipShown) {
      this.setState({ markerIdWithTooltipShown: undefined });
    } else {
      this.setState({
        draggableMarkerLocation: { ...position }
      });
    }
  };

  handleMapChange = ({
    center,
    zoom,
    bounds
  }: {
    center: LatLng;
    zoom: number;
    bounds: Bounds;
  }) => {
    this.setState(
      {
        mapOptions: {
          center,
          zoom,
          bounds
        }
      },
      async () => {
        if (this.state.markers.length === 0) {
          const markersCount = 200;

          const newMarkers = await generateRandomMarkersInAreaWithMockedServerDelay(
            { bounds: this.state.mapOptions.bounds!, count: markersCount }
          );

          this.setState({ markers: newMarkers }, () => {
            this.createClusters(this.state.markers);
          });
        } else {
          this.createClusters(this.state.markers);
        }
      }
    );
  };

  handleChildClick = (childId: string) => {
    const cluster = this.state.clusters.find(cluster => cluster.id === childId);

    if (cluster && cluster.markers.length > 1) {
      this.map.panTo({ lat: cluster.lat, lng: cluster.lng });
      const zoom = this.map.getZoom();
      if (zoom < 16) {
        this.map.setZoom(zoom + 1);
      }

      this.setState({ markerIdWithTooltipShown: undefined });
    } else if (cluster && cluster.markers.length === 1) {
      const marker = cluster.markers[0];

      if (marker.id === this.state.markerIdWithTooltipShown) {
        this.setState({ markerIdWithTooltipShown: undefined });
      } else {
        this.setState({ markerIdWithTooltipShown: marker.id });
      }
    }
  };

  handleGoogleApiLoaded = ({ map }: { map: any }) => {
    this.map = map;
  };

  renderTooltip = ({ data, selected }: RenderTooltipProps) => {
    return (
      <Tooltip show pinned={selected || false}>
        <h1>Tooltip content</h1>
        {data.text}
      </Tooltip>
    );
  };

  mapWrapperRef: React.RefObject<HTMLDivElement> = React.createRef();

  render() {
    return (
      <Wrapper>
        <GoogleMapWrapper ref={this.mapWrapperRef}>
          <GoogleMap
            draggable={!this.state.isDraggingMarker}
            defaultZoom={defaultMapOptions.zoom}
            defaultCenter={defaultMapOptions.center}
            onChange={this.handleMapChange}
            onChildMouseDown={this.handleChildMouseDown}
            onChildMouseMove={this.handleChildMouseMove}
            onChildMouseUp={this.handleChildMouseUp}
            onChildMouseEnter={this.handleChildMouseEnter}
            onChildMouseLeave={this.handleChildMouseLeave}
            onChildClick={this.handleChildClick}
            onClick={this.handleMapClick}
            hoverDistance={30}
            distanceToMouse={distanceToMouse}
            yesIWantToUseGoogleMapApiInternals
            onGoogleApiLoaded={this.handleGoogleApiLoaded}
          >
            {!!this.state.draggableMarkerLocation && (
              <Marker
                id="draggable-marker"
                key="draggable-marker"
                lat={this.state.draggableMarkerLocation.lat}
                lng={this.state.draggableMarkerLocation.lng}
                hovered={"draggable-marker" === this.state.hoveredChildId}
                draggable
                data={{
                  color: "red"
                }}
                dragging={this.state.isDraggingMarker}
                size={40}
                PinIcon={MarkerPinWithHoleIcon}
              />
            )}
            {!!this.state.draggableMarkerLocation && (
              <Circle
                key="draggable-marker-circle"
                lat={this.state.draggableMarkerLocation.lat}
                lng={this.state.draggableMarkerLocation.lng}
                size={
                  meters2ScreenPixels(
                    10000,
                    this.state.draggableMarkerLocation,
                    this.state.mapOptions.zoom
                  ).w
                }
              />
            )}

            {this.state.clusters.map(cluster => {
              if (cluster.markers.length === 1) {
                const marker = cluster.markers[0];

                const isMarkerHovered =
                  !this.state.isDraggingMarker &&
                  cluster.id === this.state.hoveredChildId;
                const isMarkerSelected =
                  marker.id === this.state.markerIdWithTooltipShown;

                return (
                  // @ts-ignore
                  <Marker
                    key={cluster.id}
                    id={marker.id}
                    lat={marker.lat}
                    lng={marker.lng}
                    hovered={isMarkerHovered}
                    selected={isMarkerSelected}
                    data={marker.data}
                    renderTooltip={this.renderTooltip}
                  >
                    <MarkerLabel>{marker.data.label}</MarkerLabel>
                  </Marker>
                );
              }

              return (
                <ClusterMarker
                  key={cluster.id}
                  lat={cluster.lat}
                  lng={cluster.lng}
                  hovered={
                    !this.state.isDraggingMarker &&
                    cluster.id === this.state.hoveredChildId
                  }
                  points={cluster.markers}
                />
              );
            })}
          </GoogleMap>
        </GoogleMapWrapper>
      </Wrapper>
    );
  }
}
