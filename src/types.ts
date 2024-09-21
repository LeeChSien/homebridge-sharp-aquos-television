export interface Configs {
  ip: string
  port: number
  portDescription: number
  id?: string
  password?: string
}

export interface Description {
  friendlyName: string
  manufacturer: string
  modelName: string
  udn: string
}

export interface Channel {
  rcNumber: string
  name: string
  chNumber: string
  skip: string
  eventTitle: string
  command: string
}

export enum Power {
  ON = 'ON',
  OFF = 'OFF',
}

export enum Mute {
  ON = 'ON',
  OFF = 'OFF',
}
