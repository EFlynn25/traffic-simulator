import { Entity } from './entity'
import { Location } from './location'
import { PathGroup } from './types'

export class Chalk {
  private distancePerStep: number
  private distanceBetweenEntities: number
  private entities: Entity[]
  private pathGroups: PathGroup[]
  private spawningPathIds: string[]
  private clock: number
  private queue: string[]

  constructor(distancePerStep: number) {
    this.distancePerStep = distancePerStep
    this.distanceBetweenEntities = 1
    this.entities = []
    this.pathGroups = [
      [
        {
          id: '02',
          segments: [
            [
              { x: 10, y: 0.5 },
              { x: 2, y: 0.5 },
            ],
          ],
          locations: [new Location('02', 7.5, this.distancePerStep)],
        },
        {
          id: '03',
          segments: [
            [
              { x: 10, y: 1.5 },
              { x: 2, y: 1.5 },
            ],
          ],
          locations: [new Location('03', 7.5, this.distancePerStep)],
        },
        {
          id: '12',
          segments: [
            [
              { x: -0.5, y: 10 },
              { x: -0.5, y: 2 },
            ],
          ],
          locations: [new Location('12', 7.5, this.distancePerStep)],
        },
        {
          id: '13',
          segments: [
            [
              { x: -1.5, y: 10 },
              { x: -1.5, y: 2 },
            ],
          ],
          locations: [new Location('13', 7.5, this.distancePerStep)],
        },
        {
          id: '23',
          segments: [
            [
              { x: -10, y: -1.5 },
              { x: -2, y: -1.5 },
            ],
          ],
          locations: [new Location('23', 7.5, this.distancePerStep)],
        },
        {
          id: '22',
          segments: [
            [
              { x: -10, y: -0.5 },
              { x: -2, y: -0.5 },
            ],
          ],
          locations: [new Location('22', 7.5, this.distancePerStep)],
        },
        {
          id: '32',
          segments: [
            [
              { x: 0.5, y: -10 },
              { x: 0.5, y: -2 },
            ],
          ],
          locations: [new Location('32', 7.5, this.distancePerStep)],
        },
        {
          id: '33',
          segments: [
            [
              { x: 1.5, y: -10 },
              { x: 1.5, y: -2 },
            ],
          ],
          locations: [new Location('33', 7.5, this.distancePerStep)],
        },
        {
          id: '02l',
          segments: [
            [
              { x: 2, y: 0.5 },
              { x: -0.5, y: 0.5 },
              { x: -0.5, y: -1.5 },
            ],
            [
              { x: -0.5, y: -1.5 },
              { x: -0.5, y: -10 },
            ],
          ],
        },
        {
          id: '02s',
          segments: [
            [
              { x: 2, y: 0.5 },
              { x: -10, y: 0.5 },
            ],
          ],
        },
        {
          id: '03s',
          segments: [
            [
              { x: 2, y: 1.5 },
              { x: -10, y: 1.5 },
            ],
          ],
        },
        {
          id: '03r',
          segments: [
            [
              { x: 2, y: 1.5 },
              { x: 1.5, y: 1.5 },
              { x: 1.5, y: 2 },
            ],
            [
              { x: 1.5, y: 2 },
              { x: 1.5, y: 10 },
            ],
          ],
        },
        {
          id: '12l',
          segments: [
            [
              { x: -0.5, y: 2 },
              { x: -0.5, y: -0.5 },
              { x: 2, y: -0.5 },
            ],
            [
              { x: 2, y: -0.5 },
              { x: 10, y: -0.5 },
            ],
          ],
        },
        {
          id: '12s',
          segments: [
            [
              { x: -0.5, y: 2 },
              { x: -0.5, y: -10 },
            ],
          ],
        },
        {
          id: '13s',
          segments: [
            [
              { x: -1.5, y: 2 },
              { x: -1.5, y: -10 },
            ],
          ],
        },
        {
          id: '13r',
          segments: [
            [
              { x: -1.5, y: 2 },
              { x: -1.5, y: 1.5 },
              { x: -2, y: 1.5 },
            ],
            [
              { x: -2, y: 1.5 },
              { x: -10, y: 1.5 },
            ],
          ],
        },
        {
          id: '22l',
          segments: [
            [
              { x: -2, y: -0.5 },
              { x: 0.5, y: -0.5 },
              { x: 0.5, y: 2 },
            ],
            [
              { x: 0.5, y: 2 },
              { x: 0.5, y: 10 },
            ],
          ],
        },
        {
          id: '22s',
          segments: [
            [
              { x: -2, y: -0.5 },
              { x: 10, y: -0.5 },
            ],
          ],
        },
        {
          id: '23s',
          segments: [
            [
              { x: -2, y: -1.5 },
              { x: 10, y: -1.5 },
            ],
          ],
        },
        {
          id: '23r',
          segments: [
            [
              { x: -2, y: -1.5 },
              { x: -1.5, y: -1.5 },
              { x: -1.5, y: -2 },
            ],
            [
              { x: -1.5, y: -2 },
              { x: -1.5, y: -10 },
            ],
          ],
        },
        {
          id: '32l',
          segments: [
            [
              { x: 0.5, y: -2 },
              { x: 0.5, y: 0.5 },
              { x: -2, y: 0.5 },
            ],
            [
              { x: -2, y: 0.5 },
              { x: -10, y: 0.5 },
            ],
          ],
        },
        {
          id: '32s',
          segments: [
            [
              { x: 0.5, y: -2 },
              { x: 0.5, y: 10 },
            ],
          ],
        },
        {
          id: '33s',
          segments: [
            [
              { x: 1.5, y: -2 },
              { x: 1.5, y: 10 },
            ],
          ],
        },
        {
          id: '33r',
          segments: [
            [
              { x: 1.5, y: -2 },
              { x: 1.5, y: -1.5 },
              { x: 2, y: -1.5 },
            ],
            [
              { x: 2, y: -1.5 },
              { x: 10, y: -1.5 },
            ],
          ],
        },
      ],
    ]
    this.spawningPathIds = ['02', '03', '12', '13', '23', '22', '32', '33']
    this.clock = 5 / this.distancePerStep
    this.queue = []

    // <- Check that all IDs are unique
  }

