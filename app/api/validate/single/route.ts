import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { twilioService } from '@/lib/twilio'
import { googleSheetsService } from '@/lib/google-sheets'

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

    const { customerId, phoneNumber } = await request.json()
    
    if (!customerId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Customer ID and phone number are required' },
        { status: 400 }
      )
    }

    // Validate the phone number with Twilio
    const validationResult = await twilioService.validatePhoneNumber(phoneNumber)
    
    // Get current customers to find the one to update
    const customers = await googleSheetsService.getCustomerData()
    const customer = customers.find(c => c.id === customerId)
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Update customer status based on validation
    const updatedCustomer = {
      ...customer,
      phone: validationResult.internationalFormat || phoneNumber,
      status: validationResult.isWhatsAppCapable ? 'valid' as const : 'invalid' as const,
      lastValidated: new Date().toISOString(),
    }

    // Update in Google Sheets
    await googleSheetsService.updateCustomerData(updatedCustomer)

    return NextResponse.json({
      message: 'Validation completed',
      customer: updatedCustomer,
      validationResult
    })
  } catch (error: any) {
    console.error('Single validation error:', error)
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 500 }
    )
  }
}



