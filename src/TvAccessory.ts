import {
  type PlatformAccessory,
  type Service,
  type PlatformConfig,
  Categories,
} from 'homebridge'

import type { TvPlatform } from './TvPlatform.js'
import { TvController } from './TvController.js'

enum Power {
  ON = 'ON',
  OFF = 'OFF',
}

enum Mute {
  ON = 'ON',
  OFF = 'OFF',
}

export class TvAccessory extends TvController {
  public accessory!: PlatformAccessory
  private tvService!: Service
  private speakerService!: Service
  private state = {
    power: Power.OFF as Power,
    mute: Mute.OFF as Mute,
    input: 999999, // 999999 is a special value to indicate no input
  }

  constructor(
    private readonly platform: TvPlatform,
    private readonly configs: PlatformConfig,
  ) {
    super({ ip: configs.ip, touchPort: configs.touchPort, port: configs.port })
  }

  async init() {
    await Promise.all([this.fetchDescription(), this.fetchChannels()])

    const uuid = this.platform.api.hap.uuid.generate(this.description.udn)
    const existingAccessory = this.platform.accessories.find(
      (accessory) => accessory.UUID === uuid,
    )

    if (existingAccessory) {
      this.accessory = existingAccessory
    } else {
      this.accessory = new this.platform.api.platformAccessory(
        this.description.friendlyName,
        uuid,
      )

      this.accessory.category = Categories.TELEVISION

      this.accessory.context.device = this.configs
      this.platform.api.publishExternalAccessories(
        this.description.friendlyName,
        [this.accessory],
      )
    }

    const informationService =
      this.accessory.getService(this.platform.Service.AccessoryInformation) ||
      this.accessory.addService(this.platform.Service.AccessoryInformation)!

    informationService
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.description.udn,
      )
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        this.description.manufacturer,
      )
      .setCharacteristic(
        this.platform.Characteristic.Model,
        this.description.modelName,
      )
      .setCharacteristic(
        this.platform.Characteristic.Name,
        this.description.friendlyName,
      )
      .setCharacteristic(this.platform.Characteristic.Identify, true)

    this.tvService =
      this.accessory.getService(this.platform.Service.Television) ||
      this.accessory.addService(this.platform.Service.Television)

    this.tvService
      .setCharacteristic(
        this.platform.Characteristic.ConfiguredName,
        this.description.friendlyName,
      )
      .setCharacteristic(
        this.platform.Characteristic.SleepDiscoveryMode,
        this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE,
      )

    this.tvService
      .getCharacteristic(this.platform.Characteristic.Active)
      .onSet(async (value) => {
        this.state.power = value ? Power.ON : Power.OFF
        this.setPower(value as boolean)
      })
      .onGet(() => this.state.power === Power.ON)

    this.tvService
      .getCharacteristic(this.platform.Characteristic.RemoteKey)
      .onSet((value) => {
        if (value === this.platform.Characteristic.RemoteKey.REWIND) {
          this.sendRewind()
        } else if (
          value === this.platform.Characteristic.RemoteKey.FAST_FORWARD
        ) {
          this.sendFastForward()
        } else if (
          value === this.platform.Characteristic.RemoteKey.NEXT_TRACK
        ) {
          this.sendNext()
        } else if (
          value === this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK
        ) {
          this.sendPrev()
        } else if (value === this.platform.Characteristic.RemoteKey.ARROW_UP) {
          this.sendKeyUp()
        } else if (
          value === this.platform.Characteristic.RemoteKey.ARROW_DOWN
        ) {
          this.sendKeyDown()
        } else if (
          value === this.platform.Characteristic.RemoteKey.ARROW_LEFT
        ) {
          this.sendKeyLeft()
        } else if (
          value === this.platform.Characteristic.RemoteKey.ARROW_RIGHT
        ) {
          this.sendKeyRight()
        } else if (value === this.platform.Characteristic.RemoteKey.SELECT) {
          this.sendSelect()
        } else if (value === this.platform.Characteristic.RemoteKey.BACK) {
          this.sendBack()
        } else if (value === this.platform.Characteristic.RemoteKey.EXIT) {
          this.sendExit()
        } else if (
          value === this.platform.Characteristic.RemoteKey.PLAY_PAUSE
        ) {
          this.sendPlay()
        } else if (
          value === this.platform.Characteristic.RemoteKey.INFORMATION
        ) {
          this.sendHome()
        }
      })

    this.tvService
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet((value) => {
        const _input = value as number
        if (0 <= _input && _input < 7) {
          this.state.input = _input
          if (_input === 0) {
            this.setInputTV()
          } else {
            this.setInput(_input)
          }
        }
      })
      .onGet(() => this.state.input)

    this.speakerService =
      this.accessory.getService(this.platform.Service.Television) ||
      this.accessory.addService(this.platform.Service.Television)

    this.speakerService.setCharacteristic(
      this.platform.Characteristic.ConfiguredName,
      this.description.friendlyName + ' Speaker',
    )

    this.speakerService
      .getCharacteristic(this.platform.Characteristic.Mute)
      .onSet(async (value) => {
        const _mute = value ? Mute.ON : Mute.OFF
        if (this.state.mute === _mute) {
          this.state.mute = _mute
          this.sendMute()
        }
      })
      .onGet(() => this.state.mute === Mute.ON)

    this.speakerService.setCharacteristic(
      this.platform.Characteristic.VolumeControlType,
      this.platform.Characteristic.VolumeControlType.RELATIVE,
    )

    this.speakerService
      .getCharacteristic(this.platform.Characteristic.VolumeSelector)
      .onSet((value) => {
        if (value === this.platform.Characteristic.VolumeSelector.INCREMENT) {
          this.sendVolumeUp()
        } else if (
          value === this.platform.Characteristic.VolumeSelector.DECREMENT
        ) {
          this.sendVolumeDown()
        }
      })

    this.tvService.addLinkedService(this.speakerService)
    this.tvService.addLinkedService(informationService)
  }
}
