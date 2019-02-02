import styled from "styled-components";

export const Tooltip = styled("div")<{ show: boolean; pinned: boolean }>`
  width: 200px;
  background: white;
  padding: 10px;

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
