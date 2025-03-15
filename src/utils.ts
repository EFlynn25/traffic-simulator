import { ChalkProps } from './chalk'
import { Location } from './chalk/location'
import { PathGroup, Point } from './chalk/types'
import { Configuration, IntersectionObject } from './types'

// export function verifyConfig...?
// All i must be before lsr
// b must be at start, at end, or in between i and lsr
// l cannot have a non-l lane in between
// r cannot have a non-r lane in between
// i must correspond to opposite direction s
// b must correspond to opposite direction b or l/r
// l or r count must be greater than or equal to i count on final lane

const directionIds = ['e', 'n', 'w', 's'] as const

export function convertConfigToChalk(
  configuration: Configuration
): Required<Pick<ChalkProps, 'pathGroups' | 'spawningPathIds'>> {
  console.log(configuration)

  // Create chalk paths
  let pathGroup = []
  configuration.objects.forEach((object) => {
    if (object.type === 'intersection') {
      object.directions.forEach((direction, directionIndex) => {
        const directionId = directionIds[directionIndex]
        const isHorizontal = directionId === 'e' || directionId === 'w'
        for (let i = 0; i < direction.assignments.length; i++) {
          const assignment = direction.assignments[i]
          if (assignment === 'b') continue
          const id = `${object.id}${directionId}${i}`

          let xStartAddition = isHorizontal ? direction.length : 0
          let yStartAddition = isHorizontal ? 0 : direction.length
          let xEndAddition = 0
          let yEndAddition = 0

          if (assignment === 'i') {
            if (isHorizontal) {
              xEndAddition = xStartAddition
              xStartAddition = 0
            } else {
              yEndAddition = yStartAddition
              yStartAddition = 0
            }
          }

          // Leading path
          const initialStartPoint = getIntersectionLaneStartPoint(configuration, object.id, directionIndex, i, [
            xStartAddition,
            yStartAddition,
          ])

          const initialEndPoint = getIntersectionLaneStartPoint(configuration, object.id, directionIndex, i, [
            xEndAddition,
            yEndAddition,
          ])

          pathGroup.push({
            id,
            segments: [[initialStartPoint, initialEndPoint]],
            locations: assignment !== 'i' ? [new Location(`${directionIndex}${id}`, direction.length, 1)] : [],
          })

          // Through path
          if (assignment !== 'i') {
            assignment.split('').forEach((route: 'l' | 's' | 'r') => {
              const finalPaths = getFinalPaths('i0', directionIndex, i, route, configuration)
              const finalStartPoint = getIntersectionLaneStartPoint(
                configuration,
                object.id,
                finalPaths.directionIndex,
                finalPaths.assignmentIndex
              )

              if (route === 's') {
                pathGroup.push({
                  id: `${id}${route}`,
                  segments: [[initialEndPoint, finalStartPoint]],
                })
              } else if (route === 'l' || route === 'r') {
                const controlX = isHorizontal ? finalStartPoint.x : initialEndPoint.x
                const controlY = isHorizontal ? initialEndPoint.y : finalStartPoint.y

                pathGroup.push({
                  id: `${id}${route}`,
                  segments: [[initialEndPoint, { x: controlX, y: controlY }, finalStartPoint]],
                })
              }
            })
          }
        }
      })
    } else if (object.type === 'road') {
      // ...
    }
  })

  // Get all paths that don't start where another path ends
  const spawningPathIds = pathGroup
    .filter((p1) =>
      pathGroup.every((p2) => {
        if (p1.id === p2.id) return true
        const p1Start = p1.segments[0][0]
        const p2End = p2.segments.at(-1).at(-1)
        return p1Start.x !== p2End.x || p1Start.y !== p2End.y
      })
    )
    .map((path) => path.id)

  return { pathGroups: [pathGroup], spawningPathIds }
}

