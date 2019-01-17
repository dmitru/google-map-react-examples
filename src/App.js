import React, { Component } from "react";
import { lighten } from "polished";
import GoogleMap from "google-map-react";
import styled, { css } from "styled-components";
import "./App.css";

const defaultCenter = {
  lat: 10,
  lng: 10
};

function distanceToMouse({ x, y }, { x: mouseX, y: mouseY }) {
  return Math.sqrt((x - mouseX) * (x - mouseX) + (y - mouseY) * (y - mouseY));
}

const markerColors = ["yellow", "green", "red", "blue", "pink"];

const markers = new Array(20).fill(null).map((value, index) => ({
  id: `${index}`,
  text: `Marker #${index}`,
  color: markerColors[Math.floor(markerColors.length * Math.random())],
  lat:
    defaultCenter.lat + Math.random() * 0.01 * (Math.random() > 0.5 ? 1 : -1),
  lng: defaultCenter.lng + Math.random() * 0.01 * (Math.random() > 0.5 ? 1 : -1)
}));

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

const GoogleMapWrapper = styled.div`
  width: 100%;
  height: 100vh;
`;

class App extends Component {
  state = {
    isDraggingMarker: false,
    draggableMarkerLocationStart: undefined,
    draggableMarkerLocation: {
      ...defaultCenter
    }
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

  render() {
    return (
      <div className="App">
        <GoogleMapWrapper>
          <GoogleMap
            draggable={!this.state.isDraggingMarker}
            defaultZoom={14}
            defaultCenter={defaultCenter}
            onChildMouseDown={this.handleChildMouseDown}
            onChildMouseMove={this.handleChildMouseMove}
            onChildMouseUp={this.handleChildMouseUp}
            onChildMouseEnter={this.handleChildMouseEnter}
            onChildMouseLeave={this.handleChildMouseLeave}
            onChildClick={() => console.log("child click")}
            onClick={this.handleMapClick}
            hoverDistance={30}
            distanceToMouse={distanceToMouse}
          >
            <Marker
              key="draggable-marker"
              hovered={"draggable-marker" === this.state.hoveredMarkerKey}
              draggable
              dragging={this.state.isDraggingMarker}
              size={40}
              lat={this.state.draggableMarkerLocation.lat}
              lng={this.state.draggableMarkerLocation.lng}
            />

            {markers.map(marker => (
              <Marker
                key={marker.id}
                hovered={marker.id === this.state.hoveredMarkerKey}
                color={marker.color}
                text={marker.text}
                lat={marker.lat}
                lng={marker.lng}
              />
            ))}
          </GoogleMap>
        </GoogleMapWrapper>
      </div>
    );
  }
}

export default App;
