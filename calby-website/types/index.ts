export interface NavItem {
  label: string;
  href: string;
}

export * from './product';

export interface WorkflowStep {
  step: string;
  stage: string;
  title: string;
  description: string;
  microPreview: {
    type: 'capture' | 'parse' | 'execute' | 'deliver';
    content: string;
    badge?: string;
  };
}

export interface SimulatedState {
  id: string;
  userSpeech: string;
  intent: string;
  eventTitle: string;
  eventTime: string;
  service: string;
  contextSnippet?: string;
}
