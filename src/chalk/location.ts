export class Location {
  // Location should be attached to a path
  // Maybe paths AND locations should have IDs

  private pathPosition: number
	private radius: number
	private state: Record<string, string | number | null>
  
  constructor(pathPosition: number, radius: number) {
    this.pathPosition = pathPosition
    this.state = { stopAt: pathPosition }
    this.radius = radius
  }

  getPathPosition() {
    return this.pathPosition
  }

  getRadius() {
    return this.radius
  }

  getState() {
    return this.state
  }

  setState(key: string, value: (typeof this.state)[string]) {
    this.state[key] = value
  }
}
