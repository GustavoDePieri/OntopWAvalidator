# WhatsApp Validator

A secure web application for validating and managing customer phone numbers to maximize WhatsApp-ready contacts.

## Features

### 🔐 Security
- JWT-based authentication
- Secure password hashing with bcrypt
- HTTP-only cookies
- Protected API routes

### 📊 Google Sheets Integration
- Real-time data synchronization
- Service account authentication
- Batch updates for performance

### 📱 Phone Validation
- Twilio Lookup API integration
- Line Type Intelligence
- WhatsApp capability detection
- Carrier information

### 🔍 Contact Search
- Amplemarket API integration
- Alternative phone number discovery
- Contact enrichment

### 💼 Dashboard Features
- Customer data visualization
- Status indicators (Valid ✅, Invalid ❌, Pending ⚠)
- Single and bulk validation
- Real-time progress tracking
- Advanced filtering and sorting
- Smart sheet import with automatic phone number normalization
- AI-powered phone number enrichment with Amplemarket suggestions

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS
- **Authentication**: JWT, bcrypt
- **APIs**: Twilio, Amplemarket, Google Sheets
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp env.example .env.local
```

Configure the following environment variables:

#### Authentication
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-secret-key
```

#### Google Sheets API
1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account
4. Download the service account key
5. Share your Google Sheet with the service account email

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=your-google-sheet-id
```

#### Twilio API
1. Sign up for Twilio account
2. Get Account SID and Auth Token from Console

```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
```

#### Amplemarket API
1. Sign up for Amplemarket account
2. Get API key from dashboard

```
AMPLEMARKET_API_KEY=your-amplemarket-api-key
AMPLEMARKET_BASE_URL=https://api.amplemarket.com
```

### 3. Google Sheet Setup

Create a Google Sheet with the following columns (in this order):

| Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H | Column I | Column J | Column K | Column L | Column M |
|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|
| Client ID | First Name | Last Name | Account Name | Country F. | Phone | Mobile | Email | (Empty) | PoC Language | CS account owner | Status | Last Validated |

Example data:
```
CL003110 | Gabriela | Fernandez | Get Staffed Up | United States | +1234567890 | 1234567890 | gabriela@example.com |  | Spanish | Samuel Jimenez | pending | 
CL003360 | Francisco | Villa | Orbis Data | Peru | +51987654321 | 987654321 | francisco@example.com |  | Spanish | Daniela Perez | pending |
```

**Important Notes:**
- Column I can remain empty (reserved for future use)
- The application will add Status (Column L) and Last Validated (Column M) automatically
- Make sure to share the sheet with your Google Service Account email

### 4. Run the Application

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

Visit `http://localhost:3000` and login with:

**Admin Account:**
- Email: `admin@whatsappvalidator.com`
- Password: `password123`

**Demo User Account:**
- Email: `demo@whatsappvalidator.com` 
- Password: `password123`

## Usage Guide

### 1. Dashboard Overview
- View customer statistics
- Monitor validation status
- Access bulk operations

### 2. Single Customer Validation
- Click the phone icon next to any customer
- Enter/modify phone number
- View detailed validation results
- Check WhatsApp compatibility

### 3. Search Alternative Numbers
- Click the search icon next to any customer
- System searches using customer details
- Select from found alternatives
- Automatically validates new number

### 4. Bulk Operations
- Select multiple customers using checkboxes
- Click "Validate Selected" or "Validate All"
- Monitor progress in real-time
- View detailed results summary

### 5. Import & Enrich Data
- Click "Import & Enrich Sheet" button
- Upload Excel (.xlsx, .xls) or CSV file with customer data
- System automatically normalizes messy phone numbers
- Intelligently handles missing country codes
- Amplemarket finds alternative phone numbers for invalid entries
- Review and select best phone number for each customer
- Bulk import directly to your Google Sheet

**Import File Format:**
- Column A: Client ID
- Column B: First Name
- Column C: Last Name
- Column D: Account Name
- Column E: Country
- Column F: Phone
- Column G: Country Mobile Code
- Column H: Mobile
- Column I: Email

**Smart Features:**
- Auto-detects and adds missing country codes
- Combines phone and mobile fields intelligently
- Flags problematic entries for review
- Provides Amplemarket suggestions with confidence scores
- Handles incomplete, invalid, and messy data gracefully

### 6. Status Indicators
- ✅ **Valid**: WhatsApp-ready mobile number
- ❌ **Invalid**: Not a valid mobile/WhatsApp number
- ⚠ **Pending**: Not yet validated

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - Fetch all customers
- `PUT /api/customers` - Update customer data

### Validation
- `POST /api/validate/single` - Validate single phone number
- `POST /api/validate/bulk` - Bulk validate phone numbers

### Search
- `POST /api/search/phone` - Search for alternative phone numbers
- `GET /api/search/phone?email=...` - Enrich contact data

### Import
- `POST /api/import/enrich` - Process and enrich imported spreadsheet data
- `PUT /api/import/enrich` - Save confirmed enriched data to Google Sheets

## Security Features

### 🔐 **Enhanced Authentication Security:**
- **Secure Password Hashing**: bcrypt with 12 rounds + salt
- **JWT Tokens**: 8-hour expiration with issuer/audience validation
- **HTTP-only Cookies**: Prevents XSS attacks
- **Account Lockout**: 5 failed attempts = 30-minute lockout
- **IP Rate Limiting**: 10 attempts per IP, 15-minute cooldown
- **Session Management**: Automatic token refresh detection
- **Input Validation**: Email format, password strength checks
- **Security Headers**: XSS protection, content type validation

### 🛡️ **API Security:**
- Protected routes with middleware authentication
- Request validation and sanitization
- Error handling without information leakage
- Environment variable protection
- CORS and security header configuration

### 🔍 **Monitoring & Logging:**
- Failed login attempt tracking
- Security event logging
- Token expiration monitoring
- Suspicious activity detection

## Performance Optimizations

- Batch processing for bulk operations
- Rate limiting for API calls
- Pagination for large datasets
- Efficient Google Sheets batch updates
- Optimized React re-renders

## Error Handling

- Comprehensive error logging
- User-friendly error messages
- Graceful API failure handling
- Network error recovery
- Validation error reporting

## Development Notes

- Mock data available for development mode
- Hot reloading enabled
- TypeScript for type safety
- ESLint for code quality
- Responsive design for all screen sizes

## Support

For issues or questions:
1. Check environment variables are correctly set
2. Verify API credentials are valid
3. Ensure Google Sheet permissions are correct
4. Review console logs for detailed error messages

## License

Private - All rights reserved
