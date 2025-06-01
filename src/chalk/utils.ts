import { Line, Path, PathSegment, Point } from './types'

export function calculateDistanceBetweenPoints(p0: Point, p1: Point) {
  var a = p0.x - p1.x
  var b = p0.y - p1.y
  return Math.sqrt(a * a + b * b)
}

export function calculateBezierLength(p0: Point, p1: Point, p2: Point) {
  var ax = p0.x - 2 * p1.x + p2.x
  var ay = p0.y - 2 * p1.y + p2.y
  var bx = 2 * p1.x - 2 * p0.x
  var by = 2 * p1.y - 2 * p0.y
  var A = 4 * (ax * ax + ay * ay)
  var B = 4 * (ax * bx + ay * by)
  var C = bx * bx + by * by

  var Sabc = 2 * Math.sqrt(A + B + C)
  var A_2 = Math.sqrt(A)
  var A_32 = 2 * A * A_2
  var C_2 = 2 * Math.sqrt(C)
  var BA = B / A_2

  return (
    (A_32 * Sabc + A_2 * B * (Sabc - C_2) + (4 * C * A - B * B) * Math.log((2 * A_2 + BA + Sabc) / (BA + C_2))) /
    (4 * A_32)
  )
}

export function getSegmentLengths(path: Path) {
  return path.segments.map((segment) =>
    segment.length === 2
      ? calculateDistanceBetweenPoints(segment[0], segment[1])
      : calculateBezierLength(segment[0], segment[1], segment[2])
  )
}

export function convertPathToScreenPosition(pathPosition: number, path: Path): Point {
  const currentSegments = path.segments
  const segmentLengths = getSegmentLengths(path)
  let currentSegmentPosition = pathPosition ?? this.pathPosition
  let currentSegment: PathSegment | undefined
  let currentSegmentLength: number | undefined
  for (let i = 0; i < segmentLengths.length; i++) {
    const segmentLength = segmentLengths[i]
    if (Math.round(currentSegmentPosition) > Math.round(segmentLength)) {
      currentSegmentPosition -= segmentLength
    } else {
      currentSegment = currentSegments[i]
      currentSegmentLength = segmentLengths[i]
      break
    }
  }
  if (!currentSegment || !currentSegmentLength) throw new Error("Current segment doesn't exist!")
  const t = currentSegmentPosition / currentSegmentLength
  return currentSegment.length === 2
    ? {
        x: currentSegment[0].x + t * (currentSegment[1].x - currentSegment[0].x),
        y: currentSegment[0].y + t * (currentSegment[1].y - currentSegment[0].y),
      }
    : {
        x:
          Math.pow(1 - t, 2) * currentSegment[0].x +
          2 * (1 - t) * t * currentSegment[1].x +
          Math.pow(t, 2) * currentSegment[2].x,
        y:
          Math.pow(1 - t, 2) * currentSegment[0].y +
          2 * (1 - t) * t * currentSegment[1].y +
          Math.pow(t, 2) * currentSegment[2].y,
      }
}

export function detectSegmentsCollision(s1: Line, s2: Line) {
  const ccw = (A: Point, B: Point, C: Point) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)

  const A = s1[0]
  const B = s1[1]
  const C = s2[0]
  const D = s2[1]
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D)
}
