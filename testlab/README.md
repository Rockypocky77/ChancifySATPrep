# TestLab - SAT Practice Test Platform

A full-stack web application for taking timed SAT practice tests with detailed review capabilities.

## Features

- **Timed Test Sections**: Each section has its own timer with auto-submit on expiration
- **Question Navigation**: Navigate between questions within a section
- **Auto-save Answers**: Answers are saved automatically as you work
- **Flag Questions**: Mark questions for later review
- **Review Mode**: Review all questions with explanations, filter by correct/incorrect/flagged
- **Score Tracking**: Automatic scoring with per-section and overall statistics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma)
- **ORM**: Prisma
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:
```
DATABASE_URL="file:./prisma/dev.db"
```

3. Generate Prisma client and set up database:
```bash
npm run db:generate
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
testlab/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── tests/         # Test endpoints
│   │   ├── attempts/      # Attempt endpoints
│   │   ├── section-attempts/ # Section attempt endpoints
│   │   ├── answers/       # Answer endpoints
│   │   └── review/        # Review endpoints
│   ├── (tests)/           # Test pages
│   ├── attempts/          # Attempt pages
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── SectionTimer.tsx   # Timer component
│   └── QuestionGrid.tsx   # Question navigation grid
├── lib/                   # Utility libraries
│   ├── prisma.ts          # Prisma client
│   ├── scoring.ts          # Scoring logic
│   └── timer.ts           # Timer utilities
├── prisma/                # Prisma schema
│   └── schema.prisma      # Database schema
└── types/                 # TypeScript types
    └── index.ts           # Shared types
```

## API Endpoints

### Tests
- `GET /api/tests` - List all active tests
- `GET /api/tests/:testId` - Get test details
- `POST /api/tests/:testId/attempts` - Create a new test attempt

### Attempts
- `GET /api/attempts/:attemptId` - Get attempt details

### Section Attempts
- `POST /api/section-attempts/:sectionAttemptId/start` - Start a section
- `PATCH /api/section-attempts/:sectionAttemptId/heartbeat` - Update timer
- `POST /api/section-attempts/:sectionAttemptId/complete` - Complete a section

### Answers
- `POST /api/answers` - Save an answer
- `PATCH /api/answers/:answerId/flag` - Toggle flag status

### Review
- `GET /api/review/:attemptId/summary` - Get review summary
- `GET /api/review/:attemptId/questions` - Get review questions (with filters)
- `GET /api/review/:attemptId/questions/:questionId` - Get question details

## Database Schema

The application uses Prisma with SQLite. Key models:

- **Test**: Test metadata
- **TestSection**: Sections within a test
- **Question**: Questions with choices and correct answers
- **Passage**: Reading passages for passage-based questions
- **TestAttempt**: User's attempt at a test
- **SectionAttempt**: User's attempt at a section
- **Answer**: User's answer to a question

## Adding Test Data

To add test data, you'll need to:

1. Create a Test record
2. Create TestSection records for each section
3. Create Passage records (if needed)
4. Create Question records with choices and correct answers

You can use Prisma Studio to add data:
```bash
npm run db:studio
```

Or create a seed script in `prisma/seed.ts`.

## Development Notes

- Currently uses a placeholder `userId` ("user-1"). In production, integrate with authentication.
- Timer syncs with server every 30 seconds to prevent cheating.
- Answers are auto-saved on change.
- Sections auto-submit when timer expires.

## Future Enhancements

- User authentication
- Multiple attempts per test
- Score scaling (raw to SAT score conversion)
- Admin panel for test creation
- Export results as PDF
- Practice mode (untimed)

## License

MIT

