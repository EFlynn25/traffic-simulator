import { Chalk } from './chalk'
import { Point } from './chalk/types'
import { convertPathToScreenPosition } from './chalk/utils.ts'
import { getCarPos } from './functions'

export const pixelsPerSimUnit = 10
const simToScreen = (point: Point) => {
  const centerX = (window.innerWidth - 300) / 2
  const centerY = window.innerHeight / 2
  return { x: centerX + point.x * pixelsPerSimUnit, y: centerY + -point.y * pixelsPerSimUnit }
}

export function render(canvas: HTMLCanvasElement, chalk: Chalk) {
  console.log('Rendering...')
  const context = canvas?.getContext('2d')
  if (!context) return

  // Scale canvas for clarity
  context.scale(window.devicePixelRatio, window.devicePixelRatio)

  // Clear canvas
  context.beginPath()
  context.clearRect(0, 0, canvas.width, canvas.height)

  // Render paths
  const pathGroups = chalk.getPathGroups()
  const allPathSegments = pathGroups.flatMap((group) => group.flatMap((path) => path.segments))
  context.strokeStyle = 'black'
  context.lineWidth = 5
  allPathSegments.forEach((segment) => {
    if (segment.length === 2) {
      // Straight line
      const firstScreenPos = simToScreen(segment[0])
      const lastScreenPos = simToScreen(segment[1])
      context.beginPath()
      context.moveTo(firstScreenPos.x, firstScreenPos.y)
      context.lineTo(lastScreenPos.x, lastScreenPos.y)
      context.stroke()
    } else {
      // Bezier curve
      const firstScreenPos = simToScreen(segment[0])
      const controlScreenPos = simToScreen(segment[1])
      const lastScreenPos = simToScreen(segment[2])
      context.beginPath()
      context.moveTo(firstScreenPos.x, firstScreenPos.y)
      context.quadraticCurveTo(controlScreenPos.x, controlScreenPos.y, lastScreenPos.x, lastScreenPos.y)
      context.stroke()
    }
  })

  // Render locations
  pathGroups.forEach((group) =>
    group.forEach((path) =>
      path.locations?.forEach((location) => {
        const go = location.getState().go
        context.fillStyle = !go ? 'red' : 'green'
        context.strokeStyle = !go ? '#a00' : '#0a0'
        const screenPos = simToScreen(convertPathToScreenPosition(location.getPathPosition(), path))
        const screenPosRadius = simToScreen(
          convertPathToScreenPosition(location.getPathPosition() - location.getRadius(), path)
        )
        context.beginPath()
        context.moveTo(screenPos.x, screenPos.y)
        context.lineTo(screenPosRadius.x, screenPosRadius.y)
        context.stroke()
        context.beginPath()
        context.arc(screenPos.x, screenPos.y, 4, 0, 2 * Math.PI)
        context.fill()
      })
    )
  )

  // Render entities
  const entityScreenPositions = chalk.getEntities().map((entity) => entity.getScreenPosition())
  context.fillStyle = 'white'
  entityScreenPositions.forEach((simPos) => {
    const screenPos = simToScreen(simPos)
    context.beginPath()
    context.arc(screenPos.x, screenPos.y, 4, 0, 2 * Math.PI)
    context.fill()
  })

  // Reset canvas scaling
  context.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio)
}

// Simulation coordinate scale... 1 V lane per x, and 1 H lane per y
export const pixelsPerSimUnitOld = 30
export const simToScreenOld = (x: number, y: number) => {
  const centerX = (window.innerWidth - 300) / 2
  const centerY = window.innerHeight / 2
  return [centerX + x * pixelsPerSimUnitOld, centerY + y * pixelsPerSimUnitOld]
}

