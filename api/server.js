const express = require('express');
// Load .env file if available
try {
    require('dotenv').config();
    console.log('Environment variables loaded from .env file');
} catch (error) {
    console.log('dotenv not available, using system environment variables - force redeploy');
}
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Initialize Stripe only if credentials are available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    const stripeLib = require('stripe');
    stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized successfully');
} else {
    console.log('Stripe credentials not configured. Payment processing will be simulated.');
}

// Initialize QuickBooks only if credentials are available
let OAuthClient = null;
let QuickBooks = null;
if (process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET) {
    OAuthClient = require('intuit-oauth');
    QuickBooks = require('node-quickbooks');
    console.log('QuickBooks initialized successfully');
} else {
    console.log('QuickBooks credentials not configured. QuickBooks integration will be simulated.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Email transporter setup
let transporter = null;

// Initialize email transporter if credentials are available
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: 'mail.privateemail.com', // Namecheap Private Email SMTP
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    
    // Test the connection
    transporter.verify((error, success) => {
        if (error) {
            console.log('Email configuration error:', error);
        } else {
            console.log('Email server is ready to send messages');
        }
    });
} else {
    console.log('Email credentials not configured. Quote emails will not be sent.');
    console.log('To enable email quotes, set EMAIL_USER and EMAIL_PASS in your .env file');
}

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Serve all HTML files
app.get('/*.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', req.path));
});

// Serve admin static files (CSS, JS) - this must come BEFORE the routes
app.use('/static', express.static(path.join(__dirname, 'admin/build/static')));

// Admin routes - serve React app for all admin routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/build/index.html'));
});

app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/build/index.html'));
});

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
    try {
        console.log('Payment intent request received:', req.body);
        
        const { amount, currency, booking_data } = req.body;
        
        // Check if Stripe is configured
        if (!stripe) {
            console.log('Stripe not configured - simulating payment intent');
            return res.json({
                client_secret: 'pi_simulated_' + Date.now(),
                booking_reference: generateBookingReference(),
                simulated: true
            });
        }
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
            metadata: {
                booking_data: JSON.stringify(booking_data),
                booking_reference: generateBookingReference()
            }
        });

        console.log('Payment intent created:', paymentIntent.id);
        
        res.json({
            client_secret: paymentIntent.client_secret,
            booking_reference: paymentIntent.metadata.booking_reference
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Check server logs for more information'
        });
    }
});

