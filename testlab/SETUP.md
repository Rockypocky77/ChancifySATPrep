# TestLab Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and ensure `DATABASE_URL="file:./prisma/dev.db"`

3. **Initialize database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   Navigate to http://localhost:3000

## Adding Test Data

### Option 1: Using Prisma Studio (Recommended for initial setup)

```bash
npm run db:studio
```

This opens a GUI where you can:
1. Create a Test
2. Create TestSections for that test
3. Create Passages (if needed)
4. Create Questions with choices and correct answers

### Option 2: Using a Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test
  const test = await prisma.test.create({
    data: {
      title: 'SAT Practice Test 21',
      description: 'Full-length SAT practice test',
      totalDurationMinutes: 180,
      isActive: true,
      sections: {
        create: [
          {
            name: 'Reading & Writing',
            orderIndex: 0,
            durationMinutes: 64,
            questionCount: 54,
            instructions: 'Answer all questions in this section.',
            questions: {
              create: [
                {
                  orderIndex: 0,
                  questionType: 'single_choice',
                  prompt: 'What is the main idea of the passage?',
                  choices: JSON.stringify([
                    { key: 'A', text: 'Option A' },
                    { key: 'B', text: 'Option B' },
                    { key: 'C', text: 'Option C' },
                    { key: 'D', text: 'Option D' },
                  ]),
                  correctAnswer: 'B',
                  explanation: 'The passage primarily discusses...',
                  points: 1.0,
                },
                // Add more questions...
              ],
            },
          },
          {
            name: 'Math',
            orderIndex: 1,
            durationMinutes: 70,
            questionCount: 44,
            instructions: 'Answer all questions in this section.',
            questions: {
              create: [
                // Add math questions...
              ],
            },
          },
        ],
      },
    },
  })

  console.log('Created test:', test)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Then add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

## Current Limitations

- **Authentication**: Currently uses placeholder `userId: "user-1"`. To add real auth:
  1. Install NextAuth.js or similar
  2. Update API routes to get userId from session
  3. Update frontend to use auth context

- **Test Data**: You need to manually add test data. Consider creating an admin interface or importing from your markdown files.

## Next Steps

1. Add authentication (NextAuth.js recommended)
2. Create test import script from markdown files
3. Add score scaling (raw to SAT score conversion)
4. Add retake functionality
5. Add export to PDF feature

## Troubleshooting

**Database errors:**
- Delete `prisma/dev.db` and run `npm run db:push` again

**Type errors:**
- Run `npm run db:generate` to regenerate Prisma client

**Port already in use:**
- Change port in `package.json`: `"dev": "next dev -p 3001"`

