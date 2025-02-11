import { Path, PathGroup, Point } from './types'
import { calculateDistanceBetweenPoints, convertPathToScreenPosition, getSegmentLengths } from './utils.ts'

export class Entity {
  private entityId: number
  private distancePerStep: number
  private distanceBetweenEntities: number
  private pathPosition: number
  private paths: PathGroup
  private pathIndex: number

  constructor(paths: PathGroup, pathIndex: number, distancePerStep: number, distanceBetweenEntities: number) {
    this.entityId = Math.floor(Math.random() * 1000)
    console.log(`[${this.entityId}] spawned`)
    this.distancePerStep = distancePerStep
    this.distanceBetweenEntities = distanceBetweenEntities
    this.pathPosition = 0
    this.paths = paths
    this.pathIndex = pathIndex
  }

  getPathPosition(): number {
    return this.pathPosition
  }

  getPath(pathIndex?: number): Path {
    return this.paths[pathIndex ?? this.pathIndex]
  }

  getScreenPosition(pathPosition?: number, pathIndex?: number): Point {
    return convertPathToScreenPosition(pathPosition ?? this.pathPosition, this.getPath(pathIndex))
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

  getNextStep(incrementBy?: number): { pathIndex: number; pathPosition: number; trajectory: [Point, Point] } | false {
    let newPathPosition = this.pathPosition + (incrementBy ?? this.distancePerStep)
    let newPathIndex = this.pathIndex

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
      const oldScreenPos = this.getScreenPosition(this.pathPosition, this.pathIndex)
      const newScreenPos = this.getScreenPosition(newPathPosition, newPathIndex)
      const trajectory = this.calculateTrajectory(oldScreenPos, newScreenPos)
      return { pathIndex: newPathIndex, pathPosition: newPathPosition, trajectory }
    }

    // Get new path index, if necessary
    const currentPathLength = getSegmentLengths(this.getPath()).reduce((acc, curr) => acc + curr, 0)
    while (newPathPosition > currentPathLength) {
      newPathPosition = newPathPosition - currentPathLength
      // Find all paths in path group that start where the current one ends
      const currentPathLastPoint = this.getPath(newPathIndex).segments.at(-1)?.at(-1)
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

    // Calculate trajectory
    const oldScreenPos = this.getScreenPosition(this.pathPosition, this.pathIndex)
    const newScreenPos = this.getScreenPosition(newPathPosition, newPathIndex)
    const trajectory = this.calculateTrajectory(oldScreenPos, newScreenPos)

    return { pathIndex: newPathIndex, pathPosition: newPathPosition, trajectory }
  }

  step(entities: Entity[]): boolean {
    const nextStep = this.getNextStep()
    if (nextStep === false) return false
    let newPathPosition = nextStep.pathPosition
    const newPathIndex = nextStep.pathIndex

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
    const myNext2Positions = myNext2Steps.map((step) =>
      step === false ? false : this.getScreenPosition(step.pathPosition, step.pathIndex)
    )
    const otherEntities = entities.filter((entity) => entity !== this && entity.getPath().id !== this.getPath().id)
    for (let i = 0; i < otherEntities.length; i++) {
      const entity = otherEntities[i]

      const entityNext2Steps = [
        entity.getNextStep(this.distanceBetweenEntities),
        entity.getNextStep(this.distanceBetweenEntities * 2),
      ]
      const entityNext2Positions = entityNext2Steps.map((step) =>
        step === false ? false : entity.getScreenPosition(step.pathPosition, step.pathIndex)
      )

      // Calculate the distances between the positions of my next 2 steps and their 2 steps
      const distances = myNext2Positions
        .filter((myPos) => myPos !== false)
        .flatMap((myPos) =>
          entityNext2Positions
            .filter((myPos) => myPos !== false)
            .map((theirPos) => ({
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
    this.pathIndex = newPathIndex
    return true
  }
}
