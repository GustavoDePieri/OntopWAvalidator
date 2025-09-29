import twilio from 'twilio'

export interface PhoneValidationResult {
  isValid: boolean
  phoneNumber: string
  countryCode: string
  nationalFormat: string
  internationalFormat: string
  carrier?: string
  lineType?: string
  isMobile: boolean
  isWhatsAppCapable: boolean
  error?: string
}

class TwilioService {
  private client: any

  constructor() {
    this.initializeClient()
  }

  private initializeClient() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN

      if (!accountSid || !authToken) {
        console.warn('Twilio credentials not configured')
        return
      }

      this.client = twilio(accountSid, authToken)
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error)
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<PhoneValidationResult> {
    try {
      if (!this.client) {
        return {
          isValid: false,
          phoneNumber,
          countryCode: '',
          nationalFormat: '',
          internationalFormat: '',
          isMobile: false,
          isWhatsAppCapable: false,
          error: 'Twilio client not initialized'
        }
      }

      // Clean the phone number
      const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '')

      // Use Twilio Lookup API with Line Type Intelligence
      const lookup = await this.client.lookups.v2
        .phoneNumbers(cleanedNumber)
        .fetch({
          fields: 'line_type_intelligence,carrier'
        })

      const lineType = lookup.lineTypeIntelligence?.type || 'unknown'
      const isMobile = lineType === 'mobile' || lineType === 'voip'
      
      return {
        isValid: lookup.valid,
        phoneNumber: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        nationalFormat: lookup.nationalFormat,
        internationalFormat: lookup.phoneNumber,
        carrier: lookup.carrier?.name,
        lineType: lineType,
        isMobile,
        isWhatsAppCapable: isMobile && lookup.valid,
      }
    } catch (error: any) {
      console.error('Twilio validation error:', error)
      
      return {
        isValid: false,
        phoneNumber,
        countryCode: '',
        nationalFormat: '',
        internationalFormat: '',
        isMobile: false,
        isWhatsAppCapable: false,
        error: error.message || 'Validation failed'
      }
    }
  }

  async validateMultipleNumbers(phoneNumbers: string[]): Promise<PhoneValidationResult[]> {
    try {
      // Process in batches to avoid rate limiting
      const batchSize = 5
      const results: PhoneValidationResult[] = []

      for (let i = 0; i < phoneNumbers.length; i += batchSize) {
        const batch = phoneNumbers.slice(i, i + batchSize)
        
        const batchPromises = batch.map(number => 
          this.validatePhoneNumber(number)
        )

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        // Add a small delay between batches
        if (i + batchSize < phoneNumbers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      return results
    } catch (error) {
      console.error('Batch validation error:', error)
      throw error
    }
  }

  formatPhoneNumber(phoneNumber: string, countryCode?: string): string {
    try {
      // Basic phone number formatting
      let cleaned = phoneNumber.replace(/[^\d+]/g, '')
      
      if (!cleaned.startsWith('+') && countryCode) {
        cleaned = `+${countryCode}${cleaned}`
      }
      
      return cleaned
    } catch (error) {
      console.error('Phone formatting error:', error)
      return phoneNumber
    }
  }
}

export const twilioService = new TwilioService()



