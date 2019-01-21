import React, { Component } from "react";
import _ from "lodash";
import { lighten } from "polished";
import GoogleMap from "google-map-react";
// @ts-ignore
import { meters2ScreenPixels } from "google-map-react/utils";
import styled, { css } from "styled-components";
// @ts-ignore
import supercluster from "points-cluster";
import "./App.css";

const defaultCenter = {
  lat: 10,
  lng: 10
};

const defaultMapOptions = {
  center: defaultCenter,
  zoom: 12
};

type Point = {
  x: number;
  y: number;
};

function distanceToMouse(point: Point, mousePoint: Point) {
  const { x: mouseX, y: mouseY } = mousePoint;
  const { x, y } = point;
  return Math.sqrt((x - mouseX) * (x - mouseX) + (y - mouseY) * (y - mouseY));
}

const markerColors = [
  "#F2DD6E",
  "#539987",
  "#A53860",
  "#1C77C3",
  "#40BCD8",
  "#F39237"
];

interface LatLng {
  lat: number;
  lng: number;
}

interface Bounds {
  ne: LatLng;
  nw: LatLng;
  se: LatLng;
  sw: LatLng;
}

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

const defaultMarkers = _.range(200).map((value, index) => ({
  id: `${index}`,
  data: {
    text: `Marker #${index}`
  },
  color: markerColors[Math.floor(markerColors.length * Math.random())],
  lat: defaultCenter.lat + Math.random() * 0.1 * (Math.random() > 0.5 ? 1 : -1),
  lng: defaultCenter.lng + Math.random() * 0.1 * (Math.random() > 0.5 ? 1 : -1)
}));

interface MarkerPinIconProps {
  color: string;
  hovered: boolean;
  withHole?: boolean;
  label?: string;
}

// TODO: refactor into a component
const MarkerPinIcon: React.SFC<MarkerPinIconProps> = ({ color, hovered }) => (
  <svg version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 365 560">
    <g>
      <path
        fill={hovered ? lighten(0.3, color) : color}
        d={`M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9
		C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8`}
      />
    </g>
  </svg>
);

const MarkerPinWithHoleIcon: React.SFC<MarkerPinIconProps> = ({
  color,
  hovered
}) => (
  <svg version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 365 560">
    <g>
      <path
        fill={hovered ? lighten(0.3, color) : color}
        d={`M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9
		C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8
		c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z`}
      />
    </g>
  </svg>
);

const MarkerPinWrapper = styled("div")<{ size: number; scaleUp: boolean }>`
  width: 20px;
  height: 30px;

  position: relative;

  ${props =>
    props.size &&
    css`
      width: ${props.size}px;
      height: ${(props.size * 3) / 2}px;
    `}

  z-index: 1;
  transform: translate(-50%, -50%);
  transition: transform 0.2s;
  transform-origin: 0% 90%;

  ${props =>
    props.scaleUp &&
    css`
      z-index: 2;
      transform: scale(1.2) translate(-50%, -50%);
    `}

  svg {
    transition: fill 0.3s;
  }
`;

interface RenderTooltipProps {
  id: string;
  data: any;
  hovered?: boolean;
  selected?: boolean;
}

interface MapChildProps {
  lat: number;
  lng: number;
  key: string;
}

interface MarkerProps extends MapChildProps {
  id: string;
  data?: any;
  size?: number;
  draggable?: boolean;
  dragging?: boolean;
  PinIcon?: any;
  color?: string;
  hovered?: boolean;
  selected?: boolean;
  renderTooltip?: (props: RenderTooltipProps) => React.ReactNode;
}

const Marker: React.SFC<MarkerProps> = ({
  id,
  data = {},
  size = 20,
  dragging,
  hovered,
  selected,
  PinIcon,
  renderTooltip,
  children
}) => {
  const tooltip = renderTooltip
    ? renderTooltip({ id, data, hovered, selected })
    : null;

  const PinIconOrDefault = PinIcon || MarkerPinIcon;

  return (
    <div>
      {tooltip}
      <MarkerPinWrapper size={size} scaleUp={hovered || dragging || false}>
        <PinIconOrDefault
          color={data.color}
          hovered={hovered || dragging || false}
        />
        {children}
      </MarkerPinWrapper>
    </div>
  );
};

