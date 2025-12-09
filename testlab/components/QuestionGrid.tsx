'use client'

interface QuestionGridProps {
  totalQuestions: number
  currentQuestionIndex: number
  answeredQuestions: Set<number>
  flaggedQuestions: Set<number>
  onQuestionClick: (index: number) => void
}

export function QuestionGrid({
  totalQuestions,
  currentQuestionIndex,
  answeredQuestions,
  flaggedQuestions,
  onQuestionClick,
}: QuestionGridProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold mb-3 text-sm text-gray-700">Question Navigator</h3>
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const questionNum = i + 1
          const isAnswered = answeredQuestions.has(questionNum)
          const isFlagged = flaggedQuestions.has(questionNum)
          const isCurrent = currentQuestionIndex === i

          return (
            <button
              key={questionNum}
              onClick={() => onQuestionClick(i)}
              className={`
                w-10 h-10 rounded text-sm font-medium transition-colors
                ${isCurrent ? 'bg-blue-600 text-white ring-2 ring-blue-300' : ''}
                ${!isCurrent && isAnswered ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                ${!isCurrent && !isAnswered ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : ''}
                ${isFlagged ? 'ring-2 ring-yellow-400' : ''}
              `}
              title={`Question ${questionNum}${isFlagged ? ' (flagged)' : ''}`}
            >
              {questionNum}
              {isFlagged && (
                <span className="absolute -top-1 -right-1 text-yellow-500 text-xs">⚑</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
          <span>Unanswered</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-yellow-400 rounded mr-2"></div>
          <span>Flagged</span>
        </div>
      </div>
    </div>
  )
}

