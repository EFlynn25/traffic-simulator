import { Point } from './types'

export function calculateDistanceBetweenPoints(p0: Point, p1: Point) {
  var a = p0.x - p1.x;
  var b = p0.y - p1.y;
	return Math.sqrt( a*a + b*b );
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
