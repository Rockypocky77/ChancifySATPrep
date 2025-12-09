import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/answers/:answerId/flag
 * Toggles flagged status of an answer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { answerId: string } }
) {
  try {
    const body = await request.json()
    const { flagged } = body

    if (typeof flagged !== 'boolean') {
      return NextResponse.json({ error: 'flagged must be a boolean' }, { status: 400 })
    }

    const answer = await prisma.answer.update({
      where: { id: params.answerId },
      data: { flagged },
    })

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Error updating flag:', error)
    return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 })
  }
}

