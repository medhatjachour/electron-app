import { RotateCcw, BookOpen } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTour } from '../../components/TourGuide/TourProvider'

export default function HelpSettings() {
  const { t } = useLanguage()
  const { startTour, resetTour } = useTour()

  const handleRestartTour = () => {
    resetTour()
    startTour()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          {t('helpCenter')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {t('helpCenter')}
        </p>
      </div>

      {/* Onboarding Tour Card */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 dark:border-primary/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('onboardingTour')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t('onboardingTourDesc')}
            </p>
            <button
              onClick={handleRestartTour}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              {t('restartTour')}
            </button>
          </div>
        </div>
      </div>

      {/* Additional Help Resources - Placeholder for future features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-6">
          <div className="text-slate-900 dark:text-white font-semibold mb-2">
            Documentation
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Access detailed guides and documentation
          </p>
          <button 
            disabled 
            className="text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-6">
          <div className="text-slate-900 dark:text-white font-semibold mb-2">
            Video Tutorials
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Watch step-by-step video tutorials
          </p>
          <button 
            disabled 
            className="text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  )
}
