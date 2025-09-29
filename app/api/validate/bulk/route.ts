import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { twilioService } from '@/lib/twilio'
import { googleSheetsService, CustomerData } from '@/lib/google-sheets'

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

    const { customerIds } = await request.json()
    
    if (!customerIds || !Array.isArray(customerIds)) {
      return NextResponse.json(
        { error: 'Customer IDs array is required' },
        { status: 400 }
      )
    }

    // Get current customers
    const allCustomers = await googleSheetsService.getCustomerData()
    const customersToValidate = customerIds.length > 0 
      ? allCustomers.filter(c => customerIds.includes(c.id))
      : allCustomers

    if (customersToValidate.length === 0) {
      return NextResponse.json(
        { error: 'No customers found to validate' },
        { status: 400 }
      )
    }

    const results: any[] = []
    const updatedCustomers: CustomerData[] = []

    // Process customers in batches
    const batchSize = 5
    for (let i = 0; i < customersToValidate.length; i += batchSize) {
      const batch = customersToValidate.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (customer) => {
        try {
          const phoneToValidate = customer.mobile || customer.phone
          if (!phoneToValidate) {
            return {
              customerId: customer.id,
              success: false,
              error: 'No phone number to validate'
            }
          }

          const validationResult = await twilioService.validatePhoneNumber(phoneToValidate)
          
          const updatedCustomer = {
            ...customer,
            phone: validationResult.internationalFormat || phoneToValidate,
            status: validationResult.isWhatsAppCapable ? 'valid' as const : 'invalid' as const,
            lastValidated: new Date().toISOString(),
          }

          updatedCustomers.push(updatedCustomer)

          return {
            customerId: customer.id,
            success: true,
            validationResult,
            customer: updatedCustomer
          }
        } catch (error: any) {
          return {
            customerId: customer.id,
            success: false,
            error: error.message
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < customersToValidate.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Batch update Google Sheets
    if (updatedCustomers.length > 0) {
      await googleSheetsService.batchUpdateCustomers(updatedCustomers)
    }

    const successCount = results.filter(r => r.success).length
    const validCount = results.filter(r => r.success && r.validationResult?.isWhatsAppCapable).length

    return NextResponse.json({
      message: 'Bulk validation completed',
      summary: {
        total: customersToValidate.length,
        processed: results.length,
        successful: successCount,
        valid: validCount,
        invalid: successCount - validCount,
        errors: results.length - successCount
      },
      results
    })
  } catch (error: any) {
    console.error('Bulk validation error:', error)
    return NextResponse.json(
      { error: error.message || 'Bulk validation failed' },
      { status: 500 }
    )
  }
}