// Handle successful payment
app.post('/payment-success', async (req, res) => {
    try {
        const { payment_intent_id, booking_data } = req.body;
        
        // Check if Stripe is configured
        if (!stripe) {
            console.log('Stripe not configured - simulating payment success');
            return res.json({ 
                success: true, 
                booking_reference: 'SIM-' + Date.now(),
                simulated: true
            });
        }
        
        // Retrieve payment intent to confirm it was successful
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        if (paymentIntent.status === 'succeeded') {
            // Send confirmation email
            await sendConfirmationEmail(booking_data, paymentIntent.metadata.booking_reference);
            
            // Store booking in database (you would implement this)
            await storeBooking(booking_data, paymentIntent.metadata.booking_reference);
            
            res.json({ success: true, booking_reference: paymentIntent.metadata.booking_reference });
        } else {
            res.status(400).json({ error: 'Payment not successful' });
        }
    } catch (error) {
        console.error('Error handling payment success:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send confirmation email
async function sendConfirmationEmail(bookingData, bookingReference) {
    // This would integrate with your email service (SendGrid, Mailgun, etc.)
    console.log('Sending confirmation email to:', bookingData.email);
    console.log('Booking reference:', bookingReference);
    
    // Example using a service like SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
        to: bookingData.email,
        from: 'noreply@kitchenrescue.com',
        subject: `✅ Your Kitchen Pod Booking is Confirmed – Reference #${bookingReference}`,
        html: generateEmailHTML(bookingData, bookingReference)
    };
    
    await sgMail.send(msg);
    */
}

// Store booking in database
async function storeBooking(bookingData, bookingReference) {
    // This would integrate with your database (MongoDB, PostgreSQL, etc.)
    console.log('Storing booking:', bookingReference);
    
    // Example booking record:
    const booking = {
        reference: bookingReference,
        customer: {
            name: bookingData.fullName,
            email: bookingData.email,
            phone: bookingData.phone
        },
        delivery: {
            address: bookingData.deliveryAddress,
            postcode: bookingData.postcode,
            date: bookingData.deliveryDate
        },
        hire: {
            length: bookingData.hireLength,
            dates: bookingData.selectedDates
        },
        notes: bookingData.notes,
        status: 'confirmed',
        deposit_paid: true,
        created_at: new Date()
    };
    
    // Store in your database here
    console.log('Booking stored:', booking);
}

// Generate booking reference
function generateBookingReference() {
    return 'KR' + Date.now().toString().slice(-6);
}

// Schedule reminder emails (this would typically be handled by a cron job or scheduled function)
app.post('/schedule-reminder', async (req, res) => {
    try {
        const { booking_reference, delivery_date } = req.body;
        
        // Calculate 5 days before delivery
        const reminderDate = new Date(delivery_date);
        reminderDate.setDate(reminderDate.getDate() - 5);
        
        // Schedule email (you would use a service like Bull Queue, Agenda, or similar)
        console.log(`Scheduling reminder email for ${reminderDate} for booking ${booking_reference}`);
        
        res.json({ success: true, reminder_date: reminderDate });
    } catch (error) {
        console.error('Error scheduling reminder:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send quote email
app.post('/send-quote-email', async (req, res) => {
    try {
        const { name, email, phone, notes, postcode, selectedDates, startDate, endDate, days, dailyCost, deliveryCost, collectionCost, totalCost } = req.body;
        
        console.log('Quote email request received for:', email);
        
        // Check if email is configured
        if (!transporter) {
            console.log('Email not configured - storing quote request for manual follow-up');
            
            // Store the quote request (you could save to a database or file)
            const quoteRequest = {
                timestamp: new Date().toISOString(),
                name, email, phone, notes, postcode, selectedDates, startDate, endDate, days, dailyCost, deliveryCost, collectionCost, totalCost
            };
            
            console.log('Quote request details:', quoteRequest);
            
            return res.json({ 
                success: true, 
                message: 'Quote request received. We will contact you within 24 hours.',
                note: 'Email system not configured - manual follow-up required'
            });
        }
        
        // Generate quote email HTML
        const quoteEmailHTML = generateQuoteEmailHTML({
            name, email, phone, notes, postcode, selectedDates, startDate, endDate, days, dailyCost, deliveryCost, collectionCost, totalCost
        });
        
        // Send email to customer
        const customerMailOptions = {
            from: `"Kitchen Rescue" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Your Kitchen Pod Quote - ${startDate} to ${endDate}`,
            html: quoteEmailHTML
        };
        
        await transporter.sendMail(customerMailOptions);
        
        // Send notification email to business
        const businessMailOptions = {
            from: `"Kitchen Rescue" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `New Quote Request from ${name}`,
            html: generateBusinessNotificationHTML({
                name, email, phone, notes, postcode, selectedDates, startDate, endDate, days, dailyCost, deliveryCost, collectionCost, totalCost
            })
        };
        
        await transporter.sendMail(businessMailOptions);
        
        console.log('Quote emails sent successfully');
        res.json({ success: true, message: 'Quote sent successfully' });
        
    } catch (error) {
        console.error('Error sending quote email:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send quote email',
            details: error.message 
        });
    }
});

// Generate quote email HTML for customer
function generateQuoteEmailHTML(data) {
    // Determine the base URL based on environment
    const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://thekitchenrescue.co.uk' 
        : 'http://localhost:3000';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Kitchen Pod Quote</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .quote-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .cost-breakdown { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cost-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .total-row { font-weight: bold; font-size: 1.2em; color: #dc2626; border-top: 2px solid #dc2626; padding-top: 15px; margin-top: 15px; }
            .cta-button { background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏠 Your Kitchen Pod Quote</h1>
            <p>Thank you for your interest in Kitchen Rescue!</p>
        </div>
        
        <div class="content">
            <p>Hi ${data.name},</p>
            
            <p>Thank you for requesting a quote for our temporary kitchen pod service. Here are the details for your selected dates:</p>
            
            <div class="quote-details">
                <h3>📅 Booking Details</h3>
                <p><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</p>
                <p><strong>Duration:</strong> ${data.days} day${data.days > 1 ? 's' : ''}</p>
                <p><strong>Postcode:</strong> ${data.postcode}</p>
                ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
                ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            </div>
            
            <div class="cost-breakdown">
                <h3>💰 Cost Breakdown</h3>
                <div class="cost-row">
                    <span>Daily hire (${data.days} day${data.days > 1 ? 's' : ''} × £70)</span>
                    <span>£${data.dailyCost}</span>
                </div>
                <div class="cost-row">
                    <span>Delivery</span>
                    <span>£${data.deliveryCost}</span>
                </div>
                <div class="cost-row">
                    <span>Collection</span>
                    <span>£${data.collectionCost}</span>
                </div>
                <div class="cost-row total-row">
                    <span>Total (excluding VAT)</span>
                    <span>£${data.totalCost}</span>
                </div>
                <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">*VAT will be added at 20%</p>
            </div>
            
            <p>This quote is valid for 7 days. To secure your booking, simply:</p>
            <ol>
                <li>Click the "Book Now" button below</li>
                <li>Complete our quick checklist</li>
                <li>Pay your £250 security deposit</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="${baseUrl}/availability.html?dates=${data.selectedDates.join(',')}&postcode=${data.postcode}" class="cta-button">📅 Book Now</a>
            </div>
            
            <p>If you have any questions or would like to discuss your requirements, please don't hesitate to contact us:</p>
            <ul>
                <li>📞 Phone: +44 7342 606655</li>
                <li>📧 Email: hello@thekitchenrescue.co.uk</li>
                <li>💬 WhatsApp: <a href="https://wa.me/447342606655">Click here to chat</a></li>
            </ul>
            
            <p>We look forward to helping you keep your family fed during your kitchen renovation!</p>
            
            <p>Best regards,<br>
            The Kitchen Rescue Team</p>
        </div>
        
        <div class="footer">
            <p>Woodpeckers Hertfordshire Ltd t/a The Kitchen Rescue<br>
            Company No. 14316407</p>
        </div>
    </body>
    </html>
    `;
}

// Generate business notification email HTML
function generateBusinessNotificationHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Quote Request</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .customer-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .quote-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📧 New Quote Request</h1>
            <p>Customer has requested a quote via the website</p>
        </div>
        
        <div class="content">
            <div class="customer-details">
                <h3>👤 Customer Details</h3>
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
                <p><strong>Postcode:</strong> ${data.postcode}</p>
                ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            </div>
            
            <div class="quote-details">
                <h3>📅 Quote Details</h3>
                <p><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</p>
                <p><strong>Duration:</strong> ${data.days} day${data.days > 1 ? 's' : ''}</p>
                <p><strong>Total Cost:</strong> £${data.totalCost} + VAT</p>
                <p><strong>Selected Dates:</strong> ${data.selectedDates.join(', ')}</p>
            </div>
            
            <p><strong>Action Required:</strong> Follow up with customer within 24 hours.</p>
        </div>
    </body>
    </html>
    `;
}

// Admin API endpoints
// Simple authentication middleware
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token === 'dummy_token') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Get all bookings
app.get('/api/bookings', authenticateAdmin, (req, res) => {
    try {
        // Read bookings from JSON file (replace with database later)
        const bookingsData = fs.readFileSync('bookings.json', 'utf8');
        const bookings = JSON.parse(bookingsData);
        res.json(bookings);
    } catch (error) {
        // Return empty array if file doesn't exist
        res.json([]);
    }
});

// Create new booking
app.post('/api/bookings', authenticateAdmin, (req, res) => {
    try {
        const newBooking = {
            id: `KR-${Date.now()}`,
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        // Read existing bookings
        let bookings = [];
        try {
            const bookingsData = fs.readFileSync('bookings.json', 'utf8');
            bookings = JSON.parse(bookingsData);
        } catch (error) {
            // File doesn't exist, start with empty array
        }
        
        // Add new booking
        bookings.push(newBooking);
        
        // Write back to file
        fs.writeFileSync('bookings.json', JSON.stringify(bookings, null, 2));
        
        res.json(newBooking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Update booking
app.put('/api/bookings/:id', authenticateAdmin, (req, res) => {
    try {
        const bookingId = req.params.id;
        
        // Read existing bookings
        let bookings = [];
        try {
            const bookingsData = fs.readFileSync('bookings.json', 'utf8');
            bookings = JSON.parse(bookingsData);
        } catch (error) {
            return res.status(404).json({ error: 'Bookings file not found' });
        }
        
        // Find and update booking
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        bookings[bookingIndex] = { ...bookings[bookingIndex], ...req.body };
        
        // Write back to file
        fs.writeFileSync('bookings.json', JSON.stringify(bookings, null, 2));
        
        res.json(bookings[bookingIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// Delete booking
app.delete('/api/bookings/:id', authenticateAdmin, (req, res) => {
    try {
        const bookingId = req.params.id;
        
        // Read existing bookings
        let bookings = [];
        try {
            const bookingsData = fs.readFileSync('bookings.json', 'utf8');
            bookings = JSON.parse(bookingsData);
        } catch (error) {
            return res.status(404).json({ error: 'Bookings file not found' });
        }
        
        // Filter out the booking
        const filteredBookings = bookings.filter(b => b.id !== bookingId);
        
        // Write back to file
        fs.writeFileSync('bookings.json', JSON.stringify(filteredBookings, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple hardcoded login - replace with proper authentication
    if (username === 'admin' && password === 'kitchenrescue2024') {
        res.json({ token: 'dummy_token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// QuickBooks integration endpoints
app.post('/api/quickbooks/sync-booking', authenticateAdmin, async (req, res) => {
    try {
        const { bookingId } = req.body;
        
        // Read the booking
        let bookings = [];
        try {
            const bookingsData = fs.readFileSync('bookings.json', 'utf8');
            bookings = JSON.parse(bookingsData);
        } catch (error) {
            return res.status(404).json({ error: 'Bookings file not found' });
        }
        
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Create QuickBooks customer and invoice
        const quickbooksData = await createQuickBooksInvoice(booking);
        
        res.json({ 
            success: true, 
            quickbooksId: quickbooksData.invoiceId,
            message: 'Booking synced to QuickBooks successfully' 
        });
    } catch (error) {
        console.error('QuickBooks sync error:', error);
        res.status(500).json({ 
            error: 'Failed to sync to QuickBooks',
            details: error.message 
        });
    }
});

// QuickBooks configuration (only if credentials are available)
let qbo = null;
if (process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_ACCESS_TOKEN) {
    qbo = new QuickBooks(
        process.env.QUICKBOOKS_CLIENT_ID,
        process.env.QUICKBOOKS_CLIENT_SECRET,
        process.env.QUICKBOOKS_ACCESS_TOKEN,
        false, // no token secret for OAuth 2.0
        process.env.QUICKBOOKS_REALM_ID,
        true, // use sandbox
        true, // enable debug
        null, // minor version
        '2.0', // oauth version
        process.env.QUICKBOOKS_REFRESH_TOKEN
    );
    console.log('QuickBooks client initialized');
} else {
    console.log('QuickBooks not configured - using simulation mode');
}

// Helper function to create QuickBooks invoice
async function createQuickBooksInvoice(booking) {
    console.log('Creating QuickBooks invoice for booking:', booking.id);
    
    try {
        // Check if QuickBooks is configured
        if (!qbo || !process.env.QUICKBOOKS_CLIENT_ID || !process.env.QUICKBOOKS_ACCESS_TOKEN) {
            console.log('QuickBooks not configured, using simulation');
            return {
                invoiceId: `QB-SIM-${Date.now()}`,
                customerId: `QB-CUST-${booking.id}`,
                status: 'simulated'
            };
        }
        
        // Create or find customer in QuickBooks
        let customer = await findOrCreateCustomer(booking);
        
        // Create invoice
        const invoice = {
            CustomerRef: { value: customer.Id },
            Line: [
                {
                    DetailType: "SalesItemLineDetail",
                    Amount: booking.payment.amount,
                    SalesItemLineDetail: {
                        ItemRef: { value: "1", name: "Kitchen Pod Rental" },
                        UnitPrice: booking.payment.amount,
                        Qty: 1
                    }
                }
            ],
            DocNumber: booking.id,
            PrivateNote: `Kitchen Pod Rental - ${booking.customer.name}`
        };
        
        const createdInvoice = await qbo.createInvoice(invoice);
        
        return {
            invoiceId: createdInvoice.Id,
            customerId: customer.Id,
            status: 'created',
            docNumber: createdInvoice.DocNumber
        };
        
    } catch (error) {
        console.error('QuickBooks API error:', error);
        // Fallback to simulation
        return {
            invoiceId: `QB-ERROR-${Date.now()}`,
            customerId: `QB-CUST-${booking.id}`,
            status: 'error',
            error: error.message
        };
    }
}

// Helper function to find or create customer in QuickBooks
async function findOrCreateCustomer(booking) {
    try {
        // Check if QuickBooks is configured
        if (!qbo) {
            console.log('QuickBooks not configured - simulating customer creation');
            return {
                Id: `QB-CUST-SIM-${Date.now()}`,
                Name: booking.customer.name,
                PrimaryEmailAddr: booking.customer.email
            };
        }
        
        // Try to find existing customer by email
        const existingCustomers = await qbo.findCustomers({
            PrimaryEmailAddr: booking.customer.email
        });
        
        if (existingCustomers.QueryResponse.Customer && existingCustomers.QueryResponse.Customer.length > 0) {
            return existingCustomers.QueryResponse.Customer[0];
        }
        
        // Create new customer
        const customer = {
            Name: booking.customer.name,
            PrimaryEmailAddr: booking.customer.email,
            PrimaryPhone: { FreeFormNumber: booking.customer.phone },
            BillAddr: {
                Line1: booking.customer.address
            }
        };
        
        const createdCustomer = await qbo.createCustomer(customer);
        return createdCustomer;
        
    } catch (error) {
        console.error('Error finding/creating customer:', error);
        throw error;
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the site`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

module.exports = app;
