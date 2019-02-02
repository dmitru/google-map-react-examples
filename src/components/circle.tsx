import styled from "styled-components";
import { MapChildProps } from "./map";

export interface CircleProps extends MapChildProps {
  size: number;
}

export const Circle = styled("div")<CircleProps>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;

  background: ${props => props.color || "rgba(255, 0, 0, 0.3)"};
  border-radius: 100%;
  transition: all 0.3s;

  z-index: 0;
  transform-origin: 0% 0%;
  transform: translate(-50%, -50%);
`;
