/**
 * Tour Guide Component
 * Displays step-by-step onboarding tour with highlighting and tooltips
 */

import { useState, useEffect, useRef } from 'react'
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import type { TourStep } from './types'

interface TourGuideProps {
  steps: TourStep[]
  currentStep: number
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onComplete: () => void
}

export default function TourGuide({
  steps,
  currentStep,
  onNext,
  onBack,
  onSkip,
  onComplete
}: TourGuideProps) {
  const { t } = useLanguage()
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  useEffect(() => {
    if (!step.target) {
      // Center tooltip for non-targeted steps
      setHighlightRect(null)
      return
    }

    const element = document.querySelector(step.target) as HTMLElement
    if (!element) {
      console.warn(`Tour target not found: ${step.target}`)
      setHighlightRect(null)
      return
    }

    // Get element position
    const rect = element.getBoundingClientRect()
    setHighlightRect(rect)

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })

    // Calculate tooltip position
    const updateTooltipPosition = () => {
      if (!tooltipRef.current) return

      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const padding = 20
      let top = 0
      let left = 0

      switch (step.position) {
        case 'top':
          top = rect.top - tooltipRect.height - padding
          left = rect.left + rect.width / 2 - tooltipRect.width / 2
          break
        case 'bottom':
          top = rect.bottom + padding
          left = rect.left + rect.width / 2 - tooltipRect.width / 2
          break
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2
          left = rect.left - tooltipRect.width - padding
          break
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2
          left = rect.right + padding
          break
        default:
          top = window.innerHeight / 2 - tooltipRect.height / 2
          left = window.innerWidth / 2 - tooltipRect.width / 2
      }

      // Keep tooltip within viewport
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))

      setTooltipPosition({ top, left })
    }

    // Small delay to ensure tooltip is rendered
    setTimeout(updateTooltipPosition, 50)

    // Update on window resize
    window.addEventListener('resize', updateTooltipPosition)
    return () => window.removeEventListener('resize', updateTooltipPosition)
  }, [step, currentStep])

  const handleNext = async () => {
    if (step.action) {
      await step.action()
    }
    if (isLastStep) {
      onComplete()
    } else {
      onNext()
    }
  }

  return (
    <>
      {/* Overlay with cutout for highlighted element */}
      <div className="fixed inset-0 z-[9998]">
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - 4}
                  y={highlightRect.top - 4}
                  width={highlightRect.width + 8}
                  height={highlightRect.height + 8}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#tour-mask)"
            onClick={step.skipable !== false ? onSkip : undefined}
            style={{ cursor: step.skipable !== false ? 'pointer' : 'default' }}
          />
        </svg>

        {/* Animated highlight ring */}
        {highlightRect && (
          <div
            className="absolute pointer-events-none animate-pulse"
            style={{
              top: highlightRect.top - 6,
              left: highlightRect.left - 6,
              width: highlightRect.width + 12,
              height: highlightRect.height + 12,
              border: '3px solid #3b82f6',
              borderRadius: '10px',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] w-[420px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-primary" size={20} />
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {t('step')} {currentStep + 1} / {steps.length}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {step.title}
              </h3>
            </div>
            {step.skipable !== false && (
              <button
                onClick={onSkip}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title={t('skipTour')}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Content */}
          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% {t('complete')}</span>
              <span>{steps.length - currentStep - 1} {t('stepsRemaining')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            {step.skipable !== false && (
              <button
                onClick={onSkip}
                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors font-medium"
              >
                {t('skipTour')}
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {!isFirstStep && (
                <button
                  onClick={onBack}
                  className="px-4 py-2.5 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  {t('back')}
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg hover:scale-105 transition-all font-medium flex items-center gap-2"
              >
                {isLastStep ? (
                  <>
                    <Check size={18} />
                    {t('finish')}
                  </>
                ) : (
                  <>
                    {t('next')}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