export function renderOld(currentStep, streets, lanes, cars, canvas, showStats) {
  console.log('Rendering...')
  const context = canvas.getContext('2d')
  const markingWidth = pixelsPerSimUnitOld / 7.5

  // Scale canvas for clarity
  context.scale(window.devicePixelRatio, window.devicePixelRatio)

  // Clear canvas
  context.beginPath()
  context.clearRect(0, 0, canvas.width, canvas.height)

  // Draw title and stats
  context.fillStyle = 'white'
  context.font = 'bold 16px Montserrat'
  context.textBaseline = 'top'
  context.fillText('Flynn Traffic Simulator', 10, 10)
  if (showStats) {
    context.fillText('Step: ' + currentStep.toString(), 10, 30)
    context.fillText('Cars: ' + cars.length.toString(), 10, 50)
  }

  // Draw streets
  const intersectionWidth = Math.max(streets[0].assignments.length, streets[2].assignments.length)
  const intersectionHeight = Math.max(streets[1].assignments.length, streets[3].assignments.length)
  const topLeftAnchor = simToScreenOld(-intersectionWidth / 2, -intersectionHeight / 2)
  const topRightAnchor = simToScreenOld(intersectionWidth / 2, -intersectionHeight / 2)
  const bottomLeftAnchor = simToScreenOld(-intersectionWidth / 2, intersectionHeight / 2)
  context.fillStyle = 'hsl(220deg 5% 12%)'
  context.beginPath()
  context.rect(0, topLeftAnchor[1], window.innerWidth, intersectionHeight * pixelsPerSimUnitOld)
  context.fill()
  context.beginPath()
  context.rect(topLeftAnchor[0], 0, intersectionWidth * pixelsPerSimUnitOld, window.innerHeight)
  context.fill()

  context.fillStyle = 'white'
  context.beginPath()
  context.rect(topLeftAnchor[0], topLeftAnchor[1] - markingWidth, intersectionWidth * pixelsPerSimUnitOld, markingWidth)
  context.fill()
  context.beginPath()
  context.rect(topRightAnchor[0], topRightAnchor[1], markingWidth, intersectionHeight * pixelsPerSimUnitOld)
  context.fill()
  context.beginPath()
  context.rect(bottomLeftAnchor[0], bottomLeftAnchor[1], intersectionWidth * pixelsPerSimUnitOld, markingWidth)
  context.fill()
  context.beginPath()
  context.rect(
    topLeftAnchor[0] - markingWidth,
    topLeftAnchor[1],
    markingWidth,
    intersectionHeight * pixelsPerSimUnitOld
  )
  context.fill()

  // Draw markings
  const markingCalculations = [
    // Street 0
    {
      vertical: true,
      originX: intersectionWidth / 2,
      originY: -intersectionHeight / 2,
      dotted: {
        xComp: -markingWidth / 2,
        yComp: -pixelsPerSimUnitOld,
      },
      solid: {
        xComp: 0,
        yComp: pixelsPerSimUnitOld - markingWidth - window.innerHeight / 2,
      },
      turn: {
        xComp: 0,
        yComp: -pixelsPerSimUnitOld * 3,
      },
      barrier: {
        xComp: -pixelsPerSimUnitOld,
        yComp: -markingWidth - window.innerHeight / 2,
      },
    },
    // Street 1
    {
      vertical: false,
      originX: intersectionWidth / 2,
      originY: intersectionHeight / 2,
      dotted: {
        xComp: pixelsPerSimUnitOld / 2,
        yComp: -markingWidth / 2,
      },
      solid: {
        xComp: markingWidth - pixelsPerSimUnitOld / 2,
        yComp: 0,
      },
      turn: {
        xComp: markingWidth - pixelsPerSimUnitOld / 2,
        yComp: 0,
      },
      barrier: {
        xComp: markingWidth,
        yComp: -pixelsPerSimUnitOld,
      },
    },
    // Street 2
    {
      vertical: true,
      originX: -intersectionWidth / 2,
      originY: intersectionHeight / 2,
      dotted: {
        xComp: -markingWidth / 2,
        yComp: pixelsPerSimUnitOld / 2,
      },
      solid: {
        xComp: 0,
        yComp: markingWidth - pixelsPerSimUnitOld / 2,
      },
      turn: {
        xComp: 0,
        yComp: markingWidth - pixelsPerSimUnitOld / 2,
      },
      barrier: {
        xComp: 0,
        yComp: markingWidth,
      },
    },
    // Street 3
    {
      vertical: false,
      originX: -intersectionWidth / 2,
      originY: -intersectionHeight / 2,
      dotted: {
        xComp: -pixelsPerSimUnitOld,
        yComp: -markingWidth / 2,
      },
      solid: {
        xComp: pixelsPerSimUnitOld - markingWidth - window.innerWidth / 2,
        yComp: 0,
      },
      turn: {
        xComp: -pixelsPerSimUnitOld * 3,
        yComp: 0,
      },
      barrier: {
        xComp: -markingWidth - window.innerWidth / 2,
        yComp: 0,
      },
    },
  ]
  streets.forEach((street, index) => {
    const calc = markingCalculations[index]
    for (let x = 0; x < street.assignments.length; x++) {
      const currAssignment = street.assignments[x]
      const prevAssignment = street.assignments[x - 1]
      // Create barrier
      if (currAssignment === 'b') {
        context.fillStyle = '#888'
        const coords = simToScreenOld(
          calc.originX + (index % 3 === 0 ? -1 : 1) * (calc.vertical ? x : 0),
          calc.originY + (index < 2 ? -1 : 1) * (calc.vertical ? 0 : x)
        )
        context.beginPath()
        context.rect(
          coords[0] + calc.barrier.xComp,
          coords[1] + calc.barrier.yComp,
          calc.vertical ? pixelsPerSimUnitOld : window.innerWidth / 2,
          calc.vertical ? window.innerHeight / 2 : pixelsPerSimUnitOld
        )
        context.fill()
      }
      if (x === 0 || (prevAssignment === 'b' && currAssignment === 'b')) continue
      // Lines
      if (
        (currAssignment !== 'i' && prevAssignment === 'i') ||
        (currAssignment !== 'b' && prevAssignment === 'b') ||
        (currAssignment === 'b' && prevAssignment !== 'i')
      ) {
        // Solid line
        if (prevAssignment === 'i' || (currAssignment !== 'i' && prevAssignment === 'b'))
          context.fillStyle = 'hsl(50deg 70% 65%)'
        else context.fillStyle = 'white'

        const coords = simToScreenOld(
          calc.originX + (index % 3 === 0 ? -1 : 1) * (calc.vertical ? x : 0),
          calc.originY + (index < 2 ? -1 : 1) * (calc.vertical ? 0 : x)
        )
        context.beginPath()
        context.rect(
          coords[0] + calc.dotted.xComp + calc.solid.xComp,
          coords[1] + calc.dotted.yComp + calc.solid.yComp,
          calc.vertical ? markingWidth : window.innerWidth / 2,
          calc.vertical ? window.innerHeight / 2 : markingWidth
        )
        context.fill()
      } else {
        // Dotted white line
        context.fillStyle = 'white'
        for (let y = 0; y * pixelsPerSimUnitOld < (calc.vertical ? window.innerHeight : window.innerWidth) / 2; y++) {
          const coords = simToScreenOld(
            calc.originX + (index % 3 === 0 ? -1 : 1) * (calc.vertical ? x : y),
            calc.originY + (index < 2 ? -1 : 1) * (calc.vertical ? y : x)
          )
          context.beginPath()
          context.rect(
            coords[0] + calc.dotted.xComp,
            coords[1] + calc.dotted.yComp,
            calc.vertical ? markingWidth : pixelsPerSimUnitOld / 2,
            calc.vertical ? pixelsPerSimUnitOld / 2 : markingWidth
          )
          context.fill()
        }
        // Turn line
        if (
          (prevAssignment !== 'i' && prevAssignment !== 'b' && !prevAssignment.includes('f')) ||
          (currAssignment !== 'i' && currAssignment !== 'b' && !currAssignment.includes('f'))
        ) {
          const coords = simToScreenOld(
            calc.originX + (index % 3 === 0 ? -1 : 1) * (calc.vertical ? x : 0),
            calc.originY + (index < 2 ? -1 : 1) * (calc.vertical ? 0 : x)
          )
          context.beginPath()
          context.rect(
            coords[0] + calc.dotted.xComp + calc.turn.xComp,
            coords[1] + calc.dotted.yComp + calc.turn.yComp,
            calc.vertical ? markingWidth : 4 * pixelsPerSimUnitOld - markingWidth,
            calc.vertical ? 4 * pixelsPerSimUnitOld - markingWidth : markingWidth
          )
          context.fill()
        }
      }
    }
  })

  // Render traffic lights
  const outLanes = Object.keys(lanes)
  outLanes.forEach((laneID) => {
    if (lanes[laneID].go) context.fillStyle = 'hsl(100deg 50% 50%)'
    else context.fillStyle = 'hsl(0deg 50% 50%)'
    const streetIndex = +laneID[0]
    const laneIndex = +laneID[1]
    const vertical = streetIndex % 2 === 0
    const coords = simToScreenOld(
      (streetIndex < 2 ? 1 : -1) * (intersectionWidth / 2 + (vertical ? -laneIndex : 0)) + (streetIndex === 0 ? -1 : 0),
      (streetIndex % 3 === 0 ? -1 : 1) * (intersectionHeight / 2 + (vertical ? 0 : -laneIndex)) +
        (streetIndex === 1 ? -1 : 0)
    )
    context.beginPath()
    context.rect(
      coords[0] + (streetIndex === 3 ? -markingWidth : 0),
      coords[1] + (streetIndex === 0 ? -markingWidth : 0),
      vertical ? pixelsPerSimUnitOld : markingWidth,
      vertical ? markingWidth : pixelsPerSimUnitOld
    )
    context.fill()
  })

  // Render cars
  context.fillStyle = 'white'
  cars.forEach((car) => {
    const carPos = getCarPos(streets, car)
    // @ts-expect-error
    let coords = simToScreenOld(...carPos)
    context.beginPath()
    context.arc(coords[0], coords[1], pixelsPerSimUnitOld / 6, 0, 2 * Math.PI)
    context.fill()
  })

  // Reset canvas scaling
  context.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio)
}
