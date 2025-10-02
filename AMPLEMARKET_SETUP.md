# 🔍 Amplemarket API Setup Guide

## Overview
This guide will help you configure and test the Amplemarket API integration for finding phone numbers for customers.

## Step 1: Get Your Amplemarket API Key

1. Log in to your Amplemarket account at [https://app.amplemarket.com](https://app.amplemarket.com)
2. Navigate to **Settings → API** (or visit directly: [https://app.amplemarket.com/settings/api](https://app.amplemarket.com/settings/api))
3. Click **"Create New API Key"** or **"Generate API Key"**
4. Copy the API key (it will look something like: `amp_live_xxxxxxxxxxxxxxxxxxxx`)
5. Store it securely - you won't be able to see it again!

## Step 2: Configure Environment Variables

Create a `.env.local` file in the root of your project if it doesn't exist:

```bash
# Amplemarket API Configuration
AMPLEMARKET_API_KEY=amp_live_your_actual_api_key_here
AMPLEMARKET_BASE_URL=https://api.amplemarket.com
```

**Important Notes:**
- Never commit `.env.local` to git (it's already in `.gitignore`)
- The base URL is usually `https://api.amplemarket.com` (already set as default)
- If you have a different API endpoint, update the `AMPLEMARKET_BASE_URL` accordingly

## Step 3: Verify API Key Format

Your API key should:
- Start with `amp_live_` for production or `amp_test_` for testing
- Be approximately 40-50 characters long
- Only contain alphanumeric characters and underscores

## Step 4: Test the Integration

### Option 1: Test via UI
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Log in with your credentials

4. Find a customer in the table

5. Click the **Search Icon** (🔍) next to any customer

6. The system will:
   - Search for the customer using their name, email, and company
   - Display alternative phone numbers found
   - Show confidence scores for each suggestion

7. Check the **browser console** (F12 → Console tab) for detailed logs

### Option 2: Test via API Endpoint
Use a tool like Postman, Insomnia, or curl:

```bash
curl -X POST http://localhost:3000/api/search/phone \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Example Corp"
  }'
```

**Expected Response:**
```json
{
  "message": "Phone search completed",
  "results": [
    {
      "id": "contact-123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Example Corp",
      "position": "CEO",
      "confidence": 0.85
    }
  ],
  "count": 1
}
```

## Step 5: Monitoring and Debugging

### Server-Side Logs
When you use the search feature, you'll see detailed logs in your terminal:

```
🔍 Amplemarket: Starting search with params: { name: "...", email: "...", company: "..." }
✅ Amplemarket API key present: amp_live_x...
🌐 Base URL: https://api.amplemarket.com
📤 Strategy 1: GET /people/find?email=...
🔗 URL: https://api.amplemarket.com/people/find?email=...
✅ GET /people/find SUCCESS - Status: 200
📥 Response data: { ... }
🔍 Parsing Amplemarket response...
📋 Single person object detected
📊 Processing 1 contact(s)...
🔑 Available fields: id, email, name, phone_number, mobile_number, ...
📞 Found 2 phone number(s): ["+1234567890", "+9876543210"]
✅ Found 2 phone number(s) out of 1 contact(s)
🎉 Found 2 phone numbers!
```

### Common Issues and Solutions

#### Issue 1: "Amplemarket API key not configured"
**Problem:** The API key is missing or not loaded.

**Solutions:**
- Verify `.env.local` exists in the project root
- Ensure `AMPLEMARKET_API_KEY` is set in `.env.local`
- Restart the development server after adding the key
- Check for typos in the environment variable name

#### Issue 2: "401 Unauthorized" Error
**Problem:** API key is invalid or expired.

**Solutions:**
- Verify the API key is correct (check for extra spaces)
- Generate a new API key from Amplemarket settings
- Ensure you're using a production key (`amp_live_`) not a test key
- Check if your Amplemarket account is active

#### Issue 3: "429 Too Many Requests"
**Problem:** Rate limit exceeded.

**Solutions:**
- Amplemarket allows 350 requests per minute for `/people/find`
- Wait a minute before trying again
- Reduce the frequency of bulk searches
- Consider implementing caching for frequently searched contacts

#### Issue 4: "No phone numbers found"
**Problem:** The API returned a contact but no phone numbers.

**Solutions:**
- Check the console logs to see the actual response structure
- The contact might not have phone data in Amplemarket's database
- Try searching with different parameters (email is most accurate)
- Verify the contact exists in Amplemarket's database

#### Issue 5: "insufficient_credits" Error
**Problem:** Your Amplemarket account has no credits.

**Solutions:**
- Check your Amplemarket credit balance
- Purchase more credits or upgrade your plan
- The mock data fallback will be used automatically

## Step 6: Understanding the Search Strategies

The integration uses 3 fallback strategies to find phone numbers:

### Strategy 1: Find by Email (Most Accurate)
```
GET https://api.amplemarket.com/people/find?email={email}
```
- **When used:** If the customer has an email address
- **Accuracy:** Highest (email is a unique identifier)
- **Rate Limit:** 350 requests/minute

### Strategy 2: Find by Name + Company
```
GET https://api.amplemarket.com/people/find?name={name}&company_name={company}
```
- **When used:** If email search fails but name and company are available
- **Accuracy:** Good (if name and company are unique)
- **Rate Limit:** 350 requests/minute

### Strategy 3: Broad Search
```
POST https://api.amplemarket.com/people/search
Body: { person_name: "...", company_names: ["..."] }
```
- **When used:** As a last resort if other strategies fail
- **Accuracy:** Lower (returns multiple potential matches)
- **Returns:** Up to 10 results

## Step 7: Phone Number Fields

The API checks for phone numbers in these fields (in priority order):

1. `mobile_number` - Cell phone (preferred)
2. `phone_number` - General contact number
3. `work_number` - Office phone
4. `sourced_number` - From external sources
5. `manually_added_number` - Manually added
6. Other fallback fields: `phone`, `mobile_phone`, `direct_phone`, etc.

## Step 8: Production Deployment

When deploying to production (e.g., Vercel):

1. Go to your project settings in the deployment platform
2. Add the environment variables:
   ```
   AMPLEMARKET_API_KEY=amp_live_your_actual_api_key
   AMPLEMARKET_BASE_URL=https://api.amplemarket.com
   ```
3. Redeploy the application
4. Test the integration in production

## API Reference

### Search for Phone Numbers
**Endpoint:** `POST /api/search/phone`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Example Corp",
  "currentPhone": "+1234567890" (optional - to exclude from results)
}
```

**Response:**
```json
{
  "message": "Phone search completed",
  "results": [
    {
      "id": "contact-123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1555123456",
      "company": "Example Corp",
      "position": "CEO",
      "confidence": 0.85
    }
  ],
  "count": 1
}
```

## Best Practices

1. **Use Email When Possible:** Email searches are the most accurate
2. **Cache Results:** Store search results to avoid redundant API calls
3. **Handle Rate Limits:** Implement delays between bulk searches
4. **Monitor Credits:** Keep track of your Amplemarket credit usage
5. **Validate Results:** Always validate phone numbers with Twilio after finding them
6. **Fallback to Mock Data:** The system automatically falls back to mock data during development

## Support

If you encounter issues:

1. **Check Server Logs:** Look for detailed error messages in the terminal
2. **Check Browser Console:** Client-side errors will appear here
3. **Verify API Key:** Ensure it's correct and active
4. **Test Manually:** Try the Amplemarket API directly with curl
5. **Contact Amplemarket Support:** For API-specific issues

## Testing Checklist

- [ ] `.env.local` file created with `AMPLEMARKET_API_KEY`
- [ ] Development server restarted after adding the key
- [ ] API key format is correct (`amp_live_...`)
- [ ] Search feature works via UI
- [ ] Server logs show detailed API responses
- [ ] Phone numbers are successfully found
- [ ] Error handling works (try with invalid email)
- [ ] Rate limiting is respected
- [ ] Production environment variables are set

## Next Steps

Once the Amplemarket API is working:

1. Test with real customer data
2. Validate found phone numbers using Twilio
3. Implement caching to reduce API calls
4. Monitor credit usage
5. Set up alerts for API failures
6. Consider implementing a queue for bulk searches

---

**Last Updated:** 2025-10-02
**Maintainer:** WhatsApp Validator Team

