# QuickBooks Integration Setup Guide

This guide will help you set up QuickBooks integration for your Kitchen Rescue admin system.

## Prerequisites

1. A QuickBooks Online account
2. Developer access to Intuit Developer Portal
3. Your Kitchen Rescue admin system running

## Step 1: Create a QuickBooks App

1. Go to [Intuit Developer Portal](https://developer.intuit.com/)
2. Sign in with your Intuit account
3. Click "Create an App"
4. Choose "QuickBooks Online" as the platform
5. Fill in the required information:
   - App Name: Kitchen Rescue Admin
   - App Description: Admin system for Kitchen Rescue bookings
   - Company Name: Your company name
   - Contact Email: Your email
6. Save your app

## Step 2: Get Your Credentials

1. In your app dashboard, go to the "Keys & OAuth" tab
2. Note down:
   - **Client ID** (App ID)
   - **Client Secret** (App Secret)
3. Set your redirect URIs:
   - Development: `http://localhost:3000/auth/quickbooks/callback`
   - Production: `https://yourdomain.com/auth/quickbooks/callback`

## Step 3: OAuth Setup

1. Install the required dependencies (already done):
   ```bash
   npm install intuit-oauth node-quickbooks
   ```

2. Create OAuth endpoints in your server.js (add these routes):

```javascript
// QuickBooks OAuth routes
app.get('/auth/quickbooks', (req, res) => {
    const oauthClient = new OAuthClient({
        clientId: process.env.QUICKBOOKS_CLIENT_ID,
        clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
        environment: 'sandbox', // or 'production'
        redirectUri: 'http://localhost:3000/auth/quickbooks/callback'
    });
    
    const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting],
        state: 'kitchen-rescue-admin'
    });
    
    res.redirect(authUri);
});

app.get('/auth/quickbooks/callback', (req, res) => {
    const oauthClient = new OAuthClient({
        clientId: process.env.QUICKBOOKS_CLIENT_ID,
        clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
        environment: 'sandbox', // or 'production'
        redirectUri: 'http://localhost:3000/auth/quickbooks/callback'
    });
    
    oauthClient.createToken(req.url)
        .then((authResponse) => {
            console.log('QuickBooks tokens:', {
                accessToken: authResponse.getJson().access_token,
                refreshToken: authResponse.getJson().refresh_token,
                realmId: req.query.realmId
            });
            
            // Store these tokens securely in your .env file
            res.json({
                message: 'QuickBooks connected successfully!',
                tokens: {
                    accessToken: authResponse.getJson().access_token,
                    refreshToken: authResponse.getJson().refresh_token,
                    realmId: req.query.realmId
                }
            });
        })
        .catch((error) => {
            console.error('OAuth error:', error);
            res.status(500).json({ error: 'Failed to connect to QuickBooks' });
        });
});
```

## Step 4: Environment Variables

Add these variables to your `.env` file:

```env
# QuickBooks Configuration
QUICKBOOKS_CLIENT_ID=your_client_id_here
QUICKBOOKS_CLIENT_SECRET=your_client_secret_here
QUICKBOOKS_ACCESS_TOKEN=your_access_token_here
QUICKBOOKS_REFRESH_TOKEN=your_refresh_token_here
QUICKBOOKS_REALM_ID=your_realm_id_here
```

## Step 5: Test the Integration

1. Start your server: `node server.js`
2. Go to: `http://localhost:3000/auth/quickbooks`
3. Complete the OAuth flow
4. Copy the tokens to your `.env` file
5. Test the sync in your admin panel

## Step 6: Production Setup

1. Change `environment: 'sandbox'` to `environment: 'production'`
2. Update redirect URIs to your production domain
3. Update your QuickBooks app settings in the Intuit Developer Portal
4. Test thoroughly in the production environment

## Features Included

✅ **Customer Management**: Automatically creates customers in QuickBooks
✅ **Invoice Creation**: Creates invoices for confirmed bookings
✅ **Payment Tracking**: Syncs payment status
✅ **Error Handling**: Graceful fallback when QuickBooks is unavailable
✅ **Admin Interface**: Easy-to-use sync buttons in the admin panel

## Usage in Admin Panel

1. Log in to your admin panel: `http://localhost:3000/admin`
2. Click on any booking to view details
3. Click "Sync to QuickBooks" button
4. The system will:
   - Create or find the customer in QuickBooks
   - Create an invoice with the booking details
   - Return a confirmation with the QuickBooks invoice ID

## Troubleshooting

### Common Issues

1. **"QuickBooks not configured"**: Make sure all environment variables are set
2. **OAuth errors**: Check your redirect URIs match exactly
3. **Token expired**: Use the refresh token to get a new access token
4. **API errors**: Check the QuickBooks API documentation for rate limits

### Debug Mode

The integration includes debug logging. Check your server console for detailed error messages.

## Security Notes

- Never commit your `.env` file to version control
- Store QuickBooks tokens securely
- Use HTTPS in production
- Regularly rotate your tokens
- Monitor API usage to avoid rate limits

## Support

For QuickBooks API issues, refer to:
- [QuickBooks API Documentation](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice)
- [Intuit Developer Community](https://intuitdeveloper.lc/)
- [QuickBooks API Support](https://help.developer.intuit.com/)

For Kitchen Rescue admin issues, check the server logs and ensure all dependencies are installed correctly.
