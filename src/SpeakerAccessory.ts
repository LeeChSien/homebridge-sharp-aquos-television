import type { PlatformAccessory, Service, PlatformConfig } from 'homebridge'
import { exec } from 'child_process'

import type { SpeakerPlatform } from './SpeakerPlatform.js'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js'

enum Power {
  ON = 'ON',
  OFF = 'OFF',
}

enum Mute {
  ON = 'ON',
  OFF = 'OFF',
}

const FIXED_ID = 'fixed:speaker'

export class SpeakerAccessory {
  public accessory!: PlatformAccessory
  private service!: Service
  private state = {
    power: Power.OFF as Power,
    mute: Mute.OFF as Mute,
  }

  constructor(
    private readonly platform: SpeakerPlatform,
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
      this.accessory.getService(this.platform.Service.Speaker) ||
      this.accessory.addService(this.platform.Service.Speaker)

    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      this.configs.name as string,
    )

    this.service
      .getCharacteristic(this.platform.Characteristic.Active)
      .onSet(async (value) => {
        const newState = value ? Power.ON : Power.OFF
        if (newState !== this.state.power) {
          this.state.power = newState
          exec('irsend SEND_ONCE livingroom_amp TOGGLE')
        }
      })
      .onGet(() => this.state.power === Power.ON)

    this.service
      .getCharacteristic(this.platform.Characteristic.Mute)
      .onSet(async (value) => {
        const newState = value ? Mute.ON : Mute.OFF
        if (newState !== this.state.mute) {
          this.state.mute = newState
          exec('irsend SEND_ONCE livingroom_amp MUTE')
        }
      })
      .onGet(() => this.state.mute === Mute.ON)
  }
}
