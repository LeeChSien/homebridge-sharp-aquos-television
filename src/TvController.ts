import xml2js from 'xml2js'
import fetch from 'node-fetch'

interface Configs {
  ip: string
  touchPort: number
  port: number
}

interface Description {
  friendlyName: string
  manufacturer: string
  modelName: string
  udn: string
}

interface Channel {
  rcNumber: string
  name: string
  chNumber: string
  skip: string
  eventTitle: string
  command: string
}

const subPathIPControl = '/control/X_IPcontrol'

export class TvController {
  ip!: string
  touchPort!: number
  port!: number
  endpoint!: string
  description = {
    friendlyName: '',
    manufacturer: '',
    modelName: '',
    udn: '',
  } as Description
  channels = [] as Array<Channel>

  constructor(configs: Configs) {
    this.ip = configs.ip
    this.touchPort = configs.touchPort
    this.port = configs.port
    this.endpoint = `http://${this.ip}:${this.port}`
  }

  async fetchDescription(): Promise<void> {
    const response = await fetch(
      `http://${this.ip}:${this.touchPort}/ssdp/device-desc.xml`,
    )
    const body = await response.text()
    const xmlParser = new xml2js.Parser()
    const description = await xmlParser.parseStringPromise(body)

    this.description.friendlyName = description.root.device[0].friendlyName[0]
    this.description.manufacturer = description.root.device[0].manufacturer[0]
    this.description.modelName = description.root.device[0].modelName[0]
    this.description.udn = description.root.device[0].UDN[0]
  }

  async fetchChannels(): Promise<void> {
    // create XML payload and post it to the TV
    const xmlBuilder = new xml2js.Builder()
    const payload = xmlBuilder.buildObject({
      's:Envelope': {
        $: {
          'xmlns:s': 'http://schemas.xmlsoap.org/soap/envelope/',
          's:encodingStyle': 'http://schemas.xmlsoap.org/soap/encoding/',
        },
        's:Body': {
          'u:X_GetTvStatus': {
            $: {
              'xmlns:u': 'urn:schemas-sharp-co-jp:service:X_IPcontrol:1',
            },
            InfoName: 'TDSvChList',
            ID: '',
            Pass: '',
          },
        },
      },
    })

    const response = await fetch(`${this.endpoint}${subPathIPControl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        SOAPACTION:
          '"urn:schemas-sharp-co-jp:service:X_IPcontrol:1#X_GetTvStatus"',
      },
      body: payload.toString(),
    })
    const body = await response.text()
    const xmlParser = new xml2js.Parser()
    const programInformation = await xmlParser.parseStringPromise(body)

    const listBody =
      programInformation['s:Envelope']['s:Body'][0][
        'u:X_GetTvStatusResponse'
      ][0].Result[0]

    const list = await xmlParser.parseStringPromise(listBody)
    list.ChList.Ch.forEach((ch: Record<string, Array<string>>) => {
      this.channels.push({
        rcNumber: ch.RcNumber[0],
        name: ch.Name[0],
        chNumber: ch.ChNumber[0],
        skip: ch.Skip[0],
        eventTitle: ch.EventTitle[0],
        command: ch.Command[0],
      })
    })
  }

  async sendCommand(content: Record<string, string>): Promise<void> {
    // create XML payload and post it to the TV
    const xmlBuilder = new xml2js.Builder()
    const payload = xmlBuilder.buildObject({
      's:Envelope': {
        $: {
          'xmlns:s': 'http://schemas.xmlsoap.org/soap/envelope/',
          's:encodingStyle': 'http://schemas.xmlsoap.org/soap/encoding/',
        },
        's:Body': {
          'u:X_SetControlCommand': {
            $: {
              'xmlns:u': 'urn:schemas-sharp-co-jp:service:X_IPcontrol:1',
            },
            ...content,
            ID: '',
            Pass: '',
          },
        },
      },
    })

    await fetch(`${this.endpoint}${subPathIPControl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        SOAPACTION:
          '"urn:schemas-sharp-co-jp:service:X_IPcontrol:1#X_SetControlCommand"',
      },
      body: payload.toString(),
    })
  }

  async setPower(power: boolean): Promise<void> {
    await this.sendCommand({
      Command: power ? 'POWR0001' : 'POWR0000',
    })
  }

  async sendNumber(number: number): Promise<void> {
    // 0x25d is the hex value for the number 0, range is 1~12.
    await this.sendCommand({
      Command: `IRCO0${(0x25d + number).toString(16).toUpperCase()}`,
    })
  }
  async setModeGround(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0289',
    })
  }

  async setModeBS(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO028A',
    })
  }

  async setModeCS(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO028B',
    })
  }

  async sendHome(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO02BB',
    })
  }

  async sendMute(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0117',
    })
  }

  async sendVolumeUp(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0114',
    })
  }

  async sendVolumeDown(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0115',
    })
  }

  async sendChannelInfo(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0260',
    })
  }

  async sendChannelUp(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0111',
    })
  }

  async sendChannelDown(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0112',
    })
  }

  async sendKeyUp(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0157',
    })
  }

  async sendKeyRight(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO01D8',
    })
  }

  async sendKeyLeft(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO01D7',
    })
  }

  async sendKeyDown(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0120',
    })
  }

  async sendSelect(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0152',
    })
  }

  async sendBack(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO01E4',
    })
  }

  async sendExit(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO01F5',
    })
  }

  async sendPlay(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0FA7',
    })
  }

  async sendStop(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0FA6',
    })
  }

  async sendPause(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0FA5',
    })
  }

  async sendPrev(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0FB1',
    })
  }

  async sendNext(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0FB2',
    })
  }

  async sendRewind(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0FA4',
    })
  }

  async sendFastForward(): Promise<void> {
    await this.sendCommand({
      Command: 'IRCO0FA8',
    })
  }

  async setInputTV(): Promise<void> {
    await this.sendCommand({
      Command: 'IDIN0000',
    })
  }

  async setInput(input: number): Promise<void> {
    await this.sendCommand({
      // input 1~6
      Command: `IDIN001${input}`,
    })
  }
}
