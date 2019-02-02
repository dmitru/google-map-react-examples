import styled, { css } from "styled-components";
import { MarkerInfo } from "../types";
import { MapChildProps } from "./map";

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

export interface ClusterMarkerProps extends MapChildProps {
  points: MarkerInfo[];
  hovered: boolean;
}

export const ClusterMarker = ({ points, hovered }: ClusterMarkerProps) => (
  <ClusterMarkerIcon count={points.length} hovered={hovered}>
    {points.length}
  </ClusterMarkerIcon>
);
