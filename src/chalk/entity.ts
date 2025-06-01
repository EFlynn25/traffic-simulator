import { Path, PathGroup, Point } from './types'
import { calculateDistanceBetweenPoints, convertPathToScreenPosition, getSegmentLengths } from './utils'

export class Entity {
  private entityId: number
  private distancePerStep: number
  private distanceBetweenEntities: number
  private pathPosition: number
  private paths: PathGroup
  private pathId: string

  constructor(paths: PathGroup, pathId: string, distancePerStep: number, distanceBetweenEntities: number) {
    this.entityId = Math.floor(Math.random() * 1000)
    this.distancePerStep = distancePerStep
    this.distanceBetweenEntities = distanceBetweenEntities
    this.pathPosition = 0
    this.paths = paths
    this.pathId = pathId
  }

  getPathPosition(): number {
    return this.pathPosition
  }

  getPath(pathId?: string): Path {
    return this.paths.find((path) => path.id === (pathId ?? this.pathId))!
  }

  getScreenPosition(pathPosition?: number, pathId?: string): Point {
    return convertPathToScreenPosition(pathPosition ?? this.pathPosition, this.getPath(pathId))
  }

  calculateTrajectory(startPoint: Point, endPoint: Point): [Point, Point] {
    const trajectoryLength = this.distanceBetweenEntities
    const difference = { x: endPoint.x - startPoint.x, y: endPoint.y - startPoint.y }
    const differenceLength = calculateDistanceBetweenPoints(startPoint, endPoint)
    const normalizedDifference = {
      x: (difference.x * trajectoryLength) / differenceLength,
      y: (difference.y * trajectoryLength) / differenceLength,
    }
    const newEndPoint = { x: startPoint.x + normalizedDifference.x, y: startPoint.y + normalizedDifference.y }
    return [startPoint, newEndPoint]
  }

  getNextStep(incrementBy?: number): { pathId: string; pathPosition: number; trajectory: [Point, Point] } | false {
    let newPathPosition = this.pathPosition + (incrementBy ?? this.distancePerStep)
    let newPathId = this.pathId

    // Read locations
    const currentPath = this.getPath()
    let closestStop: number | undefined
    currentPath.locations?.forEach((location) => {
      const locationPathPosition = location.getPathPosition()
      const radius = location.getRadius()
      if (this.pathPosition >= locationPathPosition - radius && this.pathPosition <= locationPathPosition) {
        const go = location.getState(this).go
        if (!go) {
          const stopAt = location.getPathPosition()
          closestStop = closestStop ? Math.min(closestStop, stopAt) : stopAt
        }
      }
    })
    if (closestStop && closestStop >= 0) {
      if (newPathPosition > closestStop) {
        newPathPosition = closestStop
      }
      const oldScreenPos = this.getScreenPosition(this.pathPosition, this.pathId)
      const newScreenPos = this.getScreenPosition(newPathPosition, newPathId)
      const trajectory = this.calculateTrajectory(oldScreenPos, newScreenPos)
      return { pathId: newPathId, pathPosition: newPathPosition, trajectory }
    }

    // Get new path index, if necessary
    const currentPathLength = getSegmentLengths(this.getPath()).reduce((acc, curr) => acc + curr, 0)
    const pathIds = this.paths.map((path) => path.id)
    while (newPathPosition > currentPathLength) {
      newPathPosition = newPathPosition - currentPathLength
      // Find all paths in path group that start where the current one ends
      const currentPathLastPoint = this.getPath(newPathId).segments.at(-1)?.at(-1)
      let possibleNewPathIds: string[] = []
      for (let i = 0; i < pathIds.length; i++) {
        const id = pathIds[i]
        if (id === newPathId) continue
        const firstPoint = this.getPath(id).segments[0][0]
        if (firstPoint.x === currentPathLastPoint?.x && firstPoint.y === currentPathLastPoint?.y) {
          possibleNewPathIds.push(id)
        }
      }
      // If no paths are found, return false to unmount
      if (!possibleNewPathIds.length) return false
      newPathId = possibleNewPathIds[Math.floor(Math.random() * possibleNewPathIds.length)]
    }

    // Calculate trajectory
    const oldScreenPos = this.getScreenPosition(this.pathPosition, this.pathId)
    const newScreenPos = this.getScreenPosition(newPathPosition, newPathId)
    const trajectory = this.calculateTrajectory(oldScreenPos, newScreenPos)

    return { pathId: newPathId, pathPosition: newPathPosition, trajectory }
  }

