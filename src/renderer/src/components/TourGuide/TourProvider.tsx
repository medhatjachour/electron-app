/**
 * Tour Context Provider
 * Manages tour state and provides tour control functions
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import TourGuide from './TourGuide'
import type { TourStep, TourProgress, TourStatus } from './types'

interface TourContextType {
  startTour: () => void
  resetTour: () => void
  skipTour: () => void
  isTourActive: boolean
  tourStatus: TourStatus
  currentStep: number
}

const TourContext = createContext<TourContextType | undefined>(undefined)

const TOUR_STORAGE_KEY = 'bizflow_tour_progress'

export function TourProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showTour, setShowTour] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tourStatus, setTourStatus] = useState<TourStatus>('not-started')

  // Define comprehensive tour steps - synchronized with navigation
  const tourSteps: TourStep[] = [
    // Welcome
    {
      id: 'welcome',
      title: t('tourWelcome'),
      description: t('tourWelcomeDesc'),
      position: 'center',
      skipable: true
    },
    
    // Step 1: User Management
    {
      id: 'users-nav',
      title: t('tourCreateAdmin'),
      description: t('tourCreateAdminDesc'),
      target: '[data-tour="settings-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 2: Store Setup
    {
      id: 'stores-nav',
      title: t('tourCreateStore'),
      description: t('tourCreateStoreDesc'),
      target: '[data-tour="stores-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 3: Categories
    {
      id: 'categories-nav',
      title: t('tourCreateCategory'),
      description: t('tourCreateCategoryDesc'),
      target: '[data-tour="settings-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 4: Products
    {
      id: 'products-nav',
      title: t('tourProductsIntro'),
      description: t('tourProductsIntroDesc'),
      target: '[data-tour="products-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 5: Product Features
    {
      id: 'product-features',
      title: t('tourProductVariants'),
      description: t('tourProductVariantsDesc'),
      position: 'center',
      skipable: true
    },
    
    // Step 6: Inventory
    {
      id: 'inventory-nav',
      title: t('tourInventoryTracking'),
      description: t('tourInventoryTrackingDesc'),
      target: '[data-tour="inventory-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 7: POS
    {
      id: 'pos-nav',
      title: t('tourPOSSystem'),
      description: t('tourPOSSystemDesc'),
      target: '[data-tour="pos-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 8: POS Features
    {
      id: 'pos-features',
      title: t('tourPOSFeatures'),
      description: t('tourPOSFeaturesDesc'),
      position: 'center',
      skipable: true
    },
    
    // Step 9: Finance
    {
      id: 'finance-nav',
      title: t('tourFinanceOverview'),
      description: t('tourFinanceOverviewDesc'),
      target: '[data-tour="finance-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 10: Profit Tracking
    {
      id: 'profit-info',
      title: t('tourProfitCalculation'),
      description: t('tourProfitCalculationDesc'),
      position: 'center',
      skipable: true
    },
    
    // Step 11: Customers
    {
      id: 'customers-nav',
      title: t('tourCustomers'),
      description: t('tourCustomersDesc'),
      target: '[data-tour="customers-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 12: Sales
    {
      id: 'sales-nav',
      title: t('tourSalesTracking'),
      description: t('tourSalesTrackingDesc'),
      target: '[data-tour="sales-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 13: Reports
    {
      id: 'reports-nav',
      title: t('tourReports'),
      description: t('tourReportsDesc'),
      target: '[data-tour="reports-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 14: Employees
    {
      id: 'employees-nav',
      title: t('tourEmployees'),
      description: t('tourEmployeesDesc'),
      target: '[data-tour="employees-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Step 15: Backup
    {
      id: 'backup-nav',
      title: t('tourBackup'),
      description: t('tourBackupDesc'),
      target: '[data-tour="settings-menu"]',
      position: 'right',
      skipable: true
    },
    
    // Completion
    {
      id: 'complete',
      title: t('tourComplete'),
      description: t('tourCompleteDesc'),
      position: 'center',
      skipable: false
    }
  ]

  // Load tour progress from storage and start tour after first login
  useEffect(() => {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY)
    console.log('Tour check - stored progress:', stored)
    
    if (stored) {
      try {
        const progress: TourProgress = JSON.parse(stored)
        console.log('Tour progress:', progress)
        
        if (progress.completedSteps.includes('complete')) {
          setTourStatus('completed')
          console.log('Tour already completed')
        } else if (progress.skippedSteps.length > 0) {
          setTourStatus('skipped')
          console.log('Tour was skipped')
        } else {
          // Resume tour from saved progress
          setTourStatus('in-progress')
          setCurrentStep(progress.currentStep)
          // Don't auto-show resumed tour, only manual trigger
          console.log('Tour in progress at step:', progress.currentStep)
        }
      } catch (error) {
        console.error('Failed to parse tour progress:', error)
      }
    } else if (user) {
      // First time user after login - show tour after a short delay
      console.log('First time user - starting tour in 1.5s')
      setTimeout(() => {
        console.log('Starting fresh tour now')
        setShowTour(true)
        setTourStatus('in-progress')
        setCurrentStep(0)
        saveTourProgress(0, [], [])
      }, 1500)
    }
  }, [user])

  const saveTourProgress = (step: number, completed: string[], skipped: string[]) => {
    const progress: TourProgress = {
      currentStep: step,
      completedSteps: completed,
      skippedSteps: skipped,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(progress))
  }

  const startTour = () => {
    setShowTour(true)
    setCurrentStep(0)
    setTourStatus('in-progress')
    saveTourProgress(0, [], [])
  }

  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY)
    startTour()
  }

  const skipTour = () => {
    setShowTour(false)
    setTourStatus('skipped')
    const progress: TourProgress = JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY) || '{}')
    saveTourProgress(
      currentStep,
      progress.completedSteps || [],
      [...(progress.skippedSteps || []), tourSteps[currentStep].id]
    )
  }

  const handleNext = async () => {
    const currentStepData = tourSteps[currentStep]
    const nextStep = currentStep + 1
    
    // Save progress first
    const progress: TourProgress = JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY) || '{}')
    saveTourProgress(
      nextStep,
      [...(progress.completedSteps || []), tourSteps[currentStep].id],
      progress.skippedSteps || []
    )
    
    // Move to next step
    setCurrentStep(nextStep)
    
    // Navigate AFTER moving to next step, with a small delay for smooth transition
    setTimeout(() => {
      const nextStepData = tourSteps[nextStep]
      if (!nextStepData) return
      
      if (nextStepData.id === 'users-nav' || nextStepData.id === 'categories-nav' || nextStepData.id === 'backup-nav') {
        navigate('/settings')
      } else if (nextStepData.id === 'stores-nav') {
        navigate('/stores')
      } else if (nextStepData.id === 'products-nav') {
        navigate('/products')
      } else if (nextStepData.id === 'inventory-nav') {
        navigate('/inventory')
      } else if (nextStepData.id === 'pos-nav') {
        navigate('/pos')
      } else if (nextStepData.id === 'finance-nav') {
        navigate('/finance')
      } else if (nextStepData.id === 'customers-nav') {
        navigate('/customers')
      } else if (nextStepData.id === 'sales-nav') {
        navigate('/sales')
      } else if (nextStepData.id === 'reports-nav') {
        navigate('/reports')
      } else if (nextStepData.id === 'employees-nav') {
        navigate('/employees')
      }
    }, 300)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setShowTour(false)
    setTourStatus('completed')
    const progress: TourProgress = JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY) || '{}')
    saveTourProgress(
      tourSteps.length - 1,
      [...(progress.completedSteps || []), 'complete'],
      progress.skippedSteps || []
    )
    navigate('/')
  }

  return (
    <TourContext.Provider
      value={{
        startTour,
        resetTour,
        skipTour,
        isTourActive: showTour,
        tourStatus,
        currentStep
      }}
    >
      {children}
      {showTour && (
        <TourGuide
          steps={tourSteps}
          currentStep={currentStep}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={skipTour}
          onComplete={handleComplete}
        />
      )}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within TourProvider')
  }
  return context
}
