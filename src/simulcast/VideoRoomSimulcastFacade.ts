/**
 * Entry point for work with simulcast layers both as publisher and subscriber
 */
export default interface VideoRoomSimulcastFacade {

  /**
   * Adds video for publishing and enables required susbtream accordingly to participants number
   * @param track
   */
  addVideoSimulcastTrack(track): void

  /**
   * Adjusts publishing accordingly to participants number to prevent bandwidth to exceed limit
   */
  adjustBandwidth(): void

  /**
   * Switches all subscribers to lower available simulcast layer
   * 5 stages of reducing quality:
   * 1. High quality + high fps
   * 2. Medium quality + high fps
   * 3. Medium quality + low fps
   * 4. Low quality + high fps
   * 5. Low quality + low fps
   * @return if lower simulcast layer is available and switch performed
   */
  reduceDownlink(): void

  /**
   * Disables highest active simulcast layer if lower level is available
   * Emits poor-connection event if no lower quality available
   */
  reduceUplink(): void

  /**
   * @return active substream used for subscribers currently
   */
  getActiveDownlinkSubstream(): number
}
