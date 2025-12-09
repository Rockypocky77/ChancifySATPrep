export type QuestionType = 'single_choice' | 'multiple_select' | 'free_response'

export type TestAttemptStatus = 'not_started' | 'in_progress' | 'completed' | 'expired'
export type SectionAttemptStatus = 'not_started' | 'in_progress' | 'completed' | 'expired'

export interface Choice {
  key: string
  text: string
}

export interface QuestionMetadata {
  skill?: string
  difficulty?: string
  [key: string]: any
}

export interface ScaledScore {
  ReadingWriting?: number
  Math?: number
  Total?: number
}

