'use client'

import { useState } from 'react'
import { X, Phone, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { CustomerData } from '@/lib/google-sheets'
import { PhoneValidationResult } from '@/lib/twilio'

interface ValidationModalProps {
  customer: CustomerData
  onClose: () => void
  onCustomerUpdated: (customer: CustomerData) => void
}

export default function ValidationModal({
  customer,
  onClose,
  onCustomerUpdated
}: ValidationModalProps) {
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<PhoneValidationResult | null>(null)
  const [phoneNumber, setPhoneNumber] = useState(customer.mobile || customer.phone || '')

  const handleValidate = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    setValidating(true)
    try {
      const response = await fetch('/api/validate/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          phoneNumber: phoneNumber.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setValidationResult(data.validationResult)
        onCustomerUpdated(data.customer)
        toast.success('Validation completed successfully!')
      } else {
        toast.error(data.error || 'Validation failed')
      }
    } catch (error) {
      console.error('Validation error:', error)
      toast.error('Network error during validation')
    } finally {
      setValidating(false)
    }
  }

  const formatPhoneNumber = (number: string) => {
    return number || 'Not provided'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Phone className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Validate Phone Number
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Client ID:</span>
                <span className="ml-2 text-gray-900">{customer.clientId || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <span className="ml-2 text-gray-900">{customer.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900">{customer.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Account Name:</span>
                <span className="ml-2 text-gray-900">{customer.accountName || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Country:</span>
                <span className="ml-2 text-gray-900">{customer.countryCode || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Country Mobile Code:</span>
                <span className="ml-2 text-gray-900">{customer.countryMobileCode || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Language:</span>
                <span className="ml-2 text-gray-900">{customer.language || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Account Owner:</span>
                <span className="ml-2 text-gray-900">{customer.accountOwner || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number to Validate
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input-field"
              placeholder="Enter phone number (e.g., +1234567890)"
              disabled={validating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Include country code for best results (e.g., +1 for US, +44 for UK)
            </p>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-5 w-5 text-success-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-danger-600" />
                )}
                <span>Validation Results</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`ml-2 ${validationResult.isValid ? 'text-success-600' : 'text-danger-600'}`}>
                    {validationResult.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600">WhatsApp Capable:</span>
                  <span className={`ml-2 ${validationResult.isWhatsAppCapable ? 'text-success-600' : 'text-danger-600'}`}>
                    {validationResult.isWhatsAppCapable ? 'Yes' : 'No'}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-600">Line Type:</span>
                  <span className="ml-2 text-gray-900 capitalize">
                    {validationResult.lineType || 'Unknown'}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-600">Mobile:</span>
                  <span className={`ml-2 ${validationResult.isMobile ? 'text-success-600' : 'text-warning-600'}`}>
                    {validationResult.isMobile ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Formatted Number:</span>
                  <span className="ml-2 text-gray-900 font-mono">
                    {validationResult.internationalFormat || validationResult.phoneNumber}
                  </span>
                </div>

                {validationResult.carrier && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Carrier:</span>
                    <span className="ml-2 text-gray-900">{validationResult.carrier}</span>
                  </div>
                )}

                {validationResult.error && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Error:</span>
                    <span className="ml-2 text-danger-600">{validationResult.error}</span>
                  </div>
                )}
              </div>

              {/* WhatsApp Status Badge */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-center">
                  {validationResult.isWhatsAppCapable ? (
                    <div className="bg-success-100 text-success-800 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>✅ WhatsApp Ready</span>
                    </div>
                  ) : (
                    <div className="bg-danger-100 text-danger-800 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
                      <XCircle className="h-4 w-4" />
                      <span>❌ Not WhatsApp Compatible</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={validating}
          >
            Close
          </button>
          <button
            onClick={handleValidate}
            disabled={validating || !phoneNumber.trim()}
            className="btn-primary flex items-center space-x-2"
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                <span>Validate with Twilio</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
