'use client'

import { useState } from 'react'
import { CheckCircle2, Search, Loader2, AlertCircle, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface BulkOperationsProps {
  selectedCustomers: string[]
  onOperationComplete: () => void
}

interface BulkResult {
  total: number
  processed: number
  successful: number
  valid: number
  invalid: number
  errors: number
}

export default function BulkOperations({
  selectedCustomers,
  onOperationComplete
}: BulkOperationsProps) {
  const [validating, setValidating] = useState(false)
  const [progress, setProgress] = useState<BulkResult | null>(null)

  const handleBulkValidation = async (validateAll: boolean = false) => {
    const customerIds = validateAll ? [] : selectedCustomers

    if (!validateAll && customerIds.length === 0) {
      toast.error('Please select customers to validate')
      return
    }

    setValidating(true)
    setProgress(null)

    try {
      const response = await fetch('/api/validate/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerIds
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setProgress(data.summary)
        toast.success(
          `Bulk validation completed! ${data.summary.valid} valid WhatsApp numbers found`
        )
        onOperationComplete()
      } else {
        toast.error(data.error || 'Bulk validation failed')
      }
    } catch (error) {
      console.error('Bulk validation error:', error)
      toast.error('Network error during bulk validation')
    } finally {
      setValidating(false)
    }
  }

  const getProgressPercentage = () => {
    if (!progress) return 0
    return Math.round((progress.processed / progress.total) * 100)
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Bulk Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleBulkValidation(false)}
          disabled={validating || selectedCustomers.length === 0}
          className="btn-primary flex items-center space-x-2"
        >
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Validate Selected ({selectedCustomers.length})</span>
            </>
          )}
        </button>

        <button
          onClick={() => handleBulkValidation(true)}
          disabled={validating}
          className="btn-warning flex items-center space-x-2"
        >
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating All...</span>
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              <span>Validate All Customers</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Display */}
      {progress && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-success-600" />
            <span>Bulk Validation Results</span>
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{progress.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.processed}</div>
              <div className="text-xs text-gray-600">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">{progress.valid}</div>
              <div className="text-xs text-gray-600">Valid WhatsApp</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">{progress.invalid}</div>
              <div className="text-xs text-gray-600">Invalid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger-600">{progress.errors}</div>
              <div className="text-xs text-gray-600">Errors</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 text-center">
            {getProgressPercentage()}% Complete
          </div>

          {/* Success Rate */}
          {progress.processed > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-medium text-gray-900">
                  {Math.round((progress.successful / progress.processed) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">WhatsApp Capable:</span>
                <span className="font-medium text-success-600">
                  {Math.round((progress.valid / progress.processed) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Information Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Bulk Validation Information:</p>
            <ul className="space-y-1 text-xs">
              <li>• Validation is processed in batches to avoid rate limits</li>
              <li>• Each phone number is validated using Twilio's Lookup API</li>
              <li>• Results are automatically saved to your Google Sheet</li>
              <li>• Invalid numbers can be updated using the search feature</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}