  step(entities: Entity[]): boolean {
    const nextStep = this.getNextStep()
    if (nextStep === false) return false
    let newPathPosition = nextStep.pathPosition
    const newPathId = nextStep.pathId

    // Detect same-path collisions
    let closestPathPosition: number | undefined
    entities
      .filter(
        (entity) =>
          entity !== this &&
          entity.getPath().id === this.getPath().id && // Same path
          entity.getPathPosition() > this.getPathPosition() // Other entity is ahead of me
      )
      .forEach((entity) => {
        closestPathPosition =
          closestPathPosition !== undefined
            ? Math.min(closestPathPosition, entity.getPathPosition())
            : entity.getPathPosition()
      })
    // ...is the next distance too close?
    if (closestPathPosition !== undefined && closestPathPosition - newPathPosition < this.distanceBetweenEntities) {
      this.pathPosition = Math.max(closestPathPosition - this.distanceBetweenEntities, this.getPathPosition())
      return true
    }

    // Detect different path collisions
    const myNext2Steps = [
      this.getNextStep(this.distanceBetweenEntities),
      this.getNextStep(this.distanceBetweenEntities * 2),
    ]
    const myNext2Positions = myNext2Steps
      .map((step) => (step === false ? false : this.getScreenPosition(step.pathPosition, step.pathId)))
      .filter((myPos) => myPos !== false)
    const otherEntities = entities.filter((entity) => entity !== this && entity.getPath().id !== this.getPath().id)
    for (let i = 0; i < otherEntities.length; i++) {
      const entity = otherEntities[i]

      // const distance = calculateDistanceBetweenPoints(this.getScreenPosition(), entity.getScreenPosition())
      // if (distance > 4 * this.distancePerStep + this.distanceBetweenEntities) continue

      const entityNext2Steps = [
        entity.getNextStep(this.distanceBetweenEntities),
        entity.getNextStep(this.distanceBetweenEntities * 2),
      ]
      const entityNext2Positions = entityNext2Steps
        .map((step) => (step === false ? false : entity.getScreenPosition(step.pathPosition, step.pathId)))
        .filter((myPos) => myPos !== false)

      // Calculate the distances between the positions of my next 2 steps and their 2 steps
      const distances = myNext2Positions
        .flatMap((myPos) =>
          entityNext2Positions.map((theirPos) => ({
            distance: calculateDistanceBetweenPoints(myPos, theirPos),
            positions: [myPos, theirPos],
          }))
        )
        .filter((distance) => distance.distance < this.distanceBetweenEntities)
        .sort((a, b) => a.distance - b.distance)

      if (!distances.length) continue

      // Find the common point between the 2 shortest distances
      let intersectionPoint: Point | undefined
      if (distances[0]?.distance === 0) {
        // There is a definite intersection point
        intersectionPoint = distances[0].positions[0]
      } else {
        // Estimate the intersection point from the two smallest distances
        intersectionPoint = distances[0]?.positions.find((pos1) =>
          distances[1]?.positions.find((pos2) => pos1.x === pos2.x && pos1.y === pos2.y)
        )
      }

      if (!intersectionPoint) continue

      // If the other entity is closer, don't move
      const myDistanceFromIntersection = calculateDistanceBetweenPoints(this.getScreenPosition(), intersectionPoint)
      const theirDistanceFromIntersection = calculateDistanceBetweenPoints(
        entity.getScreenPosition(),
        intersectionPoint
      )
      if (theirDistanceFromIntersection < myDistanceFromIntersection) return true
    }

    this.pathPosition = newPathPosition
    this.pathId = newPathId
    return true
  }
}
