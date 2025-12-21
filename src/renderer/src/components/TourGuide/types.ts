/**
 * Tour Guide Types
 */

export interface TourStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: () => void | Promise<void>
  skipable?: boolean
  isBlocking?: boolean // Must complete this step before proceeding
}

export interface TourProgress {
  currentStep: number
  completedSteps: string[]
  skippedSteps: string[]
  startedAt: string
  lastUpdated: string
}

export type TourStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped'
