export type SoundOscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle'

export interface CalbySoundNote {
  freq: number
  duration: number
  delay?: number
  type?: SoundOscillatorType
}

export interface CalbySound {
  id: string
  displayName: string
  category: 'notification' | 'alarm'
  localAssetPath: string
  description: string
  notes: CalbySoundNote[]
}

export const NOTIFICATION_SOUNDS: CalbySound[] = [
  {
    id: 'calby-soft',
    displayName: 'Calby Soft',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/soundshelfstudio-ui-notification-soft-513563.mp3',
    description: 'Gentle UI chime',
    notes: [
      { freq: 523.25, duration: 0.2, type: 'sine' },
      { freq: 659.25, duration: 0.35, delay: 0.1, type: 'sine' }
    ]
  },
  {
    id: 'calby-pulse',
    displayName: 'Calby Pulse',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/dragon-studio-notification-sound-effect-372475.mp3',
    description: 'Dual pulse chime',
    notes: [
      { freq: 587.33, duration: 0.12, type: 'sine' },
      { freq: 880.0, duration: 0.3, delay: 0.08, type: 'sine' }
    ]
  },
  {
    id: 'calby-glass',
    displayName: 'Calby Glass',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-bell-notification-933.wav',
    description: 'Crisp glass ping',
    notes: [
      { freq: 1046.5, duration: 0.12, type: 'sine' },
      { freq: 1318.51, duration: 0.35, delay: 0.06, type: 'sine' }
    ]
  },
  {
    id: 'calby-warm',
    displayName: 'Calby Warm',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/universfield-soft-notification-131438.mp3',
    description: 'Warm acoustic tone',
    notes: [
      { freq: 440.0, duration: 0.2, type: 'triangle' },
      { freq: 554.37, duration: 0.35, delay: 0.12, type: 'triangle' }
    ]
  },
  {
    id: 'dragon-studio-alert',
    displayName: 'Dragon Studio Alert',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/dragon-studio-alert-444816.mp3',
    description: 'Studio alert chime',
    notes: [{ freq: 523.25, duration: 0.3, type: 'sine' }]
  },
  {
    id: 'dragon-studio-bell',
    displayName: 'Notification Bell',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/dragon-studio-notification-bell-sound-1-376885.mp3',
    description: 'Clear notification bell',
    notes: [{ freq: 659.25, duration: 0.3, type: 'sine' }]
  },
  {
    id: 'liecio-message-alert',
    displayName: 'Message Alert',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/liecio-message-alert-190042.mp3',
    description: 'Message alert tone',
    notes: [{ freq: 587.33, duration: 0.3, type: 'sine' }]
  },
  {
    id: 'mixkit-arabian-harp',
    displayName: 'Arabian Harp',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-arabian-mystery-harp-notification-2489.wav',
    description: 'Harp notification chime',
    notes: [{ freq: 440.0, duration: 0.4, type: 'sine' }]
  },
  {
    id: 'mixkit-clock-countdown',
    displayName: 'Clock Countdown',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-clock-countdown-bleeps-916.wav',
    description: 'Countdown bleeps',
    notes: [{ freq: 880.0, duration: 0.2, type: 'square' }]
  },
  {
    id: 'mixkit-doorbell',
    displayName: 'Doorbell Single Press',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-doorbell-single-press-333.wav',
    description: 'Doorbell press chime',
    notes: [{ freq: 659.25, duration: 0.4, type: 'sine' }]
  },
  {
    id: 'mixkit-happy-bells',
    displayName: 'Happy Bells',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-happy-bells-notification-937.wav',
    description: 'Cheerful bell melody',
    notes: [{ freq: 783.99, duration: 0.4, type: 'sine' }]
  },
  {
    id: 'mixkit-melodical-flute',
    displayName: 'Melodical Flute',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-melodical-flute-music-notification-2310.wav',
    description: 'Flute music notification',
    notes: [{ freq: 523.25, duration: 0.5, type: 'sine' }]
  },
  {
    id: 'mixkit-musical-alert',
    displayName: 'Musical Alert',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-musical-alert-notification-2309.wav',
    description: 'Musical chime alert',
    notes: [{ freq: 659.25, duration: 0.3, type: 'sine' }]
  },
  {
    id: 'mixkit-musical-reveal',
    displayName: 'Musical Reveal',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-musical-reveal-961.wav',
    description: 'Reveal chime',
    notes: [{ freq: 880.0, duration: 0.4, type: 'sine' }]
  },
  {
    id: 'mixkit-orchestral-emergency',
    displayName: 'Orchestral Emergency',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-orchestral-emergency-alarm-2974.wav',
    description: 'Orchestral alarm alert',
    notes: [{ freq: 440.0, duration: 0.4, type: 'sawtooth' }]
  },
  {
    id: 'mixkit-store-door-bell',
    displayName: 'Store Door Bell',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-store-door-bell-ring-934.wav',
    description: 'Store entry bell ring',
    notes: [{ freq: 523.25, duration: 0.3, type: 'sine' }]
  },
  {
    id: 'mixkit-urgent-tone',
    displayName: 'Urgent Tone',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-urgent-simple-tone-loop-2976.wav',
    description: 'Urgent notification tone',
    notes: [{ freq: 880.0, duration: 0.3, type: 'square' }]
  },
  {
    id: 'mixkit-weird-alarm',
    displayName: 'Weird Alarm Loop',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-weird-alarm-loop-2977.wav',
    description: 'Weird synth alarm loop',
    notes: [{ freq: 659.25, duration: 0.4, type: 'sawtooth' }]
  },
  {
    id: 'mixkit-wrong-answer',
    displayName: 'Wrong Answer Fail',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/mixkit-wrong-answer-fail-notification-946.wav',
    description: 'Fail alert tone',
    notes: [{ freq: 220.0, duration: 0.4, type: 'sawtooth' }]
  },
  {
    id: 'ribhavagrawal-type-20',
    displayName: 'Chime Type 20',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/ribhavagrawal-notification-sound-type-20-no-copyright-410276.mp3',
    description: 'Minimalist sound chime',
    notes: [{ freq: 587.33, duration: 0.3, type: 'sine' }]
  },
  {
    id: 'soundreality-chime',
    displayName: 'Sound Reality Chime',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/soundreality-notification-sound-580715.mp3',
    description: 'Clean notification chime',
    notes: [{ freq: 659.25, duration: 0.3, type: 'sine' }]
  },
  {
    id: 'soundreality-tone',
    displayName: 'Sound Reality Tone',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/soundreality-notification-tone-443095.mp3',
    description: 'Balanced notification tone',
    notes: [{ freq: 523.25, duration: 0.3, type: 'sine' }]
  },
  {
    id: 'soundshelfstudio-pop-minimal',
    displayName: 'Minimal Pop',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/soundshelfstudio-ui-notification-pop-minimal-523149.mp3',
    description: 'Ultra minimal UI pop',
    notes: [{ freq: 880.0, duration: 0.15, type: 'sine' }]
  },
  {
    id: 'universfield-012',
    displayName: 'New Notification 12',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/universfield-new-notification-012-363675.mp3',
    description: 'Modern chime 12',
    notes: [{ freq: 523.25, duration: 0.25, type: 'sine' }]
  },
  {
    id: 'universfield-017',
    displayName: 'New Notification 17',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/universfield-new-notification-017-352293.mp3',
    description: 'Modern chime 17',
    notes: [{ freq: 659.25, duration: 0.25, type: 'sine' }]
  },
  {
    id: 'universfield-022',
    displayName: 'New Notification 22',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/universfield-new-notification-022-370046.mp3',
    description: 'Modern chime 22',
    notes: [{ freq: 783.99, duration: 0.25, type: 'sine' }]
  },
  {
    id: 'universfield-024',
    displayName: 'New Notification 24',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/universfield-new-notification-024-370048.mp3',
    description: 'Modern chime 24',
    notes: [{ freq: 880.0, duration: 0.25, type: 'sine' }]
  },
  {
    id: 'universfield-036',
    displayName: 'New Notification 36',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/universfield-new-notification-036-485897.mp3',
    description: 'Modern chime 36',
    notes: [{ freq: 587.33, duration: 0.25, type: 'sine' }]
  },
  {
    id: 'universfield-038',
    displayName: 'New Notification 38',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/universfield-new-notification-038-487899.mp3',
    description: 'Modern chime 38',
    notes: [{ freq: 659.25, duration: 0.25, type: 'sine' }]
  },
  {
    id: 'universfield-051',
    displayName: 'New Notification 51',
    category: 'notification',
    localAssetPath: 'assets/sounds/notifications/universfield-new-notification-051-494246.mp3',
    description: 'Modern chime 51',
    notes: [{ freq: 783.99, duration: 0.25, type: 'sine' }]
  }
]