export function getIntersectionLaneStartPoint(
  configuration: Configuration,
  intersectionId: IntersectionObject['id'],
  directionIndex: number,
  assignmentIndex: number,
  addition: [number, number] = [0, 0]
): Point | null {
  const intersection = configuration.objects.find((object) => object.id === intersectionId)
  if (intersection.type !== 'intersection') return null
  const horizontalLanes = intersection.directions[0].assignments.length
  const verticalLanes = intersection.directions[1].assignments.length
  const directionId = directionIds[directionIndex]
  const isHorizontal = directionId === 'e' || directionId === 'w'
  const xMultiplier = directionId === 'n' || directionId === 'w' ? -1 : 1
  const yMultiplier = directionId === 'w' || directionId === 's' ? -1 : 1
  const parallelStart =
    (((isHorizontal ? verticalLanes : horizontalLanes) + 1) / 2) * configuration.distanceBetweenLanes
  const perpendicularStart =
    (((isHorizontal ? horizontalLanes : verticalLanes) - 1) / -2) * configuration.distanceBetweenLanes
  let xBase = isHorizontal ? parallelStart : perpendicularStart
  let yBase = isHorizontal ? perpendicularStart : parallelStart
  let xIncrement = isHorizontal ? 0 : assignmentIndex * configuration.distanceBetweenLanes
  let yIncrement = isHorizontal ? assignmentIndex * configuration.distanceBetweenLanes : 0
  return {
    x: xMultiplier * (xBase + xIncrement + addition[0]) + intersection.location.x,
    y: yMultiplier * (yBase + yIncrement + addition[1]) + intersection.location.y,
  }
}

function getFinalPaths(
  intersectionId: string,
  startDirectionIndex: number,
  startAssignmentIndex: number,
  route: 'l' | 's' | 'r',
  configuration: Configuration
): { directionIndex: number; assignmentIndex: number } | null {
  // Find intersection
  const object = configuration.objects.find((object) => object.id === intersectionId)
  if (!object || object.type !== 'intersection') return null

  // Find start assignment
  const startDirectionAssignments = object.directions[startDirectionIndex].assignments
  const startAssignment = startDirectionAssignments[startAssignmentIndex]
  if (startAssignment === 'i' || startAssignment === 'b') return null

  // Calculate final paths
  if (route === 'l') {
    // Left
    const finalDirectionIndex = (startDirectionIndex + 3) % 4
    const finalDirectionAssignments = object.directions[finalDirectionIndex].assignments

    // Count l before
    let leftsBefore = 0
    for (let i = 0; i < startAssignmentIndex; i++) {
      if (startDirectionAssignments[i].includes('l')) leftsBefore++
    }

    // Count i
    let iCount = 0
    for (let i = finalDirectionAssignments.length - 1; i >= 0; i--) {
      if (!finalDirectionAssignments[i].includes('i')) continue
      if (iCount === leftsBefore) return { directionIndex: finalDirectionIndex, assignmentIndex: i }
      iCount++
    }
  } else if (route === 's') {
    // Straight
    const finalDirectionIndex = (startDirectionIndex + 2) % 4
    const finalAssignmentIndex = startDirectionAssignments.length - startAssignmentIndex - 1
    return { directionIndex: finalDirectionIndex, assignmentIndex: finalAssignmentIndex }
  } else if (route === 'r') {
    // Right
    const finalDirectionIndex = (startDirectionIndex + 1) % 4
    const finalDirectionAssignments = object.directions[finalDirectionIndex].assignments

    // Count l before
    let rightsAfter = 0
    for (let i = startAssignmentIndex + 1; i < startDirectionAssignments.length; i++) {
      if (startDirectionAssignments[i].includes('r')) rightsAfter++
    }

    // Count i
    let iCount = 0
    for (let i = 0; i < finalDirectionAssignments.length; i++) {
      if (!finalDirectionAssignments[i].includes('i')) continue
      if (iCount === rightsAfter) return { directionIndex: finalDirectionIndex, assignmentIndex: i }
      iCount++
    }
  }

  return null
}
