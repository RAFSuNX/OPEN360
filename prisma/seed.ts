import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const DEFAULT_QUESTIONS = [
  // Communication
  { text: 'How effectively does this person communicate expectations and complex information clearly?', type: 'RATING' as const, ratingScale: 5, category: 'Communication', sortOrder: 1 },
  { text: 'How well does this person balance speaking and listening in conversations and meetings?', type: 'RATING' as const, ratingScale: 5, category: 'Communication', sortOrder: 2 },
  { text: 'Share a specific example of when this person communicated a difficult message or navigated a challenging conversation. What was the outcome?', type: 'OPEN_TEXT' as const, category: 'Communication', sortOrder: 3 },

  // Collaboration
  { text: 'How effectively does this person collaborate with colleagues across different teams and functions?', type: 'RATING' as const, ratingScale: 5, category: 'Collaboration', sortOrder: 4 },
  { text: 'To what extent does this person support peers on their work, even when there is no direct benefit to their own goals?', type: 'RATING' as const, ratingScale: 5, category: 'Collaboration', sortOrder: 5 },
  { text: 'Describe a situation where this person demonstrated strong teamwork or faced collaboration challenges. What was the outcome?', type: 'OPEN_TEXT' as const, category: 'Collaboration', sortOrder: 6 },

  // Leadership
  { text: 'How effectively does this person inspire and motivate others to achieve goals?', type: 'RATING' as const, ratingScale: 5, category: 'Leadership', sortOrder: 7 },
  { text: 'How well does this person develop the skills and capabilities of team members or colleagues?', type: 'RATING' as const, ratingScale: 5, category: 'Leadership', sortOrder: 8 },
  { text: 'Provide an example of when this person demonstrated strong leadership or navigated a difficult leadership challenge. What was the impact?', type: 'OPEN_TEXT' as const, category: 'Leadership', sortOrder: 9 },

  // Problem Solving
  { text: 'How effectively does this person approach challenges and develop creative or practical solutions?', type: 'RATING' as const, ratingScale: 5, category: 'Problem Solving', sortOrder: 10 },
  { text: 'Describe a time when this person approached a problem creatively or with good judgment. What was the approach and impact?', type: 'OPEN_TEXT' as const, category: 'Problem Solving', sortOrder: 11 },

  // Accountability
  { text: 'How dependable is this person in meeting deadlines and following through on commitments?', type: 'RATING' as const, ratingScale: 5, category: 'Accountability', sortOrder: 12 },
  { text: 'How well does this person take ownership of their work and acknowledge both successes and failures?', type: 'RATING' as const, ratingScale: 5, category: 'Accountability', sortOrder: 13 },
  { text: 'Describe a situation where this person took responsibility for results - positive or negative - and what action they took.', type: 'OPEN_TEXT' as const, category: 'Accountability', sortOrder: 14 },

  // Execution & Delivery
  { text: 'How effectively does this person prioritize tasks and consistently deliver high-quality work?', type: 'RATING' as const, ratingScale: 5, category: 'Execution', sortOrder: 15 },
  { text: 'How well does this person align their day-to-day work with broader team and organizational goals?', type: 'RATING' as const, ratingScale: 5, category: 'Execution', sortOrder: 16 },
  { text: 'Share an example of when this person delivered exceptional results on a project or task. What contributed to their success?', type: 'OPEN_TEXT' as const, category: 'Execution', sortOrder: 17 },

  // Growth & Learning
  { text: 'How consistently does this person seek feedback and apply it to improve their performance?', type: 'RATING' as const, ratingScale: 5, category: 'Growth', sortOrder: 18 },
  { text: 'To what extent does this person take initiative to develop new skills or deepen their expertise?', type: 'RATING' as const, ratingScale: 5, category: 'Growth', sortOrder: 19 },
  { text: 'Describe a specific instance where this person took action to learn or grow. What did they do and what changed as a result?', type: 'OPEN_TEXT' as const, category: 'Growth', sortOrder: 20 },

  // Emotional Intelligence
  { text: 'How effectively does this person manage their own emotions in stressful or high-pressure situations?', type: 'RATING' as const, ratingScale: 5, category: 'Emotional Intelligence', sortOrder: 21 },
  { text: 'How well does this person empathize with others and maintain positive working relationships, even during disagreements?', type: 'RATING' as const, ratingScale: 5, category: 'Emotional Intelligence', sortOrder: 22 },
  { text: 'Describe a situation where this person showed strong emotional intelligence - such as managing conflict, showing empathy, or adapting to others. What was the outcome?', type: 'OPEN_TEXT' as const, category: 'Emotional Intelligence', sortOrder: 23 },

  // Overall
  { text: 'What is one thing this person should start doing, one thing they should stop doing, and one thing they should keep doing?', type: 'OPEN_TEXT' as const, category: 'Overall', sortOrder: 24 },
]

async function main() {
  const result = await prisma.question.createMany({
    data: DEFAULT_QUESTIONS,
    skipDuplicates: true,
  })
  console.log(`Seeded ${result.count} new questions (existing skipped).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
