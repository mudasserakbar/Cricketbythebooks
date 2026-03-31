export interface Scenario {
  id: string
  emoji: string
  title: string
  subtitle: string
  starterQuestion: string
  color: string
  borderColor: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'suspension',
    emoji: '🚫',
    title: 'Got suspended or disciplined?',
    subtitle: 'Understand what happens next and your rights',
    starterQuestion: 'What are my rights if I receive a suspension or disciplinary notice?',
    color: 'bg-red-50',
    borderColor: 'hover:border-red-200',
  },
  {
    id: 'registration',
    emoji: '📋',
    title: 'Not sure about registration?',
    subtitle: 'Check if you or your child is properly registered',
    starterQuestion: 'What are the registration requirements for players and what documents are needed?',
    color: 'bg-blue-50',
    borderColor: 'hover:border-blue-200',
  },
  {
    id: 'eligibility',
    emoji: '⚖️',
    title: 'Eligibility question?',
    subtitle: 'Playing for multiple teams, provincial, or national',
    starterQuestion: 'What are the eligibility rules for playing in this organization?',
    color: 'bg-violet-50',
    borderColor: 'hover:border-violet-200',
  },
  {
    id: 'conduct',
    emoji: '🤝',
    title: 'Code of conduct issue?',
    subtitle: 'Complaints about behaviour on or off the field',
    starterQuestion: 'What does the code of conduct cover and how are violations handled?',
    color: 'bg-amber-50',
    borderColor: 'hover:border-amber-200',
  },
  {
    id: 'rules',
    emoji: '🏏',
    title: 'Playing rules question?',
    subtitle: 'How the game is played officially in this org',
    starterQuestion: 'What are the official playing rules for matches in this organization?',
    color: 'bg-emerald-50',
    borderColor: 'hover:border-emerald-200',
  },
  {
    id: 'complaint',
    emoji: '📝',
    title: 'Want to file a complaint?',
    subtitle: 'How to formally raise a concern or grievance',
    starterQuestion: 'How do I file a formal complaint and what is the process?',
    color: 'bg-orange-50',
    borderColor: 'hover:border-orange-200',
  },
]
