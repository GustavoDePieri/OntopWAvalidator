'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Phone, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface ImportRow {
  clientId: string
  firstName: string
  lastName: string
  accountName: string
  country: string
  phone: string
  countryMobileCode: string
  mobile: string
  email: string
}

interface EnrichedRow extends ImportRow {
  normalizedPhone: string
  phoneValid: boolean
  phoneIssues: string[]
  needsEnrichment: boolean
  suggestions: Array<{
    phone: string
    confidence: number
    source: string
  }>
  selectedPhone?: string // User's selection
}

interface SheetImportModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function SheetImportModal({
  isOpen,
  onClose,
  onComplete
}: SheetImportModalProps) {
  const [step, setStep] = useState<'upload' | 'enriching' | 'review'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [enrichedData, setEnrichedData] = useState<EnrichedRow[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx?|csv)$/i)) {
        toast.error('Please upload a valid Excel or CSV file')
        return
      }
      
      setFile(selectedFile)
    }
  }

  const parseExcelFile = async (file: File): Promise<ImportRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
          
          // Skip header row
          const rows = jsonData.slice(1).filter(row => row && row[0])
          
          const parsedRows: ImportRow[] = rows.map(row => ({
            clientId: row[0]?.toString() || '',
            firstName: row[1]?.toString() || '',
            lastName: row[2]?.toString() || '',
            accountName: row[3]?.toString() || '',
            country: row[4]?.toString() || '',
            phone: row[5]?.toString() || '',
            countryMobileCode: row[6]?.toString() || '',
            mobile: row[7]?.toString() || '',
            email: row[8]?.toString() || ''
          }))
          
          resolve(parsedRows)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsBinaryString(file)
    })
  }

  const handleEnrichData = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setLoading(true)
    setStep('enriching')
    setProgress(0)

    try {
      // Parse the Excel file
      toast.loading('Parsing spreadsheet...')
      const rows = await parseExcelFile(file)
      setProgress(30)
      
      toast.dismiss()
      toast.loading(`Processing ${rows.length} rows...`)
      
      // Send to API for enrichment
      const response = await fetch('/api/import/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rows })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enrich data')
      }

      setProgress(100)
      toast.dismiss()
      toast.success(
        `Processed ${data.summary.total} rows! ${data.summary.withSuggestions} have suggestions.`
      )
      
      // Initialize selected phones with normalized or best suggestion
      const enrichedWithSelections = data.data.map((row: EnrichedRow) => ({
        ...row,
        selectedPhone: row.phoneValid 
          ? row.normalizedPhone 
          : row.suggestions[0]?.phone || row.normalizedPhone
      }))
      
      setEnrichedData(enrichedWithSelections)
      setStep('review')
    } catch (error: any) {
      console.error('Enrichment error:', error)
      toast.dismiss()
      toast.error(error.message || 'Failed to process file')
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSuggestion = (rowIndex: number, phone: string) => {
    const updated = [...enrichedData]
    updated[rowIndex].selectedPhone = phone
    setEnrichedData(updated)
  }

  const handleConfirmImport = async () => {
    setLoading(true)
    
    try {
      // Prepare confirmed data
      const confirmedRows = enrichedData.map(row => ({
        ...row,
        normalizedPhone: row.selectedPhone || row.normalizedPhone
      }))

      const response = await fetch('/api/import/enrich', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmedRows })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save data')
      }

      toast.success(`Successfully imported ${data.imported} customers!`)
      onComplete()
      handleClose()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save import')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('upload')
    setFile(null)
    setEnrichedData([])
    setProgress(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Import & Enrich Customer Data
              </h2>
              <p className="text-sm text-gray-600">
                Upload your spreadsheet and we'll find missing phone numbers
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Expected Spreadsheet Format:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Column A: Client ID</li>
                      <li>• Column B: First Name</li>
                      <li>• Column C: Last Name</li>
                      <li>• Column D: Account Name</li>
                      <li>• Column E: Country</li>
                      <li>• Column F: Phone</li>
                      <li>• Column G: Country Mobile Code</li>
                      <li>• Column H: Mobile</li>
                      <li>• Column I: Email</li>
                    </ul>
                    <p className="mt-2 text-xs italic">
                      Don't worry about messy data! We'll automatically clean up phone numbers,
                      add missing country codes, and find suggestions using Amplemarket.
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-4">
                    <CheckCircle className="h-12 w-12 text-success-600 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary"
                    >
                      Choose Different File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Upload Spreadsheet
                      </p>
                      <p className="text-sm text-gray-600">
                        Excel (.xlsx, .xls) or CSV files supported
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary"
                    >
                      Select File
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enriching Step */}
          {step === 'enriching' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-16 w-16 text-primary-600 animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Processing Your Data
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Normalizing phone numbers and finding suggestions with Amplemarket...
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{progress}%</p>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Import Summary</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {enrichedData.length}
                    </div>
                    <div className="text-xs text-gray-600">Total Rows</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success-600">
                      {enrichedData.filter(r => r.phoneValid).length}
                    </div>
                    <div className="text-xs text-gray-600">Valid Phones</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-warning-600">
                      {enrichedData.filter(r => r.needsEnrichment).length}
                    </div>
                    <div className="text-xs text-gray-600">Need Review</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      {enrichedData.filter(r => r.suggestions.length > 0).length}
                    </div>
                    <div className="text-xs text-gray-600">With Suggestions</div>
                  </div>
                </div>
              </div>

              {/* Review Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Client ID</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Company</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Phone Selection</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrichedData.map((row, index) => (
                        <tr key={index} className={row.needsEnrichment ? 'bg-yellow-50' : ''}>
                          <td className="px-3 py-2 whitespace-nowrap font-mono">
                            {row.clientId}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.firstName} {row.lastName}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.accountName}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.phoneValid ? (
                              <span className="inline-flex items-center text-success-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-warning-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Needs Review
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="space-y-1">
                              {/* Current/Normalized Phone */}
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`phone-${index}`}
                                  checked={row.selectedPhone === row.normalizedPhone}
                                  onChange={() => handleSelectSuggestion(index, row.normalizedPhone)}
                                  className="text-primary-600"
                                />
                                <span className="font-mono">{row.normalizedPhone || 'None'}</span>
                                {row.phoneIssues.length > 0 && (
                                  <span className="text-xs text-gray-500" title={row.phoneIssues.join(', ')}>
                                    ({row.phoneIssues.length} issue{row.phoneIssues.length > 1 ? 's' : ''})
                                  </span>
                                )}
                              </label>
                              
                              {/* Suggestions */}
                              {row.suggestions.map((suggestion, sIndex) => (
                                <label key={sIndex} className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={`phone-${index}`}
                                    checked={row.selectedPhone === suggestion.phone}
                                    onChange={() => handleSelectSuggestion(index, suggestion.phone)}
                                    className="text-primary-600"
                                  />
                                  <Search className="h-3 w-3 text-primary-600" />
                                  <span className="font-mono">{suggestion.phone}</span>
                                  <span className="text-xs text-success-600">
                                    {Math.round(suggestion.confidence * 100)}% match
                                  </span>
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
          
          {step === 'upload' && (
            <button
              onClick={handleEnrichData}
              disabled={!file || loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Process & Enrich Data</span>
            </button>
          )}
          
          {step === 'review' && (
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="btn-success flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirm & Import {enrichedData.length} Rows</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
