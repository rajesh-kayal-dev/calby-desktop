export type ShowcaseTab = 'voice' | 'reminders' | 'calendar' | 'memory';

export interface NavItem {
  label: string;
  href: string;
}

export interface TrustItem {
  title: string;
  description: string;
  iconName: 'hard-drive' | 'brain' | 'bell-off';
}
