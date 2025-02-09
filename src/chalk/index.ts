import { Entity } from './entity.ts'
import { Location } from './location.ts'
import { LocationGroup, PathGroup } from './types.ts'

export class Chalk {
  private distancePerStep: number
  private distanceBetweenEntities: number
  private entities: Entity[]
  private pathGroups: PathGroup[]
  private clock: number

  constructor() {
    this.distancePerStep = 1
    this.distanceBetweenEntities = 1
    this.entities = []
    this.pathGroups = [
      [
        {
          id: '0',
          segments: [
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
          locations: [new Location(12, this.distancePerStep)],
        },
        {
          id: '1',
          segments: [
            [
              { x: 5, y: 10 },
              { x: -5, y: 10 },
            ],
          ],
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
            ],
          ],
        },
      ],
    ]
    this.clock = 20
    for (let i = 0; i < 1; i++) {
      this.entities.push(new Entity(this.pathGroups[0], this.distancePerStep, this.distanceBetweenEntities))
    }
    // Use a distanceBetweenEntities variable for stopping behind other entities
  }

  step() {
    // Step entities
    const entityScreenPositions = this.entities.map((entity) => entity.getScreenPosition())
    this.entities = this.entities.filter((entity) => entity.step(this.entities))
    if (this.entities.length < 2) {
      this.entities.push(new Entity(this.pathGroups[0], this.distancePerStep, this.distanceBetweenEntities))
    }

    // Step locations
    this.clock--
    if (this.clock === 0) {
      this.clock = 20
      this.pathGroups.forEach((group) =>
        group.forEach((path) => path.locations?.forEach((location) => location.setState('stopAt', null)))
      )
    }
  }
}
