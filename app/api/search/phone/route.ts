import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { amplemarketService } from '@/lib/amplemarket'

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

    const { name, email, company, domain, currentPhone } = await request.json()
    
    if (!name && !email && !company && !domain) {
      return NextResponse.json(
        { error: 'At least one search parameter is required (name, email, company, or domain)' },
        { status: 400 }
      )
    }

    let searchResults = []
    
    try {
      searchResults = await amplemarketService.searchContactPhone({
        name,
        email,
        company,
        domain,
        currentPhone
      })
    } catch (searchError: any) {
      console.error('Amplemarket API error:', searchError.message)
      // If Amplemarket fails, return empty results instead of erroring
      console.log('Returning empty results due to Amplemarket API error')
      
      return NextResponse.json({
        message: 'Amplemarket API is not available. Please check your API key configuration.',
        results: [],
        count: 0,
        error: 'Amplemarket API not configured or unavailable'
      })
    }

    return NextResponse.json({
      message: 'Phone search completed',
      results: searchResults,
      count: searchResults.length
    })
  } catch (error: any) {
    console.error('Phone search error:', error)
    return NextResponse.json(
      { error: error.message || 'Phone search failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required for enrichment' },
        { status: 400 }
      )
    }

    const enrichedContact = await amplemarketService.enrichContactData(email)

    if (!enrichedContact) {
      return NextResponse.json({
        message: 'No additional contact data found',
        result: null
      })
    }

    return NextResponse.json({
      message: 'Contact enrichment completed',
      result: enrichedContact
    })
  } catch (error: any) {
    console.error('Contact enrichment error:', error)
    return NextResponse.json(
      { error: error.message || 'Contact enrichment failed' },
      { status: 500 }
    )
  }
}





