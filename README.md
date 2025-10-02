# 🎨 WhatsApp Validator - Intelligent Phone Validation

A **modern, elegant** web application for validating and managing customer phone numbers with AI-powered intelligence. Built with a stunning dark theme featuring glass morphism effects and gradient accents.

![Modern UI](https://img.shields.io/badge/UI-Modern%20Dark%20Theme-8b5cf6)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## ✨ Features

### 🎨 Modern Design
- **Elegant Dark Theme** with Ontop color palette (Navy, Purple, Pink, Coral)
- **Glass Morphism Effects** for a premium, futuristic look
- **Animated Gradients** and smooth transitions
- **Responsive Design** optimized for all devices
- **Accessible** with high contrast text and clear visual hierarchy

### 🔐 Security
- JWT-based authentication with secure sessions
- Secure password hashing with bcrypt
- HTTP-only cookies for XSS protection
- Rate limiting and account lockout protection
- Protected API routes with middleware

### 📊 Google Sheets Integration
- Real-time data synchronization
- Service account authentication
- Batch updates for optimal performance
- Automatic status tracking

### 📱 Phone Validation (Twilio)
- Real-time phone number validation
- Line Type Intelligence (mobile, landline, VoIP)
- WhatsApp capability detection
- Carrier and country information
- Bulk validation with progress tracking

### 🔍 Contact Enrichment (Amplemarket)
- AI-powered contact search
- Alternative phone number discovery
- Intelligent contact enrichment
- Confidence scoring for suggestions
- Smart data normalization

### 💼 Dashboard Features
- Beautiful stats cards with gradient accents
- Real-time customer data visualization
- Status indicators (Valid ✅, Invalid ❌, Pending ⚠)
- Single and bulk validation operations
- Advanced filtering and selection
- Smart sheet import with auto-enrichment
- AI-powered suggestions for invalid numbers

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS with custom Ontop theme
- **Authentication**: JWT, bcrypt, HTTP-only cookies
- **APIs**: 
  - Twilio (Phone validation)
  - Amplemarket (Contact enrichment)
  - Google Sheets API (Data storage)
- **UI Components**: Lucide React icons
- **Notifications**: react-hot-toast
- **Deployment**: Vercel (optimized)

## 🎨 Design System

### Color Palette
```javascript
ontop: {
  navy: '#1a0d2e',           // Main background
  'navy-dark': '#0f0819',    // Deeper background
  'navy-light': '#2a1b3d',   // Card backgrounds
  
  purple: { /* scales 50-900 */ },  // Primary actions
  pink: { /* scales 50-900 */ },    // Accent gradients
  coral: { /* scales 50-900 */ },   // Call-to-action
}
```

### Components
- **Glass Cards**: Frosted glass effect with subtle borders
- **Gradient Buttons**: Purple-to-pink and coral gradients
- **Animated Backgrounds**: Smooth, infinite gradient animations
- **Status Badges**: Color-coded with icons and borders

## 📋 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file with the following variables:

#### Authentication
```env
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-jwt-secret-key-min-32-chars
```

#### Google Sheets API
1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account
4. Download the service account key
5. Share your Google Sheet with the service account email

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=your-google-sheet-id
```

#### Twilio API
1. Sign up at [twilio.com](https://www.twilio.com)
2. Get Account SID and Auth Token from Console

```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
```

#### Amplemarket API
1. Sign up at [amplemarket.com](https://www.amplemarket.com)
2. Navigate to Settings → API ([direct link](https://app.amplemarket.com/settings/api))
3. Generate a new API key
4. Copy the key (starts with `amp_live_` or `amp_test_`)

```env
AMPLEMARKET_API_KEY=amp_live_your_amplemarket_api_key
AMPLEMARKET_BASE_URL=https://api.amplemarket.com
```

**Testing the API:**
```bash
# Run the test script to verify Amplemarket is working
node test-amplemarket.js
```

See [AMPLEMARKET_SETUP.md](./AMPLEMARKET_SETUP.md) for detailed setup instructions.

### 3. Google Sheet Setup

Create a Google Sheet with the following columns:

| Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H | Column I | Column J | Column K | Column L | Column M |
|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|
| Client ID | First Name | Last Name | Account Name | Country F. | Phone | Mobile | Email | (Empty) | PoC Language | CS account owner | Status | Last Validated |

**Important**: Share the sheet with your Google Service Account email with Editor permissions.

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

**Demo Credentials:**
- **Admin**: `admin@whatsappvalidator.com` / `password123`
- **Demo User**: `demo@whatsappvalidator.com` / `password123`

## 🚀 Deploy to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Manual Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

4. **Add Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Redeploy the project

### Vercel Configuration
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node Version**: 18.x or higher

The app is fully optimized for Vercel with:
- Server-side rendering (SSR)
- API routes as serverless functions
- Automatic HTTPS
- Edge network CDN
- Zero configuration needed

## 📱 Usage Guide

### Dashboard Overview
- **Stats Cards**: Monitor total customers, valid numbers, invalid numbers, and pending validations
- **Quick Actions**: Refresh data, import & enrich sheets, bulk operations
- **Customer Table**: View, sort, and manage all customer records

### Single Customer Validation
1. Click the phone icon next to any customer
2. Enter or modify phone number
3. View detailed validation results
4. Check WhatsApp compatibility and carrier info

### Search Alternative Numbers
1. Click the search icon next to any customer
2. AI searches using customer name, email, and company
3. Select from suggested alternatives with confidence scores
4. Automatically validates the selected number

### Bulk Operations
1. Select multiple customers using checkboxes
2. Click "Validate Selected" or "Validate All"
3. Monitor real-time progress
4. View detailed results summary

### Import & Enrich Data
1. Click "Import & Enrich Sheet" button
2. Upload Excel (.xlsx, .xls) or CSV file
3. System auto-normalizes phone numbers
4. AI finds alternatives for invalid entries
5. Review and confirm suggestions
6. Bulk import to Google Sheet

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - Fetch all customers
- `PUT /api/customers` - Update customer data

### Validation
- `POST /api/validate/single` - Validate single phone
- `POST /api/validate/bulk` - Bulk validate phones

### Search & Enrichment
- `POST /api/search/phone` - Search alternative phones
- `POST /api/import/enrich` - Process & enrich data
- `PUT /api/import/enrich` - Save enriched data

## 🔒 Security Features

- ✅ Secure password hashing (bcrypt, 12 rounds)
- ✅ JWT tokens with 8-hour expiration
- ✅ HTTP-only cookies (XSS protection)
- ✅ Account lockout (5 failed attempts)
- ✅ IP rate limiting (10 attempts per IP)
- ✅ Session management with auto-refresh
- ✅ Input validation and sanitization
- ✅ Protected API routes with middleware

## 🎨 UI Components

### Custom Classes
- `.glass-card` - Glass morphism card effect
- `.glass-card-light` - Lighter glass card variant
- `.btn-primary` - Purple-to-pink gradient button
- `.btn-coral` - Coral gradient button
- `.gradient-text` - Multi-color gradient text
- `.animated-gradient` - Infinite animated background

### Status Badges
- **Valid**: Green with checkmark icon
- **Invalid**: Red with X icon
- **Pending**: Yellow with clock icon

## 🌟 Performance

- Batch processing for bulk operations
- API rate limiting to prevent abuse
- Optimized React re-renders
- Efficient Google Sheets batch updates
- CDN delivery via Vercel Edge Network
- Server-side rendering for fast initial loads

## 🐛 Troubleshooting

### Common Issues

**Authentication fails:**
- Check `NEXTAUTH_SECRET` is set correctly
- Verify JWT tokens aren't expired
- Clear browser cookies and try again

**Google Sheets errors:**
- Verify service account has Editor access
- Check `GOOGLE_SHEET_ID` is correct
- Ensure private key is properly formatted

**Twilio validation fails:**
- Verify account has sufficient credits
- Check Account SID and Auth Token
- Ensure phone numbers are in E.164 format

**Amplemarket search returns no results:**
- Verify API key is valid and starts with `amp_live_` or `amp_test_`
- Run the test script: `node test-amplemarket.js`
- Check account has active subscription and credits
- Review API rate limits (350 requests/minute)
- See detailed troubleshooting in [AMPLEMARKET_SETUP.md](./AMPLEMARKET_SETUP.md)

## 📄 License

Private - All rights reserved

---

**Built with ❤️ using Next.js 14, TypeScript, and modern design principles**
