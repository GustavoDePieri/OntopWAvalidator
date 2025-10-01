import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { googleSheetsService } from '@/lib/google-sheets'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Customer API: Starting request')
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    console.log('🔍 Customer API: Token present:', !!token)
    
    if (!token) {
      console.log('❌ Customer API: No token found')
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      console.log('❌ Customer API: Invalid token')
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    console.log('✅ Customer API: User authenticated:', user.email)
    console.log('🔍 Customer API: Fetching customer data from Google Sheets...')
    
    const customers = await googleSheetsService.getCustomerData()
    console.log('✅ Customer API: Successfully fetched', customers.length, 'customers')
    
    return NextResponse.json({ customers })
  } catch (error: any) {
    console.error('❌ Customer API Error:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { customer } = await request.json()
    
    if (!customer || !customer.id) {
      return NextResponse.json(
        { error: 'Customer data is required' },
        { status: 400 }
      )
    }

    // Write to DESTINATION sheet (not source)
    await googleSheetsService.updateCustomerData(customer)
    console.log('✅ Customer updated in DESTINATION sheet')
    
    return NextResponse.json({ 
      message: 'Customer updated successfully in destination sheet',
      customer 
    })
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    )
  }
}
