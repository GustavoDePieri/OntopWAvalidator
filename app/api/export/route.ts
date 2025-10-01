import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { customers, format = 'csv' } = await request.json()
    
    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json(
        { error: 'Customers data is required' },
        { status: 400 }
      )
    }

    console.log(`📥 Exporting ${customers.length} customers as ${format}`)

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Client ID',
        'First Name',
        'Last Name',
        'Account Name',
        'Country',
        'Original Phone',
        'Validated Phone',
        'Email',
        'Language',
        'Account Owner',
        'Status',
        'Last Validated',
        'Carrier',
        'Line Type',
        'WhatsApp Ready',
        'Recommendations'
      ]

      const csvRows = [headers.join(',')]

      customers.forEach((customer: any) => {
        const row = [
          customer.clientId || '',
          customer.firstName || '',
          customer.lastName || '',
          customer.accountName || '',
          customer.countryCode || '',
          customer.phone || '',
          customer.mobile || customer.phone || '',
          customer.email || '',
          customer.language || '',
          customer.accountOwner || '',
          customer.status || 'pending',
          customer.lastValidated || '',
          customer.carrier || '',
          customer.lineType || '',
          customer.status === 'valid' ? 'Yes' : 'No',
          '' // Recommendations column for manual notes
        ]

        // Escape and quote fields that contain commas or quotes
        const escapedRow = row.map(field => {
          const str = String(field)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })

        csvRows.push(escapedRow.join(','))
      })

      const csv = csvRows.join('\n')
      const blob = Buffer.from(csv, 'utf-8')

      return new NextResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="validated-customers-${Date.now()}.csv"`,
        },
      })
    } else if (format === 'json') {
      // Return as JSON for Excel import
      const json = JSON.stringify(customers, null, 2)
      const blob = Buffer.from(json, 'utf-8')

      return new NextResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="validated-customers-${Date.now()}.json"`,
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid format. Use "csv" or "json"' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    )
  }
}