  getEntities() {
    return this.entities
  }

  getPathGroups() {
    return this.pathGroups
  }

  getLocations() {
    return this.pathGroups.flatMap((group) => group.filter((path) => path.locations).flatMap((path) => path.locations!))
  }

  getLocation(locationId: string) {
    return this.getLocations().find((location) => location.getLocationId() === locationId)
  }

  step() {
    // Step entities
    this.entities = this.entities.filter((entity) => entity.step(this.entities))
    if (this.entities.length < 30) {
      const startGroupId = this.spawningPathIds[Math.floor(Math.random() * this.spawningPathIds.length)]
      this.entities.push(
        new Entity(this.pathGroups[0], startGroupId, this.distancePerStep, this.distanceBetweenEntities)
      )
    }

    // Step locations
    this.getLocations().forEach((location) => {
      const locationId = location.getLocationId()
      const state = location.getState()
      if (state.lastRead === 0 && !state.go && !this.queue.includes(locationId)) {
        this.queue.push(locationId)
      }

      location.step()
    })

    const resetClock = 4 / this.distancePerStep
    if (this.clock <= 0) {
      this.clock = resetClock + 1
      const nextLocations = this.queue.filter((locationId) => locationId[0] === this.queue[0][0])
      nextLocations.map((locationId) => this.getLocation(locationId)?.setState('go', true))
      this.queue = this.queue.filter((locationId) => !nextLocations.includes(locationId))
    } else {
      this.getLocations().forEach((location) => location.setState('go', false))
    }

    const newClock = this.clock - 1
    this.clock = this.queue.length === 0 ? Math.max(newClock, 3) : newClock
  }
}
