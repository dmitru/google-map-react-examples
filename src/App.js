import React, { Component } from "react";
import GoogleMap from "google-map-react";
import styled from "styled-components";
import "./App.css";

const GoogleMapWrapper = styled.div`
  width: 500px;
  height: 300px;
`;

class App extends Component {
  render() {
    return (
      <div className="App">
        <GoogleMapWrapper>
          <GoogleMap defaultZoom={11} defaultCenter={{ lat: 10, lng: 10 }} />
        </GoogleMapWrapper>
      </div>
    );
  }
}

export default App;
