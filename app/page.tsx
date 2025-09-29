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
  Settings,
  Download,
  FileSpreadsheet
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
        credentials: 'include' // Ensure cookies are sent
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

  const getStatusStats = () => {
    const valid = customers.filter(c => c.status === 'valid').length
    const invalid = customers.filter(c => c.status === 'invalid').length
    const pending = customers.filter(c => c.status === 'pending').length
    
    return { valid, invalid, pending, total: customers.length }
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
          <span className="text-lg text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Phone className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">WhatsApp Validator</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valid Numbers</p>
                <p className="text-2xl font-bold text-success-600">{stats.valid}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-danger-100 rounded-lg">
                <XCircle className="h-6 w-6 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Invalid Numbers</p>
                <p className="text-2xl font-bold text-danger-600">{stats.invalid}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchCustomers}
                  disabled={refreshing}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh Data</span>
                </button>
                
                <button
                  onClick={() => setShowImportModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Import & Enrich Sheet</span>
                </button>
                
                {selectedCustomers.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedCustomers.length} customer(s) selected
                  </span>
                )}
              </div>

              <BulkOperations
                selectedCustomers={selectedCustomers}
                onOperationComplete={fetchCustomers}
              />
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-lg shadow">
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