// TODO: refactor into a component
const getClusterIconSize = (count: number) => {
  if (count >= 200) {
    return 80;
  } else if (count >= 100) {
    return 70;
  } else if (count >= 50) {
    return 60;
  } else if (count >= 20) {
    return 50;
  } else if (count >= 10) {
    return 40;
  }
  return 30;
};

const ClusterMarkerIcon = styled("div")<{ count: number; hovered: boolean }>`
  width: ${props => getClusterIconSize(props.count)}px;
  height: ${props => getClusterIconSize(props.count)}px;

  background: white;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 100%;
  transition: all 0.3s;

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 1;
  transform-origin: 0% 0%;
  transform: translate(-50%, -50%);

  ${props =>
    props.hovered &&
    css`
      background: rgba(255, 255, 255, 0.9);
      z-index: 2;
      transform: scale(1.2) translate(-50%, -50%);
    `}

  font-size: ${props => (props.count > 100 ? "18px" : "20px")};
`;

interface MarkerInfo extends LatLng {
  data: any;
  id: string;
}

interface ClusterInfo extends LatLng {
  id: string;
  markers: MarkerInfo[];
}

interface ClusterMarkerProps extends MapChildProps {
  points: MarkerInfo[];
  hovered: boolean;
}

const ClusterMarker = ({ points, hovered }: ClusterMarkerProps) => (
  <ClusterMarkerIcon count={points.length} hovered={hovered}>
    {points.length}
  </ClusterMarkerIcon>
);

// TODO: refactor into a component
interface CircleProps extends MapChildProps {
  size: number;
}

const Circle = styled("div")<CircleProps>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;

  background: ${props => props.color || "rgba(255, 0, 0, 0.3)"};
  border-radius: 100%;
  transition: all 0.3s;

  z-index: 0;
  transform-origin: 0% 0%;
  transform: translate(-50%, -50%);
`;

const GoogleMapWrapper = styled.div`
  width: 100%;
  height: 100vh;
`;

const TooltipWrapper = styled("div")<{ show: boolean; pinned: boolean }>`
  position: absolute;
  width: 200px;
  background: white;
  padding: 10px;

  border-radius: 10px;
  border: 1px solid gray;

  h1 {
    margin-top: 0;
    margin-bottom: 0;
  }

  opacity: 0;
  transition: opacity 0.2s;

  z-index: 2000;

  ${props => props.show && "opacity: 1.0;"}
  ${props => props.pinned && "background: white;"}
`;

interface AppState {
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

const MarkerLabel = styled.span`
  position: relative;
  top: -30px;
  font-size: 8px;
  color: white;
`;

class App extends Component<{}, AppState> {
  map: any;

  state: AppState = {
    mapOptions: {
      ...defaultMapOptions
    },
    markers: defaultMarkers,
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
      radius: 60
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
        const markersCount =
          4 * Math.pow(1 + 22 - this.state.mapOptions.zoom, 2);

        const newMarkers = await generateRandomMarkersInAreaWithMockedServerDelay(
          { bounds: this.state.mapOptions.bounds!, count: markersCount }
        );

        this.setState({ markers: newMarkers }, () => {
          this.createClusters(this.state.markers);
        });
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

  renderTooltip = ({ data, hovered, selected }: RenderTooltipProps) => (
    <TooltipWrapper
      show={hovered || selected || false}
      pinned={selected || false}
    >
      <h1>Tooltip content</h1>
      {data.text}
    </TooltipWrapper>
  );

  render() {
    return (
      <div className="App">
        <GoogleMapWrapper>
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

                return (
                  <Marker
                    key={cluster.id}
                    id={marker.id}
                    lat={marker.lat}
                    lng={marker.lng}
                    hovered={
                      !this.state.isDraggingMarker &&
                      cluster.id === this.state.hoveredChildId
                    }
                    renderTooltip={this.renderTooltip}
                    selected={marker.id === this.state.markerIdWithTooltipShown}
                    data={marker.data}
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
      </div>
    );
  }
}

export default App;
