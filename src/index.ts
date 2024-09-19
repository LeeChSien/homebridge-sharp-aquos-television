import type { API } from 'homebridge'

import { TvPlatform } from './TvPlatform.js'
import { PLATFORM_NAME } from './settings.js'

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, TvPlatform)
}