export const ALARM_SOUNDS: CalbySound[] = [
  {
    id: 'calby-wake',
    displayName: 'Calby Wake',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-classic-alarm-995.wav',
    description: 'Uplifting morning alert',
    notes: [
      { freq: 523.25, duration: 0.2, type: 'sine' },
      { freq: 659.25, duration: 0.2, delay: 0.15, type: 'sine' },
      { freq: 783.99, duration: 0.5, delay: 0.3, type: 'sine' }
    ]
  },
  {
    id: 'calby-focus',
    displayName: 'Calby Focus',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/idoberg-relaxing-guitar-loop-v5-245859.mp3',
    description: 'Relaxing focus melody',
    notes: [
      { freq: 440.0, duration: 0.2, type: 'triangle' },
      { freq: 554.37, duration: 0.2, delay: 0.15, type: 'triangle' },
      { freq: 659.25, duration: 0.5, delay: 0.3, type: 'triangle' }
    ]
  },
  {
    id: 'calby-alert',
    displayName: 'Calby Alert',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-critical-alarm-1004.wav',
    description: 'Clear attentive alert',
    notes: [
      { freq: 880.0, duration: 0.15, type: 'sine' },
      { freq: 880.0, duration: 0.15, delay: 0.12, type: 'sine' },
      { freq: 1046.5, duration: 0.45, delay: 0.25, type: 'sine' }
    ]
  },
  {
    id: 'calby-classic',
    displayName: 'Calby Classic',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-vintage-telephone-ringtone-1356.wav',
    description: 'Classic desktop chime',
    notes: [
      { freq: 587.33, duration: 0.2, type: 'sine' },
      { freq: 739.99, duration: 0.2, delay: 0.15, type: 'sine' },
      { freq: 880.0, duration: 0.5, delay: 0.3, type: 'sine' }
    ]
  },
  {
    id: 'office-phone-calling',
    displayName: 'Office Phone Calling',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/871127__anonio82__office_phone_calling.wav',
    description: 'Office telephone ringing',
    notes: [{ freq: 440.0, duration: 0.5, type: 'sine' }]
  },
  {
    id: 'piano-loops-octave',
    displayName: 'Piano Loop Octave',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/871400__josefpres__piano-loops-215-efect-2-octave-long-loop-120-bpm.wav',
    description: 'Melodic piano loop',
    notes: [{ freq: 523.25, duration: 0.5, type: 'sine' }]
  },
  {
    id: 'ambient-arp-100bpm',
    displayName: 'Ambient Arp',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/871422__erokia__msfxp13-46-ambient-arp-100-bpm.wav',
    description: 'Atmospheric synth arp',
    notes: [{ freq: 659.25, duration: 0.5, type: 'sine' }]
  },
  {
    id: 'jingle-bells-music',
    displayName: 'Jingle Bells Melody',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/jonasblakewood-jingle-bells-jingle-bells-music-593974.mp3',
    description: 'Jingle bells music alert',
    notes: [{ freq: 659.25, duration: 0.5, type: 'sine' }]
  },
  {
    id: 'classical-vibes',
    displayName: 'Classical Vibes',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-classical-vibes-2-682.mp3',
    description: 'Classical acoustic vibes',
    notes: [{ freq: 523.25, duration: 0.5, type: 'sine' }]
  },
  {
    id: 'clock-countdown-bleeps',
    displayName: 'Clock Countdown Bleeps',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-clock-countdown-bleeps-916.wav',
    description: 'Ticking countdown bleeps',
    notes: [{ freq: 880.0, duration: 0.3, type: 'square' }]
  },
  {
    id: 'intro-transition',
    displayName: 'Intro Transition',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-intro-transition-1146.wav',
    description: 'Riser intro transition',
    notes: [{ freq: 440.0, duration: 0.5, type: 'sine' }]
  },
  {
    id: 'retro-game-emergency',
    displayName: 'Retro Game Emergency',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-retro-game-emergency-alarm-1000.wav',
    description: '8-bit retro emergency alarm',
    notes: [{ freq: 880.0, duration: 0.4, type: 'square' }]
  },
  {
    id: 'facility-breach-alarm',
    displayName: 'Facility Breach Alarm',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-security-facility-breach-alarm-994.wav',
    description: 'High intensity breach alarm',
    notes: [{ freq: 987.77, duration: 0.5, type: 'sawtooth' }]
  },
  {
    id: 'spaceship-alarm',
    displayName: 'Spaceship Alarm',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-spaceship-alarm-998.wav',
    description: 'Sci-fi spaceship siren',
    notes: [{ freq: 783.99, duration: 0.5, type: 'sawtooth' }]
  },
  {
    id: 'tick-tock-clock',
    displayName: 'Tick Tock Clock',
    category: 'alarm',
    localAssetPath: 'assets/sounds/alarms/mixkit-tick-tock-clock-timer-1045.wav',
    description: 'Rhythmic tick tock clock',
    notes: [{ freq: 440.0, duration: 0.3, type: 'sine' }]
  }
]

export function findNotificationSound(nameOrId: string | undefined): CalbySound {
  if (!nameOrId) return NOTIFICATION_SOUNDS[0]
  const match = NOTIFICATION_SOUNDS.find(
    (s) => s.displayName.toLowerCase() === nameOrId.toLowerCase() || s.id.toLowerCase() === nameOrId.toLowerCase()
  )
  return match || NOTIFICATION_SOUNDS[0]
}

export function findAlarmSound(nameOrId: string | undefined): CalbySound {
  if (!nameOrId) return ALARM_SOUNDS[0]
  const match = ALARM_SOUNDS.find(
    (s) => s.displayName.toLowerCase() === nameOrId.toLowerCase() || s.id.toLowerCase() === nameOrId.toLowerCase()
  )
  return match || ALARM_SOUNDS[0]
}
