import React, { Component } from "react";
import GoogleMap from "google-map-react";
import styled, { css } from "styled-components";
import "./App.css";

const defaultCenter = {
  lat: 10,
  lng: 10
};

const markerColors = ["yellow", "green", "red", "blue", "pink"];

const markers = new Array(20).fill(null).map((value, index) => ({
  id: index,
  text: `Marker #${index}`,
  color: markerColors[Math.floor(markerColors.length * Math.random())],
  lat:
    defaultCenter.lat + Math.random() * 0.01 * (Math.random() > 0.5 ? 1 : -1),
  lng: defaultCenter.lng + Math.random() * 0.01 * (Math.random() > 0.5 ? 1 : -1)
}));

const MarkerPinIcon = ({ color = "red" }) => (
  <svg version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 365 560">
    <g>
      <path
        fill={color}
        d="M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9
		C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8
		c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z"
      />
    </g>
  </svg>
);

const MarkerPinWrapper = styled.div`
  width: 20px;
  height: 20px;

  position: relative;
  z-index: 1;
  transition: transform 0.2s;

  ${props =>
    props.hovered &&
    css`
      z-index: 2;
      transform: scale(1.4);
    `}
`;

const Marker = ({ text, color, $hover }) => (
  <MarkerPinWrapper hovered={$hover === true}>
    <MarkerPinIcon color={color} />
  </MarkerPinWrapper>
);

const GoogleMapWrapper = styled.div`
  width: 100%;
  height: 100vh;
`;

class App extends Component {
  render() {
    return (
      <div className="App">
        <GoogleMapWrapper>
          <GoogleMap defaultZoom={14} defaultCenter={defaultCenter}>
            {markers.map(marker => (
              <Marker
                key={marker.id}
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
