import { Path, PathGroup, PathSegment, Point } from './types'
import { calculateBezierLength, calculateDistanceBetweenPoints } from './utils.ts'

export class Entity {
  private entityId: number
  private distancePerStep: number
  private distanceBetweenEntities: number
  private pathPosition: number
  private paths: PathGroup
  private pathIndex: number

  constructor(paths: PathGroup, distancePerStep: number, distanceBetweenEntities: number) {
    this.entityId = Math.floor(Math.random() * 1000)
    console.log(`[${this.entityId}] spawned`)
    this.distancePerStep = distancePerStep
    this.distanceBetweenEntities = distanceBetweenEntities
    this.pathPosition = 0
    this.paths = paths
    this.pathIndex = 0
  }

  getPathPosition(): number {
    return this.pathPosition
  }

  getSegments(pathIndex?: number): PathSegment[] {
    return this.paths[pathIndex ?? this.pathIndex].segments
  }

  getSegmentLengths(pathIndex?: number): number[] {
    return this.getSegments(pathIndex).map((segment) =>
      segment.length === 2
        ? calculateDistanceBetweenPoints(segment[0], segment[1])
        : calculateBezierLength(segment[0], segment[1], segment[2])
    )
  }

  getCurrentPathLength(): number {
    return this.getSegmentLengths().reduce((acc, curr) => acc + curr, 0)
  }

  getScreenPosition(pathPosition?: number, pathIndex?: number): Point {
    const currentSegments = this.getSegments(pathIndex)
    const segmentLengths = this.getSegmentLengths(pathIndex)
    let currentSegmentPosition = pathPosition ?? this.pathPosition
    let currentSegment: PathSegment | undefined
    let currentSegmentLength: number | undefined
    for (let i = 0; i < segmentLengths.length; i++) {
      const segmentLength = segmentLengths[i]
      if (currentSegmentPosition > segmentLength) {
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

  getNextStep(): { pathIndex: number; pathPosition: number } | false {
    let newPathPosition = this.pathPosition + this.distancePerStep
    let newPathIndex = this.pathIndex

    // Get new path index, if necessary
    while (newPathPosition > this.getCurrentPathLength()) {
      newPathPosition = newPathPosition - this.getCurrentPathLength()
      // Find all paths in path group that start where the current one ends
      const currentPathLastPoint = this.getSegments(newPathIndex).at(-1)?.at(-1)
      let possibleNewPathIndexes: number[] = []
      for (let i = 0; i < this.paths.length; i++) {
        if (i === newPathIndex) continue
        const firstPoint = this.paths[i].segments[0][0]
        if (firstPoint.x === currentPathLastPoint?.x && firstPoint.y === currentPathLastPoint?.y) {
          possibleNewPathIndexes.push(i)
        }
      }
      // If no paths are found, return false to unmount
      if (!possibleNewPathIndexes.length) return false
      newPathIndex = possibleNewPathIndexes[Math.floor(Math.random() * possibleNewPathIndexes.length)]
    }

    // Read locations
    const currentPath = this.paths[this.pathIndex]
    let closestStop: number | undefined
    currentPath.locations?.forEach((location) => {
      const locationPathPosition = location.getPathPosition()
      const radius = location.getRadius()
      if (this.pathPosition >= locationPathPosition - radius && this.pathPosition <= locationPathPosition) {
        const stopAt = location.getState().stopAt
        if (stopAt && typeof stopAt === 'number') {
          closestStop = closestStop ? Math.min(closestStop, stopAt) : stopAt
        }
      }
    })
    if (closestStop && closestStop >= 0) {
      if (newPathPosition > closestStop) {
        newPathPosition = closestStop
      }
      return { pathIndex: newPathIndex, pathPosition: newPathPosition }
    }

    return { pathIndex: newPathIndex, pathPosition: newPathPosition }
  }

  step(entities: Entity[]): boolean {
    console.log(`[${this.entityId}] step`, this.pathPosition, this.pathIndex, this.getCurrentPathLength())
    const nextStep = this.getNextStep()
    if (nextStep === false) return false
    let newPathPosition = nextStep.pathPosition
    const newPathIndex = nextStep.pathIndex

    // Prevent collisions
    let closestEntityDistance: number | undefined
    let nextClosestEntityDistance: number | undefined
    entities
      .filter((entity) => entity !== this)
      .forEach((entity) => {
        const entityScreenPosition = entity.getScreenPosition()
        const distance = calculateDistanceBetweenPoints(entityScreenPosition, this.getScreenPosition())
        const nextDistance = calculateDistanceBetweenPoints(
          entityScreenPosition,
          this.getScreenPosition(newPathPosition, newPathIndex)
        )
        closestEntityDistance = closestEntityDistance ? Math.min(closestEntityDistance, distance) : distance
        nextClosestEntityDistance = nextClosestEntityDistance
          ? Math.min(nextClosestEntityDistance, nextDistance)
          : nextDistance
      })
    if (nextClosestEntityDistance !== undefined && nextClosestEntityDistance < this.distanceBetweenEntities) {
      this.pathPosition += closestEntityDistance! - this.distanceBetweenEntities
      return true
    }

    this.pathPosition = newPathPosition
    this.pathIndex = newPathIndex
    return true
  }
}
