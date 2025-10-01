'use client'

import { useState } from 'react'
import { X, Search, Phone, User, Building, Mail, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { CustomerData } from '@/lib/google-sheets'
import { ContactSearchResult } from '@/lib/amplemarket'

interface SearchModalProps {
  customer: CustomerData
  onClose: () => void
  onCustomerUpdated: (customer: CustomerData) => void
}

export default function SearchModal({
  customer,
  onClose,
  onCustomerUpdated
}: SearchModalProps) {
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([])
  const [selectedResult, setSelectedResult] = useState<ContactSearchResult | null>(null)
  const [updating, setUpdating] = useState(false)

  const handleSearch = async () => {
    setSearching(true)
    try {
      const searchParams = {
        name: customer.name,
        email: customer.email,
        company: customer.accountName,
        currentPhone: customer.mobile || customer.phone
      }

      const response = await fetch('/api/search/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      })

      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.results)
        if (data.error) {
          // Amplemarket API not configured
          toast.error('Amplemarket API is not configured. Please add your API key to enable phone number search.')
        } else if (data.results.length === 0) {
          toast('No alternative phone numbers found', { icon: 'ℹ️' })
        } else {
          toast.success(`Found ${data.results.length} potential phone number(s)`)
        }
      } else {
        toast.error(data.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Network error during search')
    } finally {
      setSearching(false)
    }
  }

  const handleUpdateCustomer = async (newPhone: string) => {
    setUpdating(true)
    try {
      // First validate the new phone number
      const validateResponse = await fetch('/api/validate/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          phoneNumber: newPhone
        }),
      })

      const validateData = await validateResponse.json()

      if (validateResponse.ok) {
        onCustomerUpdated(validateData.customer)
        toast.success('Customer phone number updated and validated!')
        onClose()
      } else {
        toast.error(validateData.error || 'Failed to update customer')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Network error during update')
    } finally {
      setUpdating(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600'
    if (confidence >= 0.6) return 'text-warning-600'
    return 'text-danger-600'
  }

  const getConfidenceBadge = (confidence: number) => {
    const percentage = Math.round(confidence * 100)
    if (confidence >= 0.8) return `${percentage}% High`
    if (confidence >= 0.6) return `${percentage}% Medium`
    return `${percentage}% Low`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Search className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Search Alternative Phone Numbers
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
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-600">Client ID:</span>
                <span className="text-gray-900">{customer.clientId || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-600">Name:</span>
                <span className="text-gray-900">{customer.name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-600">Email:</span>
                <span className="text-gray-900">{customer.email || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-600">Account Name:</span>
                <span className="text-gray-900">{customer.accountName || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900 font-mono">
                  {customer.phone || 'N/A'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-600">Country Mobile Code:</span>
                <span className="text-gray-900 font-mono">
                  {customer.countryMobileCode || 'N/A'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-600">Mobile:</span>
                <span className="text-gray-900 font-mono">
                  {customer.mobile || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Search Button */}
          {searchResults.length === 0 && (
            <div className="text-center">
              <button
                onClick={handleSearch}
                disabled={searching}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching Amplemarket...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Search for Alternative Numbers</span>
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                This will search for alternative phone numbers using customer details
              </p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Search Results ({searchResults.length} found)
                </h3>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="btn-secondary text-sm"
                >
                  {searching ? 'Searching...' : 'Search Again'}
                </button>
              </div>

              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div
                    key={result.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      selectedResult?.id === result.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-primary-600" />
                            <span className="font-mono font-medium text-gray-900">
                              {result.phone}
                            </span>
                          </div>
                          <div className={`text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                            {getConfidenceBadge(result.confidence)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{result.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span>{result.company || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{result.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {selectedResult?.id === result.id && (
                          <CheckCircle className="h-5 w-5 text-primary-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Result Actions */}
          {selectedResult && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-medium text-primary-900 mb-2">Selected Phone Number</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-primary-600" />
                  <span className="font-mono font-medium text-primary-900">
                    {selectedResult.phone}
                  </span>
                  <span className="text-sm text-primary-700">
                    ({getConfidenceBadge(selectedResult.confidence)} confidence)
                  </span>
                </div>
                <button
                  onClick={() => handleUpdateCustomer(selectedResult.phone)}
                  disabled={updating}
                  className="btn-success flex items-center space-x-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Use This Number</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-primary-700 mt-2">
                This will update the customer's phone number and validate it with Twilio
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={updating}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
