import { Location } from './location.ts'
export type Point = { x: number; y: number }
export type Line = [Point, Point]
export type BezierCurve = [Point, Point, Point]
export type PathSegment = Line | BezierCurve
export type Path = { id: string; segments: PathSegment[]; locations?: Location[] }
export type PathGroup = Path[]
export type LocationGroup = Location[]
