import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_QUESTIONS = [
  { text: 'How effectively does this person communicate ideas and updates?', type: 'RATING' as const, ratingScale: 5, category: 'Communication', sortOrder: 1 },
  { text: 'Describe a specific example of strong or weak communication from this person.', type: 'OPEN_TEXT' as const, category: 'Communication', sortOrder: 2 },
  { text: 'How well does this person collaborate with team members?', type: 'RATING' as const, ratingScale: 5, category: 'Collaboration', sortOrder: 3 },
  { text: 'How effectively does this person solve problems under pressure?', type: 'RATING' as const, ratingScale: 5, category: 'Problem Solving', sortOrder: 4 },
  { text: 'Describe a situation where this person handled a challenge well or poorly.', type: 'OPEN_TEXT' as const, category: 'Problem Solving', sortOrder: 5 },
  { text: 'How well does this person demonstrate leadership qualities?', type: 'RATING' as const, ratingScale: 5, category: 'Leadership', sortOrder: 6 },
  { text: 'How actively does this person seek to grow and improve?', type: 'RATING' as const, ratingScale: 5, category: 'Growth', sortOrder: 7 },
  { text: 'What is one thing this person should start, stop, or continue doing?', type: 'OPEN_TEXT' as const, category: 'Growth', sortOrder: 8 },
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
