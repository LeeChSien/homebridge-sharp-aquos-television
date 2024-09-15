import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge'

import { IRLightAccessory } from './IRLightAccessory.js'
import { IRFanAccessory } from './IRFanAccessory.js'

export class IRPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service
  public readonly Characteristic: typeof Characteristic

  public readonly accessories: PlatformAccessory[] = []

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service
    this.Characteristic = api.hap.Characteristic

    this.log.debug('Finished initializing platform:', this.config.name)

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback')
      this.discoverDevices()
    })
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName)
    this.accessories.push(accessory)
  }

  async discoverDevices() {
    const lightAccessory = new IRLightAccessory(this, this.config)
    try {
      await lightAccessory.init()
    } catch (e) {
      this.log.error('Cannot init ir light')
    }

    const fanAccessory = new IRFanAccessory(this, this.config)
    try {
      await fanAccessory.init()
    } catch (e) {
      this.log.error('Cannot init ir fan')
    }
  }
}
