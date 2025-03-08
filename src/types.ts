import { Point } from './chalk/types'

export type Configuration = {
  distanceBetweenLanes?: number
  objects: (IntersectionObject | RoadObject)[]
  // spawnPoints?: string[]
}

export type Assignment = ('i' | 'b' | 'l' | 's' | 'r' | 'ls' | 'sr' | 'lr' | 'lsr')

export type IntersectionObject = {
  type: 'intersection'
  id: `i${number}`
  location: Point
  // E, N, W, S
  directions: [IntersectionDirection, IntersectionDirection, IntersectionDirection, IntersectionDirection]
}

type IntersectionDirection = { assignments: Assignment[]; length: number }

type RoadObject = {
  type: 'road'
  id: string
  start: RoadDirection
  end: RoadDirection
}

type RoadDirection = { assignments: Assignment[]; location: Point }
