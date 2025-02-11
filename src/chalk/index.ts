import { Entity } from './entity.ts'
import { Location } from './location.ts'
import { PathGroup } from './types.ts'

export class Chalk {
  private distancePerStep: number
  private distanceBetweenEntities: number
  private entities: Entity[]
  private pathGroups: PathGroup[]
  private clock: number

  constructor(distancePerStep: number) {
    this.distancePerStep = distancePerStep
    this.distanceBetweenEntities = 1
    this.entities = []
    this.pathGroups = [
      [
        {
          id: '0',
          segments: [
            [
              { x: 20, y: 0 },
              { x: 20, y: 10 },
            ],
            [
              { x: 20, y: 10 },
              { x: 20, y: 15 },
              { x: 15, y: 15 },
            ],
            [
              { x: 15, y: 15 },
              { x: 10, y: 10 },
            ],
            [
              { x: 10, y: 10 },
              { x: 5, y: 10 },
            ],
          ],
          locations: [new Location(27.5, this.distancePerStep)],
        },
        {
          id: '1',
          segments: [
            [
              { x: 5, y: 10 },
              { x: -5, y: 10 },
            ],
          ],
          locations: [new Location(8, this.distancePerStep)],
        },
        {
          id: '2',
          segments: [
            [
              { x: 5, y: 10 },
              { x: 0, y: 10 },
              { x: 0, y: 5 },
            ],
            [
              { x: 0, y: 5 },
              { x: 0, y: 0 },
              { x: 5, y: 0 },
            ],
            [
              { x: 5, y: 0 },
              { x: 15, y: 0 },
              { x: 15, y: 10 },
            ],
            [
              { x: 15, y: 10 },
              { x: 15, y: 20 },
            ],
          ],
        },
        {
          id: '2.5',
          segments: [
            [
              { x: 5, y: 10 },
              { x: -30, y: 20 },
              { x: 20, y: 20 },
            ],
          ]
        },
        {
          id: '3',
          segments: [
            [
              { x: -5, y: 10 },
              { x: -5, y: 0 },
            ],
          ],
        },
        {
          id: '4',
          segments: [
            [
              { x: -5, y: 10 },
              { x: -15, y: 0 },
            ],
          ],
        },
        {
          id: '5',
          segments: [
            [
              { x: -5, y: 10 },
              { x: -15, y: 10 },
            ],
          ],
        },
        {
          id: '6',
          segments: [
            [
              { x: -5, y: 10 },
              { x: -15, y: 20 },
            ],
          ],
        },
        {
          id: '7',
          segments: [
            [
              { x: -5, y: 10 },
              { x: -5, y: 20 },
            ],
          ],
        },
      ],
    ]
    this.clock = 30 / this.distancePerStep
    for (let i = 0; i < 1; i++) {
      this.entities.push(new Entity(this.pathGroups[0], 0, this.distancePerStep, this.distanceBetweenEntities))
    }
    // Use a distanceBetweenEntities variable for stopping behind other entities
  }

  getEntities() {
    return this.entities
  }

  getPathGroups() {
    return this.pathGroups
  }

  step() {
    // Step entities
    this.entities = this.entities.filter((entity) => entity.step(this.entities))
    if (this.entities.length < 40) {
      this.entities.push(new Entity(this.pathGroups[0], 0, this.distancePerStep, this.distanceBetweenEntities))
    }

    // Step locations
    this.clock--
    if (this.clock === 0) {
      this.pathGroups.forEach((group) =>
        group.forEach((path) => path.locations?.forEach((location) => location.setState('stopAt', null)))
      )
    } else if (this.clock === -10 / this.distancePerStep) {
      this.clock = 15 / this.distancePerStep
      this.pathGroups.forEach((group) =>
        group.forEach((path) =>
          path.locations?.forEach((location) => location.setState('stopAt', location.getPathPosition()))
        )
      )
    }
  }
}
