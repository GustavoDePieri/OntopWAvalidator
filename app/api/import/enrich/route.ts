import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { amplemarketService } from '@/lib/amplemarket'
import { normalizePhoneNumber, combinePhoneFields } from '@/lib/phone-utils'
import { googleSheetsService, CustomerData } from '@/lib/google-sheets'

export interface ImportRow {
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

export interface EnrichedRow extends ImportRow {
  normalizedPhone: string
  phoneValid: boolean
  phoneIssues: string[]
  needsEnrichment: boolean
  suggestions: Array<{
    phone: string
    confidence: number
    source: string
  }>
}

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

    const { rows } = await request.json()
    
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of rows.' },
        { status: 400 }
      )
    }

    console.log(`Processing ${rows.length} rows for import and enrichment...`)

    // Step 1: Normalize all phone numbers
    const normalizedRows: EnrichedRow[] = rows.map((row: ImportRow) => {
      const phoneResult = combinePhoneFields(
        row.phone || '',
        row.mobile || '',
        row.countryMobileCode || '',
        row.country || ''
      )

      return {
        ...row,
        normalizedPhone: phoneResult.normalized,
        phoneValid: phoneResult.isValid,
        phoneIssues: phoneResult.issues,
        needsEnrichment: !phoneResult.isValid || phoneResult.issues.length > 0,
        suggestions: []
      }
    })

    console.log(`Normalized ${normalizedRows.length} rows`)
    
    const needsEnrichmentCount = normalizedRows.filter(r => r.needsEnrichment).length
    console.log(`${needsEnrichmentCount} rows need enrichment`)

    // Step 2: Get enrichment suggestions for rows that need it
    const contactsNeedingEnrichment = normalizedRows
      .filter(row => row.needsEnrichment)
      .map(row => ({
        clientId: row.clientId,
        name: `${row.firstName} ${row.lastName}`.trim(),
        email: row.email,
        company: row.accountName,
        currentPhone: row.normalizedPhone
      }))

    if (contactsNeedingEnrichment.length > 0) {
      console.log(`Fetching suggestions for ${contactsNeedingEnrichment.length} contacts...`)
      
      try {
        const enrichmentResults = await amplemarketService.batchEnrichContacts(
          contactsNeedingEnrichment
        )

        // Add suggestions to the normalized rows
        normalizedRows.forEach(row => {
          if (row.needsEnrichment) {
            const suggestions = enrichmentResults.get(row.clientId) || []
            row.suggestions = suggestions.map(s => ({
              phone: s.phone,
              confidence: s.confidence,
              source: 'Amplemarket'
            }))
          }
        })

        console.log(`Enrichment completed. Found suggestions for ${Array.from(enrichmentResults.values()).filter(s => s.length > 0).length} contacts`)
      } catch (error) {
        console.error('Enrichment error:', error)
        // Continue without enrichment data
      }
    }

    // Step 3: Return the enriched data for review
    return NextResponse.json({
      success: true,
      data: normalizedRows,
      summary: {
        total: normalizedRows.length,
        valid: normalizedRows.filter(r => r.phoneValid).length,
        needsEnrichment: needsEnrichmentCount,
        withSuggestions: normalizedRows.filter(r => r.suggestions.length > 0).length
      }
    })
  } catch (error: any) {
    console.error('Import enrichment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process import' },
      { status: 500 }
    )
  }
}

// Endpoint to confirm and save the enriched data
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

    const { confirmedRows } = await request.json()
    
    if (!confirmedRows || !Array.isArray(confirmedRows)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    console.log(`Saving ${confirmedRows.length} confirmed rows to Google Sheets...`)

    // Get current customers to find existing rows or append new ones
    const existingCustomers = await googleSheetsService.getCustomerData()
    const existingClientIds = new Map(
      existingCustomers.map(c => [c.clientId, c])
    )

    const customersToUpdate: CustomerData[] = []

    confirmedRows.forEach((row: EnrichedRow) => {
      const existing = existingClientIds.get(row.clientId)
      
      const customerData: CustomerData = {
        id: existing?.id || `customer-${Date.now()}-${Math.random()}`,
        clientId: row.clientId,
        firstName: row.firstName,
        lastName: row.lastName,
        name: `${row.firstName} ${row.lastName}`.trim(),
        accountName: row.accountName,
        company: row.accountName,
        countryCode: row.country,
        phone: row.phone,
        countryMobileCode: row.countryMobileCode,
        mobile: row.normalizedPhone, // Use the normalized/enriched phone
        email: row.email,
        status: 'pending', // Will be validated later
        lastValidated: existing?.lastValidated || '',
        row: existing?.row || existingCustomers.length + customersToUpdate.length + 2
      }

      customersToUpdate.push(customerData)
    })

    // Batch update to Google Sheets
    if (customersToUpdate.length > 0) {
      await googleSheetsService.batchUpdateCustomers(customersToUpdate)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${customersToUpdate.length} customers`,
      imported: customersToUpdate.length
    })
  } catch (error: any) {
    console.error('Save import error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save import' },
      { status: 500 }
    )
  }
}
