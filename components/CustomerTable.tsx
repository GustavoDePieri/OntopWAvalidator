'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Phone, Search, Eye } from 'lucide-react'
import { CustomerData } from '@/lib/google-sheets'

interface CustomerTableProps {
  customers: CustomerData[]
  onValidateCustomer: (customer: CustomerData) => void
  onSearchNewPhone: (customer: CustomerData) => void
  onSelectionChange: (selectedIds: string[]) => void
}

export default function CustomerTable({
  customers,
  onValidateCustomer,
  onSearchNewPhone,
  onSelectionChange
}: CustomerTableProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [sortField, setSortField] = useState<keyof CustomerData>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? filteredCustomers.map(c => c.id) : []
    setSelectedCustomers(newSelection)
    onSelectionChange(newSelection)
  }

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedCustomers, customerId]
      : selectedCustomers.filter(id => id !== customerId)
    
    setSelectedCustomers(newSelection)
    onSelectionChange(newSelection)
  }

  const handleSort = (field: keyof CustomerData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getStatusIcon = (status: CustomerData['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'invalid':
        return <XCircle className="h-4 w-4 text-danger-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: CustomerData['status']) => {
    switch (status) {
      case 'valid':
        return <span className="status-valid">✅ Valid WhatsApp</span>
      case 'invalid':
        return <span className="status-invalid">❌ Invalid</span>
      case 'pending':
        return <span className="status-pending">⚠ Pending</span>
      default:
        return <span className="status-pending">⚠ Unknown</span>
    }
  }

  const filteredCustomers = customers
    .filter(customer => {
      if (filterStatus === 'all') return true
      return customer.status === filterStatus
    })
    .sort((a, b) => {
      const aValue = a[sortField] || ''
      const bValue = b[sortField] || ''
      
      if (sortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString())
      } else {
        return bValue.toString().localeCompare(aValue.toString())
      }
    })

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)

  const formatPhoneNumber = (customer: CustomerData) => {
    return customer.mobile || customer.phone || 'No phone'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <div className="overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              <option value="valid">Valid</option>
              <option value="invalid">Invalid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCustomers.length === paginatedCustomers.length && paginatedCustomers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('clientId')}
              >
                Client ID {sortField === 'clientId' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('accountName')}
              >
                Account {sortField === 'accountName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('phone')}
              >
                Phone {sortField === 'phone' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile Code
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Language
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Validated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={(e) => handleSelectCustomer(customer.id, e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {customer.clientId || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {customer.name || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs text-gray-900">
                    {customer.accountName || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs text-gray-900">
                    {customer.countryCode || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs text-gray-900 font-mono">
                    {customer.phone || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs text-gray-900 font-mono">
                    {customer.countryMobileCode || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs text-gray-900 font-mono">
                    {customer.mobile || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs text-gray-900">
                    {customer.email || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs text-gray-900">
                    {customer.language || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-xs text-gray-900">
                    {customer.accountOwner || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(customer.status)}
                    {getStatusBadge(customer.status)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(customer.lastValidated || '')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onValidateCustomer(customer)}
                      className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                      title="Validate with Twilio"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onSearchNewPhone(customer)}
                      className="text-warning-600 hover:text-warning-900 p-1 rounded hover:bg-warning-50"
                      title="Search new number"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              {totalPages > 5 && <span className="text-gray-500">...</span>}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {paginatedCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {customers.length === 0 ? 'No customers found' : 'No customers match the current filter'}
          </div>
        </div>
      )}
    </div>
  )
}
