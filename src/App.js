import React, { Component } from "react";
import { lighten } from "polished";
import GoogleMap from "google-map-react";
import { meters2ScreenPixels } from "google-map-react/utils";
import styled, { css } from "styled-components";
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

function distanceToMouse({ x, y }, { x: mouseX, y: mouseY }) {
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

const markers = new Array(200).fill(null).map((value, index) => ({
  id: `${index}`,
  text: `Marker #${index}`,
  color: markerColors[Math.floor(markerColors.length * Math.random())],
  lat: defaultCenter.lat + Math.random() * 0.1 * (Math.random() > 0.5 ? 1 : -1),
  lng: defaultCenter.lng + Math.random() * 0.1 * (Math.random() > 0.5 ? 1 : -1)
}));

// TODO: refactor into a component
const MarkerPinIcon = ({ color, hovered }) => (
  <svg version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 365 560">
    <g>
      <path
        fill={hovered ? lighten(0.3, color) : color}
        d="M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9
		C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8
		c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z"
      />
    </g>
  </svg>
);

const MarkerPinWrapper = styled.div`
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

const Marker = ({ size = 20, dragging, text, color = "red", hovered }) => (
  <MarkerPinWrapper size={size} scaleUp={hovered || dragging}>
    <MarkerPinIcon color={color} hovered={hovered || dragging} />
  </MarkerPinWrapper>
);

// TODO: refactor into a component
const getClusterIconSize = count => {
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

const ClusterMarkerIcon = styled.div`
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

const ClusterMarker = ({ points, hovered }) => (
  <ClusterMarkerIcon count={points.length} hovered={hovered}>
    {points.length}
  </ClusterMarkerIcon>
);

// TODO: refactor into a component
const Circle = styled.div`
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

class App extends Component {
  state = {
    mapOptions: {
      ...defaultMapOptions
    },
    clusters: [],
    isDraggingMarker: false,
    draggableMarkerLocationStart: undefined,
    draggableMarkerLocation: {
      ...defaultCenter
    }
  };

  getClusters = markers => {
    const clusters = supercluster(markers, {
      minZoom: 0,
      maxZoom: 16,
      radius: 60
    });

    return clusters(this.state.mapOptions);
  };

  createClusters = props => {
    this.setState({
      clusters: this.state.mapOptions.bounds
        ? this.getClusters(props).map(({ wx, wy, numPoints, points }) => ({
            lat: wy,
            lng: wx,
            numPoints,
            id: `cluster_${numPoints}_${points[0].id}`,
            points
          }))
        : []
    });
  };

  handleChildMouseDown = (childKey, childProps, mouse) => {
    if (!childProps.draggable) {
      return;
    }
    this.setState({
      isDraggingMarker: true,
      draggableMarkerMouseLocationStart: {
        lat: this.state.draggableMarkerLocation.lat,
        lng: this.state.draggableMarkerLocation.lng
      },
      draggableMarkerLocationStart: {
        lat: mouse.lat,
        lng: mouse.lng
      }
    });
  };

  handleChildMouseMove = (childKey, childProps, mouse) => {
    if (!childProps.draggable) {
      return;
    }
    this.setState({
      isDraggingMarker: true,
      draggableMarkerLocation: {
        lat:
          this.state.draggableMarkerMouseLocationStart.lat +
          (mouse.lat - this.state.draggableMarkerLocationStart.lat),
        lng:
          this.state.draggableMarkerMouseLocationStart.lng +
          (mouse.lng - this.state.draggableMarkerLocationStart.lng)
      }
    });
  };

  handleChildMouseUp = (childKey, childProps, mouse) => {
    if (!childProps.draggable) {
      return;
    }
    this.setState({ isDraggingMarker: false });
  };

  handleChildMouseEnter = (childKey, childProps, mouse) => {
    this.setState({ hoveredMarkerKey: childKey });
  };

  handleChildMouseLeave = (childKey, childProps, mouse) => {
    this.setState({ hoveredMarkerKey: undefined });
  };

  handleMapClick = mouse => {
    this.setState({
      draggableMarkerLocation: { lat: mouse.lat, lng: mouse.lng }
    });
  };

  handleMapChange = ({ center, zoom, bounds }) => {
    this.setState(
      {
        mapOptions: {
          center,
          zoom,
          bounds
        }
      },
      () => {
        // TODO: take markers from props
        this.createClusters(markers);
      }
    );
  };

  handleChildClick = childId => {
    const cluster = this.state.clusters.find(cluster => cluster.id === childId);

    if (cluster && cluster.points.length > 1) {
      this.map.panTo({ lat: cluster.lat, lng: cluster.lng });
      const zoom = this.map.getZoom();
      if (zoom < 16) {
        this.map.setZoom(zoom + 1);
      }
    }
  };

  handleGoogleApiLoaded = ({ map, maps }) => {
    this.map = map;
  };

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
            <Marker
              key="draggable-marker"
              lat={this.state.draggableMarkerLocation.lat}
              lng={this.state.draggableMarkerLocation.lng}
              hovered={"draggable-marker" === this.state.hoveredMarkerKey}
              draggable
              dragging={this.state.isDraggingMarker}
              size={40}
            />

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

            {this.state.clusters.map(item => {
              if (item.numPoints === 1) {
                return (
                  <Marker
                    key={item.id}
                    lat={item.points[0].lat}
                    lng={item.points[0].lng}
                    hovered={
                      !this.state.isDraggingMarker &&
                      item.id === this.state.hoveredMarkerKey
                    }
                    color={item.points[0].color}
                  />
                );
              }

              return (
                <ClusterMarker
                  key={item.id}
                  lat={item.lat}
                  lng={item.lng}
                  hovered={
                    !this.state.isDraggingMarker &&
                    item.id === this.state.hoveredMarkerKey
                  }
                  points={item.points}
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
