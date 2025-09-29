// Phone number normalization and validation utilities

export interface PhoneNormalizationResult {
  original: string
  normalized: string
  isValid: boolean
  countryCode?: string
  nationalNumber?: string
  issues: string[]
}

// Common country codes mapping
const COUNTRY_TO_CODE: Record<string, string> = {
  'United States': '1',
  'USA': '1',
  'US': '1',
  'Canada': '1',
  'Mexico': '52',
  'Brazil': '55',
  'Argentina': '54',
  'Chile': '56',
  'Colombia': '57',
  'Peru': '51',
  'Venezuela': '58',
  'Spain': '34',
  'United Kingdom': '44',
  'UK': '44',
  'Germany': '49',
  'France': '33',
  'Italy': '39',
  'Portugal': '351',
  'Netherlands': '31',
  'Belgium': '32',
  'Switzerland': '41',
  'Austria': '43',
  'Poland': '48',
  'Romania': '40',
  'Czech Republic': '420',
  'India': '91',
  'China': '86',
  'Japan': '81',
  'South Korea': '82',
  'Australia': '61',
  'New Zealand': '64',
  'South Africa': '27',
  'Egypt': '20',
  'Nigeria': '234',
  'Kenya': '254',
  'Ghana': '233',
  'Panama': '507',
  'Costa Rica': '506',
  'Guatemala': '502',
  'Honduras': '504',
  'El Salvador': '503',
  'Nicaragua': '505',
  'Ecuador': '593',
  'Bolivia': '591',
  'Paraguay': '595',
  'Uruguay': '598',
  'Dominican Republic': '1',
  'Puerto Rico': '1',
  'Cuba': '53',
  'Jamaica': '1',
  'Trinidad and Tobago': '1',
  'Bahamas': '1',
  'Barbados': '1',
  'Estonia': '372',
  'Latvia': '371',
  'Lithuania': '370',
}

/**
 * Normalizes a phone number by cleaning and formatting it
 */
export function normalizePhoneNumber(
  phone: string,
  countryMobileCode: string,
  countryName: string
): PhoneNormalizationResult {
  const issues: string[] = []
  let normalized = ''

  // Clean the phone number - remove all non-digit characters except +
  const cleanedPhone = phone.replace(/[^\d+]/g, '')
  const cleanedCountryCode = countryMobileCode.replace(/[^\d]/g, '')

  // Check if phone is empty
  if (!cleanedPhone || cleanedPhone === '+') {
    issues.push('Phone number is empty')
    return {
      original: phone,
      normalized: '',
      isValid: false,
      issues
    }
  }

  // If phone already has + and country code, use it
  if (cleanedPhone.startsWith('+')) {
    normalized = cleanedPhone
    
    // Validate length (international numbers typically 7-15 digits)
    const digitCount = normalized.replace(/\D/g, '').length
    if (digitCount < 7) {
      issues.push('Phone number too short')
    } else if (digitCount > 15) {
      issues.push('Phone number too long')
    }
  }
  // If we have a country mobile code, use it
  else if (cleanedCountryCode) {
    normalized = `+${cleanedCountryCode}${cleanedPhone}`
    issues.push('Added country code from mobile code column')
  }
  // Try to get country code from country name
  else if (countryName) {
    const countryCode = COUNTRY_TO_CODE[countryName.trim()]
    if (countryCode) {
      normalized = `+${countryCode}${cleanedPhone}`
      issues.push(`Inferred country code +${countryCode} from country name`)
    } else {
      issues.push('Could not determine country code')
      normalized = cleanedPhone // Keep as is, will need manual review
    }
  }
  // No country information available
  else {
    issues.push('No country code information available')
    normalized = cleanedPhone
  }

  // Final validation
  const isValid = normalized.startsWith('+') && normalized.length >= 8 && normalized.length <= 16

  // Extract country code and national number
  let extractedCountryCode: string | undefined
  let nationalNumber: string | undefined
  
  if (normalized.startsWith('+')) {
    const match = normalized.match(/^\+(\d{1,3})(\d+)$/)
    if (match) {
      extractedCountryCode = match[1]
      nationalNumber = match[2]
    }
  }

  return {
    original: phone,
    normalized,
    isValid,
    countryCode: extractedCountryCode,
    nationalNumber,
    issues
  }
}

/**
 * Combines phone and mobile fields intelligently
 */
export function combinePhoneFields(
  phone: string,
  mobile: string,
  countryMobileCode: string,
  countryName: string
): PhoneNormalizationResult {
  // Priority: mobile > phone
  const primaryPhone = mobile?.trim() || phone?.trim() || ''
  
  if (!primaryPhone) {
    return {
      original: '',
      normalized: '',
      isValid: false,
      issues: ['No phone number provided']
    }
  }

  return normalizePhoneNumber(primaryPhone, countryMobileCode, countryName)
}

/**
 * Validates if a phone number needs enrichment
 */
export function needsEnrichment(result: PhoneNormalizationResult): boolean {
  return !result.isValid || result.issues.length > 0
}

/**
 * Gets country code from country name
 */
export function getCountryCode(countryName: string): string | null {
  return COUNTRY_TO_CODE[countryName.trim()] || null
}

/**
 * Formats phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return 'No phone'
  
  // If it's already formatted with +, return it
  if (phone.startsWith('+')) return phone
  
  // Otherwise, add + prefix if it looks like a country code
  if (phone.match(/^\d{1,3}\d{6,}$/)) {
    return `+${phone}`
  }
  
  return phone
}
