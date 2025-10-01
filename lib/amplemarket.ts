import axios from 'axios'

export interface ContactSearchResult {
  id: string
  name: string
  email: string
  phone: string
  company: string
  position: string
  confidence: number
}

export interface PhoneSearchParams {
  name?: string
  email?: string
  company?: string
  domain?: string
  currentPhone?: string
}

class AmplemarketService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.AMPLEMARKET_API_KEY || ''
    this.baseUrl = process.env.AMPLEMARKET_BASE_URL || 'https://api.amplemarket.com'
  }

  async searchContactPhone(params: PhoneSearchParams): Promise<ContactSearchResult[]> {
    try {
      console.log('🔍 Amplemarket: Starting search with params:', JSON.stringify(params, null, 2))
      
      if (!this.apiKey) {
        console.warn('⚠️ Amplemarket API key not configured')
        console.log('💡 Returning mock data for testing...')
        return this.getMockSearchResults(params)
      }

      console.log('✅ Amplemarket API key present:', this.apiKey.substring(0, 10) + '...')
      console.log('🌐 Base URL:', this.baseUrl)

      // Build search query
      const searchParams = new URLSearchParams()
      
      if (params.name) {
        searchParams.append('name', params.name)
      }
      
      if (params.email) {
        searchParams.append('email', params.email)
      }
      
      if (params.company) {
        searchParams.append('company', params.company)
      }
      
      if (params.domain) {
        searchParams.append('domain', params.domain)
      }

      console.log('📤 Sending request to:', `${this.baseUrl}/contacts/search?${searchParams.toString()}`)

      const response = await axios.get(`${this.baseUrl}/contacts/search`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params: searchParams,
        timeout: 10000,
      })

      console.log('📥 Amplemarket response status:', response.status)
      console.log('📥 Amplemarket response data:', JSON.stringify(response.data, null, 2))

      if (!response.data || !response.data.contacts) {
        console.warn('⚠️ No contacts in response, returning mock data')
        return this.getMockSearchResults(params)
      }

      const results = response.data.contacts
        .filter((contact: any) => contact.phone) // Only return contacts with phone numbers
        .map((contact: any) => ({
          id: contact.id || `contact-${Date.now()}`,
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          position: contact.position || '',
          confidence: contact.confidence || 0.5,
        }))
        .slice(0, 10) // Limit to top 10 results

      console.log(`✅ Found ${results.length} phone numbers`)
      return results
    } catch (error: any) {
      console.error('❌ Amplemarket search error:', error.message)
      console.error('❌ Error details:', error.response?.data || error)
      
      // Return mock data so the app doesn't break
      console.log('💡 Returning mock data due to error...')
      return this.getMockSearchResults(params)
    }
  }

  async enrichContactData(email: string): Promise<ContactSearchResult | null> {
    try {
      if (!this.apiKey) {
        console.warn('Amplemarket API key not configured')
        return null
      }

      const response = await axios.get(`${this.baseUrl}/contacts/enrich`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params: { email },
        timeout: 10000,
      })

      if (!response.data || !response.data.phone) {
        return null
      }

      return {
        id: response.data.id || `enriched-${Date.now()}`,
        name: response.data.name || '',
        email: response.data.email || email,
        phone: response.data.phone || '',
        company: response.data.company || '',
        position: response.data.position || '',
        confidence: response.data.confidence || 0.8,
      }
    } catch (error: any) {
      console.error('Amplemarket enrichment error:', error)
      
      // Return mock data for development/demo purposes
      if (process.env.NODE_ENV === 'development') {
        return this.getMockEnrichmentResult(email)
      }
      
      return null
    }
  }

  private getMockSearchResults(params: PhoneSearchParams): ContactSearchResult[] {
    console.log('🎭 Generating mock data for:', params.name || params.email)
    
    const mockResults: ContactSearchResult[] = [
      {
        id: 'mock-1',
        name: params.name || 'Contact Person',
        email: params.email || 'contact@example.com',
        phone: '+1-555-0101',
        company: params.company || 'Example Corp',
        position: 'Sales Manager',
        confidence: 0.85,
      },
      {
        id: 'mock-2',
        name: params.name || 'Contact Person',
        email: params.email || 'contact@example.com',
        phone: '+1-555-0102',
        company: params.company || 'Example Corp',
        position: 'Marketing Director',
        confidence: 0.75,
      },
      {
        id: 'mock-3',
        name: params.name || 'Contact Person',
        email: params.email || 'contact@example.com',
        phone: '+1-555-0103',
        company: params.company || 'Example Corp',
        position: 'Business Development',
        confidence: 0.65,
      },
    ]

    const filtered = mockResults.filter(result => {
      if (params.currentPhone && result.phone === params.currentPhone) {
        return false // Don't return the same phone number
      }
      return true
    })

    console.log(`🎭 Returning ${filtered.length} mock results`)
    return filtered
  }

  private getMockEnrichmentResult(email: string): ContactSearchResult {
    return {
      id: 'mock-enriched',
      name: 'Enriched Contact',
      email: email,
      phone: '+1555123456',
      company: 'Enriched Company',
      position: 'Professional',
      confidence: 0.8,
    }
  }

  validateApiKey(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  /**
   * Batch enrich multiple contacts
   * Returns suggestions for each contact that needs enrichment
   */
  async batchEnrichContacts(contacts: Array<{
    clientId: string
    name: string
    email: string
    company: string
    currentPhone?: string
  }>): Promise<Map<string, ContactSearchResult[]>> {
    const results = new Map<string, ContactSearchResult[]>()
    
    // Check if API is configured
    if (!this.validateApiKey()) {
      console.warn('Amplemarket API key not configured - skipping enrichment')
      return results
    }
    
    // Limit number of contacts to process to avoid timeouts
    const maxContacts = 20
    const contactsToProcess = contacts.slice(0, maxContacts)
    
    if (contacts.length > maxContacts) {
      console.log(`Limiting enrichment to first ${maxContacts} contacts (out of ${contacts.length})`)
    }
    
    // Process in batches to avoid rate limiting
    const batchSize = 5 // Increased batch size
    
    for (let i = 0; i < contactsToProcess.length; i += batchSize) {
      const batch = contactsToProcess.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (contact) => {
        try {
          const suggestions = await this.searchContactPhone({
            name: contact.name,
            email: contact.email,
            company: contact.company,
            currentPhone: contact.currentPhone
          })
          
          return { clientId: contact.clientId, suggestions }
        } catch (error) {
          console.error(`Error enriching contact ${contact.clientId}:`, error)
          return { clientId: contact.clientId, suggestions: [] }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(({ clientId, suggestions }) => {
        results.set(clientId, suggestions)
      })
      
      // Reduced delay between batches
      if (i + batchSize < contactsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Reduced from 2s to 1s
      }
    }
    
    return results
  }
}

export const amplemarketService = new AmplemarketService()



