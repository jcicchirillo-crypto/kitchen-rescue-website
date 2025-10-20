# Kitchen Rescue Booking System Setup

## Overview
Complete booking flow with **Stripe-only** payments, including 4 pages:
1. Site Suitability Checklist
2. Booking Form
3. Payment (Stripe Only)
4. Confirmation

## Files Created
- `booking-checklist.html` - Page 1: Site suitability checklist
- `booking-form.html` - Page 2: Customer details form
- `booking-payment.html` - Page 3: Stripe payment processing
- `booking-confirmation.html` - Page 4: Booking confirmation
- `email-templates/` - HTML email templates
- `server.js` - Express server with Stripe integration
- `package.json` - Node.js dependencies

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file with:
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
PORT=3000
```

### 3. Update Stripe Keys
In `booking-payment.html`, replace:
```javascript
const stripe = Stripe('pk_test_your_publishable_key_here');
```
with your actual Stripe publishable key.

**Note:** This system uses **Stripe only** - no other payment methods are included.

### 4. Start Server
```bash
npm start
```

### 5. Access Booking Flow
- Visit: `http://localhost:3000/booking-checklist.html`
- Or start from availability page: `http://localhost:3000/availability.html`

## Stripe Setup

### 1. Create Stripe Account
- Sign up at https://stripe.com
- Get your API keys from the dashboard

### 2. Test Mode
- Use test keys (pk_test_... and sk_test_...)
- Use test card numbers:
  - Success: 4242 4242 4242 4242
  - Decline: 4000 0000 0000 0002

### 3. Webhook Setup (Optional)
- Set up webhooks for payment confirmation
- Endpoint: `https://yourdomain.com/webhook`

## Email Integration

### Option 1: SendGrid
1. Sign up at https://sendgrid.com
2. Get API key
3. Add to `.env`: `SENDGRID_API_KEY=your_key`
4. Uncomment SendGrid code in `server.js`

### Option 2: Mailgun
1. Sign up at https://mailgun.com
2. Get API key and domain
3. Add to `.env`:
   ```
   MAILGUN_API_KEY=your_key
   MAILGUN_DOMAIN=your_domain
   ```

## Database Integration (Optional)

### MongoDB
```bash
npm install mongodb
```
Add to `.env`: `MONGODB_URI=mongodb://localhost:27017/kitchen-rescue`

### PostgreSQL
```bash
npm install pg
```
Add to `.env`: `DATABASE_URL=postgresql://user:pass@localhost:5432/kitchen_rescue`

## Features

### ✅ Completed
- 4-page booking flow
- Site suitability checklist
- Customer form with validation
- Stripe payment integration
- Booking confirmation
- Email templates (HTML)
- Responsive design
- Progress tracking
- Error handling

### 🔄 Next Steps
- Set up actual email service
- Add database storage
- Implement webhook handling
- Add admin dashboard
- Set up reminder emails
- Add booking management

## Testing

### Test the Flow
1. Go to availability page
2. Select dates and postcode
3. Click "Book Now" (you'll need to add this button)
4. Complete checklist
5. Fill out form
6. Process payment with test card
7. View confirmation

### Test Cards
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires 3D Secure: 4000 0025 0000 3155

## Customization

### Styling
- All pages use your existing `styles.css`
- Custom styles in each HTML file
- Responsive design included

### Content
- Update email templates in `email-templates/`
- Modify form fields in `booking-form.html`
- Update pricing logic in payment page

### Integration
- Connect to your existing availability calendar
- Add "Book Now" button to availability page
- Update server endpoints as needed
