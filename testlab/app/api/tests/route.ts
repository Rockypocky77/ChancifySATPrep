import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tests
 * Returns list of active tests
 */
export async function GET(request: NextRequest) {
  try {
    const tests = await prisma.test.findMany({
      where: {
        isActive: true,
      },
      include: {
        sections: {
          orderBy: {
            orderIndex: 'asc',
          },
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            questionCount: true,
            orderIndex: true,
          },
        },
        _count: {
          select: {
            sections: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedTests = tests.map((test) => ({
      id: test.id,
      title: test.title,
      description: test.description,
      totalDurationMinutes: test.totalDurationMinutes,
      sectionCount: test._count.sections,
      sections: test.sections,
    }))

    return NextResponse.json({ tests: formattedTests })
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
  }
}

