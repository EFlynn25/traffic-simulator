import { Entity } from './entity'
import { PathGroup } from './types'

export type ChalkProps = {
  distancePerStep?: number
  distanceBetweenEntities?: number
  entities?: Entity[]
  pathGroups?: PathGroup[]
  spawningPathIds?: string[]
  clock?: number
  queue?: string[]
}

export class Chalk {
  private distancePerStep: number
  private distanceBetweenEntities: number
  private entities: Entity[]
  private pathGroups: PathGroup[]
  private spawningPathIds: string[]
  private clock: number
  private queue: string[]

  constructor(props: ChalkProps) {
    this.distancePerStep = props.distancePerStep
    this.distanceBetweenEntities = 1
    this.entities = []
    this.pathGroups = props.pathGroups
    this.spawningPathIds = props.spawningPathIds
    this.clock = 5 / this.distancePerStep
    this.queue = []

    // <- Check that all IDs are unique (and other verification)
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
    if (this.entities.length < 50 && Math.random() > 0.7) {
      const startGroupId = this.spawningPathIds[Math.floor(Math.random() * this.spawningPathIds.length)]
      if (startGroupId)
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

    const resetClock = 10 / this.distancePerStep
    if (this.clock <= 0) {
      this.clock = resetClock + 1
      const nextLocations = this.queue.filter((locationId) => locationId[2] === this.queue[0][2])
      nextLocations.map((locationId) => this.getLocation(locationId)?.setState('go', true))
      this.queue = this.queue.filter((locationId) => !nextLocations.includes(locationId))
    } else {
      this.getLocations().forEach((location) => location.setState('go', false))
    }

    const newClock = this.clock - 1
    this.clock = this.queue.length === 0 ? Math.max(newClock, 3) : newClock
  }
}
