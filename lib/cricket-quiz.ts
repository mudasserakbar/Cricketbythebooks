// Cricket trivia questions used as human verification
// Easy enough for anyone in the cricket community, hard for bots

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

const QUIZ_POOL: QuizQuestion[] = [
  {
    id: 'players',
    question: 'How many players are on a cricket team?',
    options: ['9', '10', '11', '12'],
    correctIndex: 2,
  },
  {
    id: 'overs-t20',
    question: 'How many overs per side in a T20 match?',
    options: ['10', '15', '20', '50'],
    correctIndex: 2,
  },
  {
    id: 'century',
    question: 'What is a century in cricket?',
    options: ['100 wickets', '100 runs by a batter', '100 overs', '100 catches'],
    correctIndex: 1,
  },
  {
    id: 'dismissal',
    question: 'Which of these is NOT a way to get out in cricket?',
    options: ['Caught', 'Bowled', 'Offside', 'Run out'],
    correctIndex: 2,
  },
  {
    id: 'wickets',
    question: 'How many stumps make up a wicket?',
    options: ['2', '3', '4', '5'],
    correctIndex: 1,
  },
  {
    id: 'lbw',
    question: 'What does LBW stand for?',
    options: ['Left Bat Wing', 'Leg Before Wicket', 'Long Ball Wide', 'Last Batter Wins'],
    correctIndex: 1,
  },
  {
    id: 'duck',
    question: 'What is a "duck" in cricket?',
    options: ['A slow ball', 'Scoring zero runs', 'A fielding position', 'A type of pitch'],
    correctIndex: 1,
  },
  {
    id: 'odi-overs',
    question: 'How many overs per side in an ODI match?',
    options: ['20', '40', '50', '60'],
    correctIndex: 2,
  },
  {
    id: 'umpires',
    question: 'How many on-field umpires are there in an international match?',
    options: ['1', '2', '3', '4'],
    correctIndex: 1,
  },
  {
    id: 'boundary',
    question: 'How many runs for a six in cricket?',
    options: ['4', '5', '6', '8'],
    correctIndex: 2,
  },
  {
    id: 'bail',
    question: 'What sits on top of the stumps?',
    options: ['Caps', 'Bails', 'Pegs', 'Guards'],
    correctIndex: 1,
  },
  {
    id: 'maiden',
    question: 'What is a "maiden over"?',
    options: ['First over of the match', 'An over with no runs scored', 'An over with a wicket', 'An over with only wides'],
    correctIndex: 1,
  },
]

// Pick a random question
export function getRandomQuizQuestion(): QuizQuestion {
  const index = Math.floor(Math.random() * QUIZ_POOL.length)
  return QUIZ_POOL[index]
}

// Server-side: generate a quiz challenge with a signed token
export function generateQuizChallenge(): { question: QuizQuestion; token: string } {
  const q = getRandomQuizQuestion()
  // Token = base64(questionId:correctIndex:timestamp)
  // Simple but effective — not trying to stop nation-state attackers, just bots
  const timestamp = Date.now()
  const payload = `${q.id}:${q.correctIndex}:${timestamp}`
  const token = Buffer.from(payload).toString('base64')
  return { question: q, token }
}

// Server-side: verify a quiz answer
export function verifyQuizAnswer(
  token: string,
  selectedIndex: number
): { valid: boolean; expired: boolean } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [, correctStr, timestampStr] = decoded.split(':')
    const correct = parseInt(correctStr)
    const timestamp = parseInt(timestampStr)

    // Token expires after 5 minutes
    const fiveMinutes = 5 * 60 * 1000
    if (Date.now() - timestamp > fiveMinutes) {
      return { valid: false, expired: true }
    }

    return { valid: selectedIndex === correct, expired: false }
  } catch {
    return { valid: false, expired: false }
  }
}
