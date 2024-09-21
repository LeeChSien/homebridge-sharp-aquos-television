# homebridge-sharp-aquos-television

This plugin is build throgh the reverse engineering of the Sharp Aquos TV API. We tested this plugin with the Sharp AQUOS 4T-C60AM1 TV

## Usage

Add new platform to Homebridge config json.

```js
"platforms": [
  {
    "platform": "SharpAquosTelevision",
    "name": "Sharp Aquos Television",
    "ip": "192.168.11.14",
    "port": "12346",
    "portDescription": "8008"
    // optional
    "id": "myID",
    "password": "myPassword"
  }
]
```
