import { Entity } from './entity'

export class Location {
  private locationId: string
  private pathPosition: number
  private radius: number
  private state: Record<string, any> & { lastRead: number }

  constructor(locationId: string, pathPosition: number, radius: number) {
    this.locationId = locationId
    this.pathPosition = pathPosition
    this.state = { stopAt: pathPosition, go: false, lastRead: Infinity }
    this.radius = radius
  }

  getLocationId() {
    return this.locationId
  }

  getPathPosition() {
    return this.pathPosition
  }

  getRadius() {
    return this.radius
  }

  getState(entity?: Entity) {
    if (entity) this.state = { ...this.state, lastRead: 0 }
    return this.state
  }

  setState(key: string, value: (typeof this.state)[string]) {
    this.state[key] = value
  }

  step() {
    this.state = { ...this.state, lastRead: this.state.lastRead + 1 }
  }
}
