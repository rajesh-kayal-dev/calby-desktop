export type TimePeriod = 'late_night' | 'morning' | 'afternoon' | 'evening' | 'night'

export interface GreetingTemplate {
  withName: (name: string) => string
  withoutName: string
}

export const GREETINGS_BY_PERIOD: Record<TimePeriod, GreetingTemplate[]> = {
  late_night: [
    { withName: (name) => `Still up, ${name}?`, withoutName: 'Still up?' },
    { withName: (name) => `Working late, ${name}?`, withoutName: 'Working late?' },
    { withName: (name) => `What are you working on, ${name}?`, withoutName: 'What are you working on?' },
    { withName: (name) => `Need help with something, ${name}?`, withoutName: 'Need help with something?' },
    { withName: (name) => `What's on your mind, ${name}?`, withoutName: "What's on your mind?" }
  ],
  morning: [
    { withName: (name) => `Good morning, ${name}.`, withoutName: 'Good morning.' },
    { withName: (name) => `Morning, ${name}. How's your day going?`, withoutName: "Morning. How's your day going?" },
    { withName: (name) => `Good morning, ${name}. What's on your mind?`, withoutName: "Good morning. What's on your mind?" },
    { withName: (name) => `Morning, ${name}. What are we working on today?`, withoutName: 'Morning. What are we working on today?' },
    { withName: (name) => `Good morning, ${name}. Ready when you are.`, withoutName: 'Good morning. Ready when you are.' }
  ],
  afternoon: [
    { withName: (name) => `Good afternoon, ${name}.`, withoutName: 'Good afternoon.' },
    { withName: (name) => `How's your afternoon going, ${name}?`, withoutName: "How's your afternoon going?" },
    { withName: (name) => `What are you working on, ${name}?`, withoutName: 'What are you working on?' },
    { withName: (name) => `What's on your mind, ${name}?`, withoutName: "What's on your mind?" },
    { withName: (name) => `Need a hand with something, ${name}?`, withoutName: 'Need a hand with something?' }
  ],
  evening: [
    { withName: (name) => `Good evening, ${name}.`, withoutName: 'Good evening.' },
    { withName: (name) => `How's your evening going, ${name}?`, withoutName: "How's your evening going?" },
    { withName: (name) => `What can I help you with, ${name}?`, withoutName: 'What can I help you with?' },
    { withName: (name) => `Anything you want to get done, ${name}?`, withoutName: 'Anything you want to get done?' },
    { withName: (name) => `What are we working on, ${name}?`, withoutName: 'What are we working on?' }
  ],
  night: [
    { withName: (name) => `Good evening, ${name}.`, withoutName: 'Good evening.' },
    { withName: (name) => `Wrapping up for the day, ${name}?`, withoutName: 'Wrapping up for the day?' },
    { withName: (name) => `How's your evening going, ${name}?`, withoutName: "How's your evening going?" },
    { withName: (name) => `Anything else you want to get done, ${name}?`, withoutName: 'Anything else you want to get done?' },
    { withName: (name) => `What's on your mind, ${name}?`, withoutName: "What's on your mind?" }
  ]
}

export const CALBY_DYNAMIC_PROMPTS = [
  'What would you like to get done?',
  'Need to remember something?',
  'Want to check your schedule?',
  'Anything you want me to remember?',
  'Need a reminder?',
  'Want to know what\'s coming up?',
  'Tell me what\'s on your mind.',
  'Ready when you are.'
]

export function getTimePeriod(date: Date = new Date()): TimePeriod {
  const hour = date.getHours()
  if (hour >= 0 && hour < 5) return 'late_night'
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function getGreetingForPeriod(period: TimePeriod, index: number, userName?: string): string {
  const templates = GREETINGS_BY_PERIOD[period]
  const template = templates[index % templates.length]
  const cleanName = userName?.trim()
  if (cleanName) {
    return template.withName(cleanName)
  }
  return template.withoutName
}
