'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { 
  LogOut, 
  RefreshCw, 
  Phone,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Users
} from 'lucide-react'
import { CustomerData } from '@/lib/google-sheets'

interface User {
  id: string
  email: string
  name: string
}

interface ContactWithSuggestions extends CustomerData {
  suggestions: Array<{
    phone: string
    confidence: number
    source: string
  }>
  selectedSuggestion?: string
  searching?: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [customers, setCustomers] = useState<ContactWithSuggestions[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAuth()
    loadCustomers()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        
        // Filter to only show contacts WITHOUT mobile numbers
        const contactsWithoutPhone = data.customers.filter((c: CustomerData) => 
          !c.mobile || c.mobile === 'N/A' || c.mobile.trim() === ''
        )
        
        setCustomers(contactsWithoutPhone.map((c: CustomerData) => ({
          ...c,
          suggestions: [],
          searching: false
        })))
        
        toast.success(`Loaded ${contactsWithoutPhone.length} contacts without phone numbers`)
      } else {
        toast.error('Failed to load customers')
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Network error while loading customers')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const searchForPhoneNumber = async (customer: ContactWithSuggestions) => {
    try {
      setCustomers(prev => prev.map(c => 
        c.id === customer.id ? { ...c, searching: true } : c
      ))

      const response = await fetch('/api/search/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email,
          company: customer.accountName,
          currentPhone: customer.phone
        }),
      })

      const data = await response.json()

      if (response.ok && data.results) {
        setCustomers(prev => prev.map(c => 
          c.id === customer.id 
            ? { 
                ...c, 
                suggestions: data.results.map((r: any) => ({
                  phone: r.phone,
                  confidence: r.confidence,
                  source: 'Amplemarket'
                })),
                searching: false 
              } 
            : c
        ))
        
        if (data.results.length > 0) {
          toast.success(`Found ${data.results.length} phone number(s) for ${customer.name}`)
        } else {
          toast.error(`No phone numbers found for ${customer.name}`)
        }
      } else {
        setCustomers(prev => prev.map(c => 
          c.id === customer.id ? { ...c, searching: false } : c
        ))
        toast.error(data.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      setCustomers(prev => prev.map(c => 
        c.id === customer.id ? { ...c, searching: false } : c
      ))
      toast.error('Network error during search')
    }
  }

  const searchAllContacts = async () => {
    setSearching(true)
    toast.loading('Searching for phone numbers...')
    
    for (const customer of customers.slice(0, 20)) { // Limit to 20 to avoid timeout
      await searchForPhoneNumber(customer)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Delay between requests
    }
    
    toast.dismiss()
    toast.success('Search completed!')
    setSearching(false)
  }

  const selectSuggestion = (customerId: string, phone: string) => {
    setCustomers(prev => prev.map(c => 
      c.id === customerId ? { ...c, selectedSuggestion: phone } : c
    ))
  }

  const saveSelectedNumbers = async () => {
    const customersToSave = customers.filter(c => c.selectedSuggestion)
    
    if (customersToSave.length === 0) {
      toast.error('No phone numbers selected to save')
      return
    }

    setSaving(true)
    toast.loading(`Saving ${customersToSave.length} phone numbers...`)

    try {
      for (const customer of customersToSave) {
        await fetch('/api/customers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer: {
              ...customer,
              mobile: customer.selectedSuggestion,
              status: 'pending' // Will need validation
            }
          }),
        })
      }

      toast.dismiss()
      toast.success(`Saved ${customersToSave.length} phone numbers to destination sheet!`)
      
      // Reload to refresh the list
      loadCustomers()
    } catch (error) {
      toast.dismiss()
      console.error('Save error:', error)
      toast.error('Failed to save phone numbers')
    } finally {
      setSaving(false)
    }
  }

  const exportResults = () => {
    const csvHeaders = ['Client ID', 'Name', 'Email', 'Company', 'Original Phone', 'Found Phone', 'Confidence', 'Status']
    const csvRows = customers.map(c => [
      c.clientId,
      c.name,
      c.email,
      c.accountName,
      c.phone || 'N/A',
      c.selectedSuggestion || (c.suggestions[0]?.phone || 'Not found'),
      c.suggestions[0]?.confidence || 'N/A',
      c.selectedSuggestion ? 'Selected' : (c.suggestions.length > 0 ? 'Available' : 'Not found')
    ])

    const csv = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phone-numbers-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast.success('Exported results as CSV')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ontop-navy flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-ontop-purple-500 to-ontop-pink-500 mb-4">
            <RefreshCw className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-lg text-gray-300 font-medium">Loading contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ontop-navy relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 animated-gradient opacity-20"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-ontop-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-ontop-pink-500/10 rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="glass-card-light border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-ontop-purple-500 to-ontop-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Phone Number Finder</h1>
                <p className="text-xs text-gray-400">Powered by Amplemarket</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right mr-2">
                <p className="text-sm text-gray-400">Welcome</p>
                <p className="text-sm font-semibold text-gray-200">{user?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-ontop-navy-light/80 text-gray-300 hover:text-white border border-white/10 hover:border-ontop-coral-500/50 transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Contacts Without Phone</p>
                <p className="text-3xl font-bold text-white">{customers.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-ontop-coral-500/20 to-ontop-coral-600/20 rounded-xl border border-ontop-coral-500/30">
                <AlertCircle className="h-8 w-8 text-ontop-coral-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Phone Numbers Found</p>
                <p className="text-3xl font-bold text-ontop-purple-400">
                  {customers.filter(c => c.suggestions.length > 0).length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-ontop-purple-500/20 to-ontop-purple-600/20 rounded-xl border border-ontop-purple-500/30">
                <Search className="h-8 w-8 text-ontop-purple-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Selected to Save</p>
                <p className="text-3xl font-bold text-success-400">
                  {customers.filter(c => c.selectedSuggestion).length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-success-500/20 to-success-600/20 rounded-xl border border-success-500/30">
                <CheckCircle2 className="h-8 w-8 text-success-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadCustomers}
                className="btn-secondary flex items-center space-x-2 py-2 px-4"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload from Google Sheets</span>
              </button>

              <button
                onClick={searchAllContacts}
                disabled={searching || customers.length === 0}
                className="btn-primary flex items-center space-x-2 py-2 px-4"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Find All Phone Numbers (Max 20)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={exportResults}
                disabled={customers.length === 0}
                className="btn-secondary flex items-center space-x-2 py-2 px-4"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={saveSelectedNumbers}
                disabled={saving || customers.filter(c => c.selectedSuggestion).length === 0}
                className="btn-success flex items-center space-x-2 py-2 px-4"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Selected ({customers.filter(c => c.selectedSuggestion).length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="h-6 w-6 text-ontop-purple-400" />
            Contacts Without Phone Numbers
          </h2>

          {customers.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-success-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-300 mb-2">
                All contacts have phone numbers!
              </p>
              <p className="text-gray-500">
                No missing phone numbers found in your Google Sheet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
                <div key={customer.id} className="glass-card-light p-5 border-white/5">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{customer.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <span className="text-gray-300 ml-2">{customer.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Company:</span>
                          <span className="text-gray-300 ml-2">{customer.accountName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Client ID:</span>
                          <span className="text-gray-300 ml-2">{customer.clientId}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Current Phone:</span>
                          <span className="text-gray-400 ml-2">{customer.phone || 'None'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:w-96">
                      {!customer.searching && customer.suggestions.length === 0 && (
                        <button
                          onClick={() => searchForPhoneNumber(customer)}
                          className="btn-primary flex items-center justify-center space-x-2 py-2"
                        >
                          <Search className="h-4 w-4" />
                          <span>Search Phone Number</span>
                        </button>
                      )}

                      {customer.searching && (
                        <div className="flex items-center justify-center py-2 text-gray-400">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Searching Amplemarket...</span>
                        </div>
                      )}

                      {customer.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-semibold">Found {customer.suggestions.length} phone number(s):</p>
                          {customer.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectSuggestion(customer.id, suggestion.phone)}
                              className={`w-full p-3 rounded-xl border transition-all text-left ${
                                customer.selectedSuggestion === suggestion.phone
                                  ? 'bg-success-500/20 border-success-500/50 shadow-lg'
                                  : 'bg-ontop-navy-light/50 border-white/10 hover:border-ontop-purple-500/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-mono font-semibold">{suggestion.phone}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Confidence: {Math.round(suggestion.confidence * 100)}%
                                  </p>
                                </div>
                                {customer.selectedSuggestion === suggestion.phone && (
                                  <CheckCircle2 className="h-5 w-5 text-success-400" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
