'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { 
  LogOut, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Phone,
  Users,
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  Zap,
  Download
} from 'lucide-react'
import { CustomerData } from '@/lib/google-sheets'
import CustomerTable from '@/components/CustomerTable'
import ValidationModal from '@/components/ValidationModal'
import SearchModal from '@/components/SearchModal'
import BulkOperations from '@/components/BulkOperations'
import SheetImportModal from '@/components/SheetImportModal'

interface User {
  id: string
  email: string
  name: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])

  useEffect(() => {
    checkAuth()
    fetchCustomers()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        console.log('User authenticated:', data.user.email)
      } else {
        console.log('Auth check failed, redirecting to login')
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  const fetchCustomers = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      } else {
        toast.error('Failed to fetch customers')
      }
    } catch (error) {
      console.error('Fetch customers error:', error)
      toast.error('Network error while fetching customers')
    } finally {
      setLoading(false)
      setRefreshing(false)
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

  const handleValidateCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer)
    setShowValidationModal(true)
  }

  const handleSearchNewPhone = (customer: CustomerData) => {
    setSelectedCustomer(customer)
    setShowSearchModal(true)
  }

  const handleCustomerUpdated = (updatedCustomer: CustomerData) => {
    setCustomers(prev => 
      prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
    )
  }

  const handleCustomerSelectionChange = (customerIds: string[]) => {
    setSelectedCustomers(customerIds)
  }

  const handleExportData = async () => {
    try {
      toast.loading('Preparing export...')
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customers: customers,
          format: 'csv'
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `validated-customers-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.dismiss()
      toast.success(`Exported ${customers.length} customers successfully!`)
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to export data')
      console.error('Export error:', error)
    }
  }

  const getStatusStats = () => {
    const valid = customers.filter(c => c.status === 'valid').length
    const invalid = customers.filter(c => c.status === 'invalid').length
    const pending = customers.filter(c => c.status === 'pending').length
    
    return { valid, invalid, pending, total: customers.length }
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-ontop-navy flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-ontop-purple-500 to-ontop-pink-500 mb-4">
            <RefreshCw className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-lg text-gray-300 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ontop-navy relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 animated-gradient opacity-20"></div>
      
      {/* Decorative blurs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-ontop-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-ontop-pink-500/10 rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="glass-card-light border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gradient-to-br from-ontop-purple-500 to-ontop-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">WhatsApp Validator</h1>
                  <p className="text-xs text-gray-400">Intelligent Phone Validation</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right mr-2">
                <p className="text-sm text-gray-400">Welcome back</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Customers */}
          <div className="glass-card p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  All contacts
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-ontop-purple-500/20 to-ontop-purple-600/20 rounded-xl border border-ontop-purple-500/30">
                <Users className="h-8 w-8 text-ontop-purple-400" />
              </div>
            </div>
          </div>

          {/* Valid Numbers */}
          <div className="glass-card p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Valid Numbers</p>
                <p className="text-3xl font-bold text-success-400">{stats.valid}</p>
                <p className="text-xs text-gray-500 mt-1">WhatsApp ready</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-success-500/20 to-success-600/20 rounded-xl border border-success-500/30">
                <CheckCircle className="h-8 w-8 text-success-400" />
              </div>
            </div>
          </div>

          {/* Invalid Numbers */}
          <div className="glass-card p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Invalid Numbers</p>
                <p className="text-3xl font-bold text-danger-400">{stats.invalid}</p>
                <p className="text-xs text-gray-500 mt-1">Needs attention</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-danger-500/20 to-danger-600/20 rounded-xl border border-danger-500/30">
                <XCircle className="h-8 w-8 text-danger-400" />
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="glass-card p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Pending</p>
                <p className="text-3xl font-bold text-warning-400">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Not validated yet</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-warning-500/20 to-warning-600/20 rounded-xl border border-warning-500/30">
                <Clock className="h-8 w-8 text-warning-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchCustomers}
                disabled={refreshing}
                className="btn-secondary flex items-center space-x-2 py-2 px-4"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="btn-coral flex items-center space-x-2 py-2 px-4"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Import & Enrich</span>
              </button>

              <button
                onClick={handleExportData}
                disabled={customers.length === 0}
                className="btn-success flex items-center space-x-2 py-2 px-4"
              >
                <Download className="h-4 w-4" />
                <span>Export Results</span>
              </button>
              
              {selectedCustomers.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ontop-purple-500/20 border border-ontop-purple-500/30">
                  <Sparkles className="h-4 w-4 text-ontop-purple-400" />
                  <span className="text-sm text-gray-300 font-medium">
                    {selectedCustomers.length} selected
                  </span>
                </div>
              )}
            </div>

            <BulkOperations
              selectedCustomers={selectedCustomers}
              onOperationComplete={fetchCustomers}
            />
          </div>
        </div>

        {/* Customer Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Customer Database</h2>
                <p className="text-sm text-gray-400 mt-1">Manage and validate phone numbers</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ontop-coral-500/10 border border-ontop-coral-500/30">
                <Zap className="h-4 w-4 text-ontop-coral-400" />
                <span className="text-sm font-semibold text-ontop-coral-400">AI Powered</span>
              </div>
            </div>
          </div>
          
          <CustomerTable
            customers={customers}
            onValidateCustomer={handleValidateCustomer}
            onSearchNewPhone={handleSearchNewPhone}
            onSelectionChange={handleCustomerSelectionChange}
          />
        </div>
      </main>

      {/* Modals */}
      {showValidationModal && selectedCustomer && (
        <ValidationModal
          customer={selectedCustomer}
          onClose={() => {
            setShowValidationModal(false)
            setSelectedCustomer(null)
          }}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}

      {showSearchModal && selectedCustomer && (
        <SearchModal
          customer={selectedCustomer}
          onClose={() => {
            setShowSearchModal(false)
            setSelectedCustomer(null)
          }}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}

      {showImportModal && (
        <SheetImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onComplete={() => {
            fetchCustomers()
            setShowImportModal(false)
          }}
        />
      )}
    </div>
  )
}
