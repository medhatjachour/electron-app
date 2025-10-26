/**
 * CustomerForm Component
 * Example of form with comprehensive validation
 */

import { useState } from 'react'
import { Save, X } from 'lucide-react'
import useFormValidation, { validationRules } from '../../hooks/useFormValidation'
import FormInput from '../ui/FormInput'
import FormSelect from '../ui/FormSelect'
import FormTextarea from '../ui/FormTextarea'
import logger from '../../../../shared/utils/logger'

interface CustomerFormProps {
  initialData?: CustomerFormData
  onSubmit: (data: CustomerFormData) => Promise<void>
  onCancel: () => void
}

export interface CustomerFormData {
  name: string
  email: string
  phone: string
  company: string
  tier: string
  notes: string
}

const tierOptions = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' }
]

export default function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useFormValidation<CustomerFormData>(
    initialData || {
      name: '',
      email: '',
      phone: '',
      company: '',
      tier: '',
      notes: ''
    },
    {
      name: [
        validationRules.required('Customer name is required'),
        validationRules.minLength(2, 'Name must be at least 2 characters'),
        validationRules.maxLength(100, 'Name must be less than 100 characters')
      ],
      email: [
        validationRules.required('Email is required'),
        validationRules.email('Please enter a valid email address')
      ],
      phone: [
        validationRules.required('Phone number is required'),
        validationRules.phone('Please enter a valid phone number')
      ],
      company: [
        validationRules.maxLength(100, 'Company name must be less than 100 characters')
      ],
      tier: [
        validationRules.required('Please select a customer tier')
      ],
      notes: [
        validationRules.maxLength(500, 'Notes must be less than 500 characters')
      ]
    }
  )

  const onFormSubmit = async () => {
    try {
      setSubmitError(null)
      logger.info('Submitting customer form', values)
      await onSubmit(values)
      logger.success('Customer saved successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save customer'
      setSubmitError(message)
      logger.error('Customer form submission error:', error)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit(onFormSubmit)
      }}
      className="space-y-6"
      noValidate
    >
      {/* Global Error */}
      {submitError && (
        <div
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            {submitError}
          </p>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          id="customer-name"
          label="Customer Name"
          type="text"
          value={values.name}
          onChange={(val) => void handleChange('name', val)}
          onBlur={() => void handleBlur('name')}
          error={errors.name}
          touched={touched.name}
          required
          placeholder="John Doe"
          autoComplete="name"
        />

        <FormInput
          id="customer-email"
          label="Email Address"
          type="email"
          value={values.email}
          onChange={(val) => void handleChange('email', val)}
          onBlur={() => void handleBlur('email')}
          error={errors.email}
          touched={touched.email}
          required
          placeholder="john@example.com"
          autoComplete="email"
        />

        <FormInput
          id="customer-phone"
          label="Phone Number"
          type="tel"
          value={values.phone}
          onChange={(val) => void handleChange('phone', val)}
          onBlur={() => void handleBlur('phone')}
          error={errors.phone}
          touched={touched.phone}
          required
          placeholder="+1 (555) 123-4567"
          autoComplete="tel"
          helperText="Include country code for international numbers"
        />

        <FormInput
          id="customer-company"
          label="Company Name"
          type="text"
          value={values.company}
          onChange={(val) => void handleChange('company', val)}
          onBlur={() => void handleBlur('company')}
          error={errors.company}
          touched={touched.company}
          placeholder="Acme Corporation"
          autoComplete="organization"
        />

        <FormSelect
          id="customer-tier"
          label="Customer Tier"
          value={values.tier}
          onChange={(val) => void handleChange('tier', val)}
          onBlur={() => void handleBlur('tier')}
          error={errors.tier}
          touched={touched.tier}
          required
          options={tierOptions}
          placeholder="Select tier level"
        />
      </div>

      <FormTextarea
        id="customer-notes"
        label="Notes"
        value={values.notes}
        onChange={(val) => void handleChange('notes', val)}
        onBlur={() => void handleBlur('notes')}
        error={errors.notes}
        touched={touched.notes}
        placeholder="Additional customer information..."
        rows={4}
        maxLength={500}
        showCharCount
        helperText="Optional notes about the customer"
      />

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-slate-700 dark:text-slate-300"
          disabled={isSubmitting}
        >
          <X size={18} aria-hidden="true" />
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} aria-hidden="true" />
              Save Customer
            </>
          )}
        </button>
      </div>
    </form>
  )
}
