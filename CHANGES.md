# 🎯 Amplemarket API Integration - Changes Summary

## Date: 2025-10-02

## Objective
Make the Amplemarket API work for finding phone numbers for customers.

## Changes Made

### 1. **Enhanced Response Parsing** (`lib/amplemarket.ts`)
- ✅ Added support for multiple Amplemarket response formats
- ✅ Added detection for direct person objects (without `object` field)
- ✅ Updated phone field priority based on official API documentation:
  - `mobile_number` (preferred - cell phone)
  - `phone_number` (general contact)
  - `work_number` (office phone)
  - `sourced_number` (external sources)
  - `manually_added_number` (manually added)
  - Plus 10+ fallback field names
- ✅ Now extracts **multiple phone numbers** per contact
- ✅ Deduplicates phone numbers automatically
- ✅ Added comprehensive field name mapping for emails and companies

### 2. **Improved Error Handling** (`lib/amplemarket.ts`)
- ✅ Enhanced error logging with full response data
- ✅ Added HTTP status codes to error messages
- ✅ Included response headers in error logs for debugging
- ✅ Added stack traces for parsing errors
- ✅ Better error messages for troubleshooting

### 3. **Enhanced Debugging** (`lib/amplemarket.ts`)
- ✅ Added logging of raw API response data
- ✅ Logs all available fields in contact objects
- ✅ Shows full contact data structure for debugging
- ✅ Warns about missing phone numbers with context
- ✅ Displays response structure when parsing fails

### 4. **Documentation** (New Files)
- ✅ **AMPLEMARKET_SETUP.md** - Comprehensive setup guide with:
  - Step-by-step API key generation
  - Environment variable configuration
  - Testing instructions
  - Troubleshooting guide
  - Common issues and solutions
  - API reference
  - Best practices
- ✅ **test-amplemarket.js** - Standalone test script:
  - Tests all 3 search strategies
  - Color-coded console output
  - Detailed error messages
  - Phone number extraction verification
- ✅ **env.template** - Environment variables template
- ✅ **CHANGES.md** - This file

### 5. **Updated README.md**
- ✅ Added link to Amplemarket settings page
- ✅ Included test script instructions
- ✅ Enhanced troubleshooting section
- ✅ Added reference to detailed setup guide

## How It Works Now

### Search Strategy
The integration uses 3 fallback strategies:

1. **Strategy 1:** `GET /people/find?email={email}` - Most accurate
2. **Strategy 2:** `GET /people/find?name={name}&company_name={company}` - Good accuracy
3. **Strategy 3:** `POST /people/search` - Broad search with multiple results

### Phone Number Extraction
- Checks 16+ different phone field names
- Handles strings, arrays, and objects
- Extracts multiple phone numbers per contact
- Deduplicates results
- Validates phone number length (>5 chars)

### Error Handling
- Graceful fallback to mock data during development
- Detailed error logging for debugging
- Specific error messages for common issues (401, 429, 402, 404)
- Doesn't break the app when API fails

## Testing Instructions

### Option 1: Quick Test
```bash
node test-amplemarket.js
```

### Option 2: Via Application
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Click search icon (🔍) next to any customer
4. Check browser console and terminal logs

## Setup Required

1. **Get Amplemarket API Key:**
   - Visit: https://app.amplemarket.com/settings/api
   - Generate new API key
   - Copy the key (starts with `amp_live_` or `amp_test_`)

2. **Create `.env.local`:**
   ```bash
   cp env.template .env.local
   ```

3. **Add API Key:**
   ```env
   AMPLEMARKET_API_KEY=amp_live_your_actual_key_here
   AMPLEMARKET_BASE_URL=https://api.amplemarket.com
   ```

4. **Restart Server:**
   ```bash
   npm run dev
   ```

5. **Test:**
   ```bash
   node test-amplemarket.js
   ```

## API Endpoints Used

- `GET https://api.amplemarket.com/people/find`
- `POST https://api.amplemarket.com/people/search`

## Rate Limits
- 350 requests per minute for `/people/find`
- System implements delays between batch searches

## Files Modified

1. `lib/amplemarket.ts` - Enhanced parsing and error handling
2. `README.md` - Updated setup instructions

## Files Created

1. `AMPLEMARKET_SETUP.md` - Comprehensive setup guide
2. `test-amplemarket.js` - API test script
3. `env.template` - Environment variables template
4. `CHANGES.md` - This summary document

## Breaking Changes
None - All changes are backward compatible.

## Next Steps

1. Add your Amplemarket API key to `.env.local`
2. Run `node test-amplemarket.js` to verify
3. Test in the application UI
4. Monitor console logs for any issues
5. See `AMPLEMARKET_SETUP.md` for detailed guidance

## Support

For issues or questions:
- See `AMPLEMARKET_SETUP.md` for troubleshooting
- Check server logs for detailed error messages
- Run `test-amplemarket.js` for diagnosis
- Review Amplemarket API docs: https://docs.amplemarket.com

---

**Status:** ✅ Ready for Testing
**Requires:** Amplemarket API Key in `.env.local`

