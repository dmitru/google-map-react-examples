import { Point } from "./types";

export function distanceToMouse(point: Point, mousePoint: Point) {
  const { x: mouseX, y: mouseY } = mousePoint;
  const { x, y } = point;
  return Math.sqrt((x - mouseX) * (x - mouseX) + (y - mouseY) * (y - mouseY));
}
