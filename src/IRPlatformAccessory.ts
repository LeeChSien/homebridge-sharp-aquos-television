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

enum FanLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
}

enum FanDirection {
  DOWN = 'DOWN',
  UP = 'UP',
}

const FIXED_ID = 'fixed:ir'

export class IRPlatformAccessory {
  public accessory!: PlatformAccessory

  private lightService!: Service
  private lightState = {
    power: Power.OFF as Power,
    level: LightLevel.LEVEL_4 as LightLevel,
  }

  private fanService!: Service
  private fanState = {
    power: Power.OFF as Power,
    level: FanLevel.LEVEL_2 as FanLevel,
    direction: FanDirection.DOWN as FanDirection,
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

    this.lightService =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb)

    this.lightService.setCharacteristic(
      this.platform.Characteristic.Name,
      `${this.configs.name} Light`,
    )

    this.lightService
      .getCharacteristic(this.platform.Characteristic.Active)
      .onSet(async (value) => {
        this.lightState.power = value ? Power.ON : Power.OFF
        exec('irsend SEND_ONCE livingroom_light TOGGLE')
      })
      .onGet(() => this.lightState.power === Power.ON)

    this.lightService
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .setProps({ minValue: 1, maxValue: 4, minStep: 1 })
      .onSet(async (value) => {
        const step = Math.min(
          Math.abs(value as number) - (this.lightState.level as number),
          value as number,
        )

        for (let i = 0; i < step; i++) {
          exec(`irsend SEND_ONCE livingroom_light LEVEL`)
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        this.lightState.level = value as LightLevel
      })
      .onGet(() => this.lightState.level)

    this.fanService =
      this.accessory.getService(this.platform.Service.Fanv2) ||
      this.accessory.addService(this.platform.Service.Fanv2)

    this.fanService.setCharacteristic(
      this.platform.Characteristic.Name,
      `${this.configs.name} Fan`,
    )

    this.fanService
      .getCharacteristic(this.platform.Characteristic.Active)
      .onSet(async (value) => {
        this.fanState.power = value ? Power.ON : Power.OFF
        if (this.fanState.power === Power.OFF) {
          exec('irsend SEND_ONCE livingroom_fan OFF')
        } else {
          switch (this.fanState.level) {
            case FanLevel.LEVEL_1:
              exec('irsend SEND_ONCE livingroom_fan ON_WITH_LEVEL_1')
              break
            case FanLevel.LEVEL_2:
              exec('irsend SEND_ONCE livingroom_fan ON_WITH_LEVEL_2')
              break
            case FanLevel.LEVEL_3:
              exec('irsend SEND_ONCE livingroom_fan ON_WITH_LEVEL_3')
              break
            default:
              exec('irsend SEND_ONCE livingroom_fan ON_WITH_LEVEL_2')
          }
        }
      })
      .onGet(() => this.fanState.power === Power.ON)

    this.fanService
      .getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .setProps({ minValue: 1, maxValue: 3, minStep: 1 })
      .onSet(async (value) => {
        exec(`irsend SEND_ONCE livingroom_fan LEVEL_${value}`)
        this.fanState.level = value as FanLevel
      })
      .onGet(() => this.fanState.level)

    const { CLOCKWISE, COUNTER_CLOCKWISE } =
      this.platform.Characteristic.RotationDirection
    this.fanService
      .getCharacteristic(this.platform.Characteristic.RotationDirection)
      .onSet(async (value) => {
        this.fanState.direction =
          value === CLOCKWISE ? FanDirection.UP : FanDirection.DOWN
        exec('irsend SEND_ONCE livingroom_fan REVERSE')
      })
      .onGet(() =>
        this.fanState.direction === FanDirection.DOWN
          ? COUNTER_CLOCKWISE
          : CLOCKWISE,
      )
  }
}
