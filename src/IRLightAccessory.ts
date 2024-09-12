import type { PlatformAccessory, Service, PlatformConfig } from 'homebridge'
import { exec } from 'child_process'

import type { IRPlatform } from './IRPlatform.js'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js'

enum Power {
  ON = 'ON',
  OFF = 'OFF',
}

enum LightLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
  LEVEL_4 = 4,
}

const FIXED_ID = 'fixed:ir:light'

export class IRLightAccessory {
  public accessory!: PlatformAccessory
  private service!: Service
  private state = {
    power: Power.OFF as Power,
    level: LightLevel.LEVEL_1 as LightLevel,
  }

  constructor(
    private readonly platform: IRPlatform,
    private readonly configs: PlatformConfig,
  ) {
    // don nothing.
  }

  async init() {
    const uuid = this.platform.api.hap.uuid.generate(FIXED_ID)

    const existingAccessory = this.platform.accessories.find(
      (accessory) => accessory.UUID === uuid,
    )

    if (existingAccessory) {
      this.accessory = existingAccessory
    } else {
      this.accessory = new this.platform.api.platformAccessory(
        this.configs.name as string,
        uuid,
      )
      this.accessory.context.device = this.configs
      this.platform.api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        [this.accessory],
      )
    }

    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.SerialNumber, FIXED_ID)

    this.service =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb)

    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      `${this.configs.name} Ceiling Light`,
    )

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(async (value) => {
        this.state.power = value ? Power.ON : Power.OFF
        exec('irsend SEND_ONCE livingroom_light TOGGLE')
      })
      .onGet(() => this.state.power === Power.ON)
    
    /*
    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .setProps({ minValue: 1, maxValue: 4, minStep: 1 })
      .onSet(async (value) => {
        const a = value as number
        const b = this.state.level as number
        const step = b > a ? b - a : b + 4 - a

        for (let i = 0; i < step; i++) {
          exec(`irsend SEND_ONCE livingroom_light LEVEL`)
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        this.state.level = value as LightLevel
      })
      .onGet(() => this.state.level)
    */
  }
}
