import { google } from 'googleapis'

export interface CustomerData {
  id: string
  clientId: string
  firstName: string
  lastName: string
  name: string // Combined first + last name
  accountName: string
  company: string // alias for accountName
  countryCode: string
  phone: string
  countryMobileCode: string
  mobile: string
  email: string
  language?: string
  accountOwner?: string
  status: 'valid' | 'invalid' | 'pending'
  lastValidated?: string
  row: number
}

class GoogleSheetsService {
  private sheets: any
  private auth: any

  constructor() {
    this.initializeAuth()
  }

  private initializeAuth() {
    try {
      console.log('🔍 Google Sheets: Initializing authentication...')
      
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      
      console.log('🔍 Google Sheets: Service account email present:', !!serviceAccountEmail)
      console.log('🔍 Google Sheets: Private key present:', !!privateKey)
      console.log('🔍 Google Sheets: Service account email:', serviceAccountEmail?.substring(0, 20) + '...')
      
      if (!serviceAccountEmail || !privateKey) {
        console.warn('⚠️ Google Sheets: Credentials not configured - Google Sheets integration disabled')
        console.warn('⚠️ Google Sheets: Manual import mode active - use the Import & Enrich feature')
        this.auth = null
        this.sheets = null
        return
      }

      const credentials = {
        client_email: serviceAccountEmail,
        private_key: privateKey,
      }

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      this.sheets = google.sheets({ version: 'v4', auth: this.auth })
      console.log('✅ Google Sheets: Authentication initialized successfully')
    } catch (error) {
      console.error('❌ Google Sheets: Failed to initialize auth:', error)
      console.warn('⚠️ Google Sheets: Manual import mode active - use the Import & Enrich feature')
      this.auth = null
      this.sheets = null
    }
  }

  async getCustomerData(): Promise<CustomerData[]> {
    try {
      console.log('🔍 Google Sheets: Starting getCustomerData...')
      
      if (!this.sheets) {
        console.warn('⚠️ Google Sheets: Not configured - returning empty array')
        return []
      }

      const sheetId = process.env.GOOGLE_SHEET_ID
      console.log('🔍 Google Sheets: Sheet ID present:', !!sheetId)
      console.log('🔍 Google Sheets: Sheet ID:', sheetId?.substring(0, 20) + '...')
      
      if (!sheetId) {
        throw new Error('Google Sheet ID not configured. Please set GOOGLE_SHEET_ID environment variable.')
      }

      // Assuming data starts from row 2 (row 1 has headers)
      // Updated structure: A=Client ID, B=First Name, C=Last Name, D=Account Name, E=Country F., F=Phone, G=Country Mobile Code, H=Mobile, I=Email, J=PoC Language, K=CS account owner, L=Status, M=Last Validated
      const range = 'Sheet1!A2:M' // Open-ended range to get all data automatically
      console.log('🔍 Google Sheets: Fetching range:', range)
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      })

      console.log('✅ Google Sheets: API response received')
      console.log('🔍 Google Sheets: Response data present:', !!response.data)
      console.log('🔍 Google Sheets: Values present:', !!response.data.values)
      
      const rows = response.data.values || []
      console.log('✅ Google Sheets: Found', rows.length, 'total rows of data')
      
      // Filter out empty rows (rows where first column is empty or just whitespace)
      const validRows = rows.filter((row: any[]) => {
        return row && row.length > 0 && row[0] && row[0].toString().trim() !== ''
      })
      
      console.log('✅ Google Sheets: Found', validRows.length, 'valid rows with data')
      
      if (validRows.length === 0) {
        console.log('⚠️ Google Sheets: No valid data found in the sheet')
        return []
      }

      // Log first row for debugging
      if (validRows.length > 0) {
        console.log('🔍 Google Sheets: First valid row sample:', validRows[0])
      }
      
      const customers = validRows.map((row: any[], index: number) => {
        const firstName = row[1] || ''
        const lastName = row[2] || ''
        const fullName = `${firstName} ${lastName}`.trim()
        
        // Find the actual row number in the original sheet by looking for this row
        const originalRowIndex = rows.findIndex((originalRow: any[]) => 
          originalRow && originalRow[0] === row[0]
        )
        const actualRowNumber = originalRowIndex + 2 // +2 because we start from row 2
        
        return {
          id: `customer-${actualRowNumber}`, // Use actual row number
          clientId: row[0] || '',
          firstName,
          lastName,
          name: fullName || 'N/A',
          accountName: row[3] || '',
          company: row[3] || '', // Account Name serves as company
          countryCode: row[4] || '',
          phone: row[5] || '',
          countryMobileCode: row[6] || '', // Country Mobile Code (column G) - now properly filled
          mobile: row[7] || '', // Mobile (column H) - now in correct position
          email: row[8] || '', // Email (column I) - now in correct position
          language: row[9] || '', // PoC Language (column J) - now in correct position
          accountOwner: row[10] || '', // CS account owner (column K) - now in correct position
          status: (row[11] as 'valid' | 'invalid' | 'pending') || 'pending', // Status (column L)
          lastValidated: row[12] || '', // Last Validated (column M)
          row: actualRowNumber,
        }
      })
      
      console.log('✅ Google Sheets: Successfully mapped', customers.length, 'customers')
      return customers
    } catch (error) {
      console.error('❌ Google Sheets Error:', error)
      console.error('❌ Error details:', error)
      throw error
    }
  }

  async updateCustomerData(customer: CustomerData): Promise<void> {
    try {
      if (!this.sheets) {
        console.warn('⚠️ Google Sheets: Not configured - skipping update')
        return
      }

      const sheetId = process.env.GOOGLE_SHEET_ID
      if (!sheetId) {
        throw new Error('Google Sheet ID not configured')
      }

      const range = `Sheet1!A${customer.row}:M${customer.row}`
      const values = [[
        customer.clientId,
        customer.firstName,
        customer.lastName,
        customer.accountName,
        customer.countryCode,
        customer.phone,
        customer.countryMobileCode || '', // Country Mobile Code (column G)
        customer.mobile, // Mobile (column H)
        customer.email, // Email (column I)
        customer.language || '', // PoC Language (column J)
        customer.accountOwner || '', // CS account owner (column K)
        customer.status,
        customer.lastValidated || new Date().toISOString(),
      ]]

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      })
    } catch (error) {
      console.error('Error updating customer data:', error)
      throw error
    }
  }

  async batchUpdateCustomers(customers: CustomerData[]): Promise<void> {
    try {
      if (!this.sheets) {
        console.warn('⚠️ Google Sheets: Not configured - skipping batch update')
        return
      }

      const sheetId = process.env.GOOGLE_SHEET_ID
      if (!sheetId) {
        throw new Error('Google Sheet ID not configured')
      }

      const requests = customers.map(customer => ({
        range: `Sheet1!A${customer.row}:M${customer.row}`,
        values: [[
          customer.clientId,
          customer.firstName,
          customer.lastName,
          customer.accountName,
          customer.countryCode,
          customer.phone,
          customer.countryMobileCode || '', // Country Mobile Code (column G)
          customer.mobile, // Mobile (column H)
          customer.email, // Email (column I)
          customer.language || '', // PoC Language (column J)
          customer.accountOwner || '', // CS account owner (column K)
          customer.status,
          customer.lastValidated || new Date().toISOString(),
        ]],
      }))

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: requests,
        },
      })
    } catch (error) {
      console.error('Error batch updating customers:', error)
      throw error
    }
  }
}

export const googleSheetsService = new GoogleSheetsService()
