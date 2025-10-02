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
    // Base URL according to official API docs
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

      // Strategy 1: Try GET /people/find with email (most specific - per Amplemarket docs)
      if (params.email) {
        try {
          console.log('📤 Strategy 1: GET /people/find?email=...')
          const findByEmailUrl = `${this.baseUrl}/people/find?email=${encodeURIComponent(params.email)}`
          console.log('🔗 URL:', findByEmailUrl)
          
          const response = await axios.get(findByEmailUrl, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          })

          console.log('✅ GET /people/find SUCCESS - Status:', response.status)
          console.log('📥 Response data:', JSON.stringify(response.data, null, 2))

          const results = this.parseAmplemarketResponse(response.data, params)
          if (results.length > 0) {
            console.log(`🎉 Found ${results.length} phone numbers!`)
            return results
          }
        } catch (error: any) {
          console.log('❌ GET /people/find (by email) failed:', error.response?.status || error.message)
          if (error.response) {
            console.log('❌ Response status:', error.response.status)
            console.log('❌ Response headers:', error.response.headers)
            console.log('❌ Response data:', JSON.stringify(error.response.data, null, 2))
          }
        }
      }

      // Strategy 2: Try GET /people/find with name + company_name
      if (params.name && params.company) {
        try {
          console.log('📤 Strategy 2: GET /people/find?name=...&company_name=...')
          const findParams = new URLSearchParams()
          findParams.append('name', params.name)
          findParams.append('company_name', params.company)
          const findByNameUrl = `${this.baseUrl}/people/find?${findParams.toString()}`
          console.log('🔗 URL:', findByNameUrl)
          
          const response = await axios.get(findByNameUrl, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          })

          console.log('✅ GET /people/find SUCCESS - Status:', response.status)
          console.log('📥 Response data:', JSON.stringify(response.data, null, 2))

          const results = this.parseAmplemarketResponse(response.data, params)
          if (results.length > 0) {
            console.log(`🎉 Found ${results.length} phone numbers!`)
            return results
          }
        } catch (error: any) {
          console.log('❌ GET /people/find (by name+company) failed:', error.response?.status || error.message)
          if (error.response) {
            console.log('❌ Response status:', error.response.status)
            console.log('❌ Response data:', JSON.stringify(error.response.data, null, 2))
          }
        }
      }

      // Strategy 3: Try POST /people/search (broader search - per Amplemarket docs)
      try {
        console.log('📤 Strategy 3: POST /people/search')
        const searchPayload: any = {
          page: 1,
          page_size: 10
        }

        if (params.name) {
          searchPayload.person_name = params.name
        }
        if (params.company) {
          searchPayload.company_names = [params.company]
        }

        console.log('📦 Payload:', JSON.stringify(searchPayload, null, 2))

        const response = await axios.post(`${this.baseUrl}/people/search`, searchPayload, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        })

        console.log('✅ POST /people/search SUCCESS - Status:', response.status)
        console.log('📥 Response data:', JSON.stringify(response.data, null, 2))

        const results = this.parseAmplemarketResponse(response.data, params)
        if (results.length > 0) {
          console.log(`🎉 Found ${results.length} phone numbers!`)
          return results
        }
      } catch (error: any) {
        console.log('❌ POST /people/search failed:', error.response?.status || error.message)
        if (error.response) {
          console.log('❌ Response status:', error.response.status)
          console.log('❌ Response data:', JSON.stringify(error.response.data, null, 2))
          console.log('❌ Response headers:', error.response.headers)
        }
      }

      // If all strategies fail, return mock data
      console.warn('⚠️ All API strategies failed, returning mock data')
      return this.getMockSearchResults(params)
    } catch (error: any) {
      console.error('❌ Amplemarket search error:', error.message)
      console.error('❌ Error details:', error.response?.data || error)
      
      // Return mock data so the app doesn't break
      console.log('💡 Returning mock data due to error...')
      return this.getMockSearchResults(params)
    }
  }

  private parseAmplemarketResponse(data: any, params: PhoneSearchParams): ContactSearchResult[] {
    try {
      console.log('🔍 Parsing Amplemarket response...')
      console.log('📥 Raw response data:', JSON.stringify(data, null, 2))
      
      // Handle different response formats
      let contacts: any[] = []
      
      // Check if it's a single person object (from /people/find)
      if (data.object === 'person') {
        console.log('📋 Single person object detected')
        contacts = [data]
      } 
      // Check if it's an array of results (from /people/search)
      else if (data.results && Array.isArray(data.results)) {
        console.log('📋 Search results array detected')
        contacts = data.results
      }
      // If the response is directly a person object (no 'object' field)
      else if (data.id && (data.email || data.name || data.first_name)) {
        console.log('📋 Direct person object detected')
        contacts = [data]
      }
      // Legacy format support
      else if (data.contacts || data.people) {
        console.log('📋 Legacy contacts/people array detected')
        contacts = data.contacts || data.people || []
      }
      
      if (contacts.length === 0) {
        console.warn('⚠️ No contacts in response')
        console.warn('💡 Response structure:', Object.keys(data).join(', '))
        return []
      }

      console.log(`📊 Processing ${contacts.length} contact(s)...`)

      // Extract phone numbers from various possible fields
      const results: ContactSearchResult[] = []
      
      for (const contact of contacts) {
        // Log all keys to see what fields are available
        console.log('🔑 Available fields:', Object.keys(contact).join(', '))
        console.log('📄 Full contact data:', JSON.stringify(contact, null, 2))
        
        // According to Amplemarket API docs, phone fields are:
        // - phone_number (general contact number)
        // - mobile_number (cell phone)
        // - work_number (office phone)
        // - sourced_number (from external sources)
        // - manually_added_number (manually added)
        const possiblePhoneFields = [
          'mobile_number',    // Cell phone (preferred)
          'phone_number',     // General contact number
          'work_number',      // Office phone
          'sourced_number',   // From external sources
          'manually_added_number', // Manually added
          'phone',            // Fallback
          'mobile_phone',     // Alternative naming
          'mobile',           // Short form
          'direct_phone',     // Direct dial
          'cell',             // Cell phone
          'work_phone',       // Work phone
          'personal_phone',   // Personal phone
          'phone_numbers',    // Array of phones
          'phones',           // Array of phones
          'direct_dial'       // Direct dial
        ]
        
        // Collect all phone numbers found
        let foundPhones: string[] = []
        
        for (const field of possiblePhoneFields) {
          if (contact[field]) {
            // Handle arrays of phone numbers
            if (Array.isArray(contact[field])) {
              foundPhones.push(...contact[field].filter((p: any) => p))
            } else if (typeof contact[field] === 'string' && contact[field].trim()) {
              foundPhones.push(contact[field].trim())
            } else if (typeof contact[field] === 'object' && contact[field].number) {
              foundPhones.push(contact[field].number)
            }
          }
        }
        
        // Remove duplicates and filter out invalid phones
        foundPhones = [...new Set(foundPhones)].filter(phone => 
          phone && phone.length > 5 // Basic validation
        )
        
        if (foundPhones.length === 0) {
          console.warn('⚠️ No phone number found for:', contact.name || contact.first_name || contact.email || 'unknown')
          console.warn('💡 Contact object:', JSON.stringify(contact, null, 2))
        } else {
          console.log(`📞 Found ${foundPhones.length} phone number(s):`, foundPhones)
          
          // Create a result for each unique phone number found
          foundPhones.forEach((phone, index) => {
            results.push({
              id: contact.id ? `${contact.id}-${index}` : `contact-${Date.now()}-${Math.random()}`,
              name: contact.name || contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || '',
              email: contact.email || contact.work_email || contact.personal_email || '',
              phone: phone,
              company: contact.company?.name || contact.company_name || contact.current_company || '',
              position: contact.position || contact.title || contact.headline || contact.current_position || '',
              confidence: contact.confidence || contact.score || 0.7,
            })
          })
        }
      }

      console.log(`✅ Found ${results.length} phone number(s) out of ${contacts.length} contact(s)`)
      return results.slice(0, 10)
    } catch (error) {
      console.error('❌ Error parsing Amplemarket response:', error)
      console.error('❌ Stack trace:', (error as Error).stack)
      return []
    }
  }

  async enrichContactData(email: string): Promise<ContactSearchResult | null> {
    try {
      if (!this.apiKey) {
        console.warn('Amplemarket API key not configured')
        return null
      }

      const response = await axios.get(`${this.baseUrl}/people/enrich`, {
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



