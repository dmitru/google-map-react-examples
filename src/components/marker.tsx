import React from "react";
import styled, { css } from "styled-components";
import { lighten } from "polished";

// @ts-ignore
import { Tooltip as TooltipTippy } from "react-tippy";
import "react-tippy/dist/tippy.css";

import { MapChildProps } from "./map";

export interface RenderTooltipProps {
  id: string;
  data: any;
  selected?: boolean;
}

export interface MarkerProps extends MapChildProps {
  innerRef?: any;
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

export interface MarkerPinIconProps {
  color: string;
  hovered: boolean;
  label?: string;
}

export const MarkerPinIcon: React.SFC<MarkerPinIconProps> = ({
  color,
  hovered
}) => (
  <svg version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 365 560">
    <g>
      <path
        fill={hovered ? lighten(0.3, color) : color}
        d={`M 182.9 551.7 C 182.9 551.8000000000001 183.1 552 183.1 552 C 183.1 552 358.3 283 358.3 194.6 C 358.3 64.5 269.5 7.900000000000006 182.9 7.699999999999989 C 96.3 7.9 7.5 64.5 7.5 194.6 C 7.5 283 182.8 552 182.8 552 L 182.9 551.7 Z`}
      />
    </g>
  </svg>
);

export const MarkerPinWithHoleIcon: React.SFC<MarkerPinIconProps> = ({
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

export const MarkerLabel = styled.span`
  position: relative;
  top: -30px;
  font-size: 8px;
  color: white;
`;

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

export const Marker: React.SFC<MarkerProps> = ({
  lat,
  lng,
  id,
  innerRef,
  data = {},
  size = 20,
  dragging,
  hovered,
  selected,
  PinIcon,
  renderTooltip,
  children,
  ...otherProps
}) => {
  const PinIconOrDefault = PinIcon || MarkerPinIcon;
  // @ts-ignore
  const dimensions = otherProps.$getDimensions(otherProps.$dimensionKey);

  const marker = (
    <div ref={innerRef}>
      <MarkerPinWrapper size={size} scaleUp={hovered || dragging || false}>
        <PinIconOrDefault
          color={data.color}
          hovered={hovered || dragging || false}
        />
        {children}
      </MarkerPinWrapper>
    </div>
  );

  if (!renderTooltip) {
    return marker;
  }

  return (
    <TooltipTippy
      key={`${dimensions.x}:${dimensions.y}`}
      arrow
      multiple
      distance={30}
      open={selected || hovered ? true : false}
      interactive
      theme="light"
      html={renderTooltip({
        id,
        data,
        selected
      })}
    >
      {marker}
    </TooltipTippy>
  );
};
