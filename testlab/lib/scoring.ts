import { QuestionType } from '@/types'

/**
 * Score a single answer against the correct answer
 */
export function scoreAnswer(
  selectedAnswer: string | string[],
  correctAnswer: string | string[],
  questionType: QuestionType
): { isCorrect: boolean; pointsEarned: number; maxPoints: number } {
  let isCorrect = false

  switch (questionType) {
    case 'single_choice':
      isCorrect = String(selectedAnswer).trim() === String(correctAnswer).trim()
      break

    case 'multiple_select':
      const selected = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer]
      const correct = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
      const selectedSorted = selected.map(s => String(s).trim()).sort()
      const correctSorted = correct.map(c => String(c).trim()).sort()
      isCorrect =
        selectedSorted.length === correctSorted.length &&
        selectedSorted.every((val, idx) => val === correctSorted[idx])
      break

    case 'free_response':
      const selectedStr = String(selectedAnswer).trim().toLowerCase()
      const correctStr = String(correctAnswer).trim().toLowerCase()

      // Try numeric comparison first
      const selectedNum = parseFloat(selectedStr)
      const correctNum = parseFloat(correctStr)

      if (!isNaN(selectedNum) && !isNaN(correctNum)) {
        // Compare with tolerance
        isCorrect = Math.abs(selectedNum - correctNum) < 0.001
      } else {
        // String comparison
        isCorrect = selectedStr === correctStr
      }
      break
  }

  return {
    isCorrect,
    pointsEarned: isCorrect ? 1.0 : 0,
    maxPoints: 1.0,
  }
}

/**
 * Normalize free response answer for comparison
 */
export function normalizeFreeResponse(answer: string): string {
  return answer.trim().toLowerCase()
}

