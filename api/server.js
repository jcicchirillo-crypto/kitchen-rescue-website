const express = require('express');
// Load .env file if available
try {
    require('dotenv').config();
    console.log('Environment variables loaded from .env file');
} catch (error) {
    console.log('dotenv not available, using system environment variables - force redeploy');
}

// Initialize OpenAI SDK
const OpenAI = require('openai');
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('OpenAI SDK initialized successfully');
} else {
    console.log('OpenAI API key not configured. Content idea generation will not work.');
}

// Check Supabase admin client initialization
const { supabaseAdmin } = require('./lib/supabaseAdmin');
console.log('🔍 Server startup - Supabase admin client available:', !!supabaseAdmin);

const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { getAllBookings, saveAllBookings, addBooking, updateBooking, deleteBooking } = require('./bookings-storage');
const { getAllTasks, getAllProjects, addTask, updateTask, deleteTask, saveAllTasks, saveAllProjects } = require('./tasks-storage');
// PDF generation removed - builders can add their own uplift to quotes

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

console.log('=== SERVER STARTED - NEW CODE VERSION ===');
console.log('Checking email configuration...');
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

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
        },
        connectionTimeout: 5000, // 5 second timeout
        greetingTimeout: 5000,
        socketTimeout: 5000
    });
    
    console.log('Email transporter configured - will attempt to send emails');
} else {
    console.log('Email credentials not configured. Quote emails will not be sent.');
    console.log('To enable email quotes, set EMAIL_USER and EMAIL_PASS in your .env file');
}

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Simple test endpoint to check Supabase connection (no auth required for testing)
app.get('/api/test-supabase', async (req, res) => {
    const { supabaseAdmin } = require('./lib/supabaseAdmin');
    const result = {
        timestamp: new Date().toISOString(),
        supabaseUrl: process.env.SUPABASE_URL || 'MISSING',
        supabaseUrlSet: !!process.env.SUPABASE_URL,
        supabaseKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0,
        supabaseConnected: !!supabaseAdmin,
        test: null,
        error: null,
        errorDetails: null
    };
    
    if (!supabaseAdmin) {
        result.error = 'Supabase admin client not initialized';
        result.errorDetails = 'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables';
        return res.json(result);
    }
    
    try {
        console.log('🔍 Test endpoint: Attempting Supabase query...');
        console.log('   URL:', process.env.SUPABASE_URL);
        console.log('   Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0);
        
        // Get total count with better error handling
        const { count, error: countError } = await supabaseAdmin
            .from('bookings')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            result.error = countError.message;
            result.errorCode = countError.code;
            result.errorDetails = countError.details || countError.hint || 'No additional details';
            result.errorFull = JSON.stringify(countError, null, 2);
            console.error('❌ Supabase query error:', countError);
            return res.json(result);
        }
        
        result.test = 'Connection successful';
        result.totalBookings = count || 0;
        console.log('✅ Supabase query successful, count:', count);
        
        // Get sample data
        const { data, error: dataError } = await supabaseAdmin
            .from('bookings')
            .select('*')
            .limit(5)
            .order('created_at', { ascending: false });
        
        if (dataError) {
            result.error = 'Error fetching sample data: ' + dataError.message;
            result.errorCode = dataError.code;
            return res.json(result);
        }
        
        if (data) {
            result.sampleBookings = data.length;
            result.sample = data.map(b => ({
                id: b.id,
                booking_reference: b.booking_reference,
                customer_name: b.customer_name,
                customer_email: b.customer_email,
                status: b.status,
                source: b.source,
                created_at: b.created_at
            }));
            
            // Count trade pack requests
            const tradePack = data.filter(b => 
                b.status === 'Trade Pack Request' || 
                b.source === 'trade-landing' || 
                b.source === 'trade-quote' ||
                b.source === 'trade-quote-calculated'
            );
            result.tradePackInSample = tradePack.length;
        }
        
    } catch (e) {
        result.error = e.message;
        result.errorType = e.constructor.name;
        result.errorStack = e.stack;
        result.errorDetails = 'This is a network/connection error. Possible causes: wrong URL, network issue, or Supabase project paused.';
        console.error('❌ Exception in test endpoint:', e);
    }
    
    res.json(result);
});

// Serve all HTML files
app.get('/*.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', req.path));
});

// Serve admin assets (CSS, JS) - Vite builds use /assets/, not /static/
app.use('/assets', express.static(path.join(__dirname, '..', 'admin/build/assets')));

// Admin routes - serve React app for all admin routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin/build/index.html'));
});

app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin/build/index.html'));
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
    
    // Block out availability after successful deposit
    await blockAvailabilityDates(bookingData);
}

// Block out availability dates after deposit payment
// Only blocks dates for confirmed bookings, not quotes
async function blockAvailabilityDates(bookingData, bookingStatus = 'confirmed') {
    try {
        // Only block dates for confirmed bookings, not quotes or pending bookings
        const confirmedStatuses = ['confirmed', 'Confirmed', 'Deposit Paid', 'deposit paid'];
        if (!confirmedStatuses.includes(bookingStatus)) {
            console.log(`Not blocking dates - booking status is "${bookingStatus}" (only confirmed bookings block dates)`);
            return;
        }
        
        const availabilityPath = path.join(__dirname, '..', 'public', 'assets', 'availability.json');
        
        // Read existing availability
        let availability = { unavailable: [] };
        try {
            const data = fs.readFileSync(availabilityPath, 'utf8');
            availability = JSON.parse(data);
        } catch (error) {
            console.log('No existing availability file, creating new one');
        }
        
        // Calculate start and end dates for blocking
        const deliveryDate = new Date(bookingData.deliveryDate);
        const endDate = new Date(deliveryDate);
        endDate.setDate(deliveryDate.getDate() + parseInt(bookingData.hireLength) - 1);
        
        const startDateStr = deliveryDate.toISOString().slice(0, 10);
        const endDateStr = endDate.toISOString().slice(0, 10);
        
        // Check if this date range already exists
        const exists = availability.unavailable.some(range => 
            range.start === startDateStr && range.end === endDateStr
        );
        
        if (!exists) {
            // Add new unavailable range
            availability.unavailable.push({
                start: startDateStr,
                end: endDateStr
            });
            
            // Write back to file
            fs.writeFileSync(availabilityPath, JSON.stringify(availability, null, 2));
            console.log(`Availability blocked: ${startDateStr} to ${endDateStr} (status: ${bookingStatus})`);
        } else {
            console.log(`Date range already blocked: ${startDateStr} to ${endDateStr}`);
        }
    } catch (error) {
        console.error('Error blocking availability dates:', error);
        // Don't throw error to prevent payment flow from failing
    }
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
        console.log('Transporter exists:', !!transporter);
        console.log('EMAIL_USER set:', !!process.env.EMAIL_USER);
        console.log('EMAIL_PASS set:', !!process.env.EMAIL_PASS);
        
        // Check if email is configured
        if (!transporter) {
            console.log('Email not configured - storing quote request for manual follow-up');
            
            // Store the quote request (you could save to a database or file)
            const quoteRequest = {
                timestamp: new Date().toISOString(),
                name, email, phone, notes, postcode, selectedDates, startDate, endDate, days, dailyCost, deliveryCost, collectionCost, totalCost
            };
            
            console.log('Quote request details:', quoteRequest);
            
            // Save the quote as a booking even if email isn't configured
            const newBooking = {
                id: `KR-${Date.now()}`,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(), // Matches Supabase schema (createdAt, not created_at)
                name,
                email,
                phone: phone || '',
                postcode,
                selectedDates: selectedDates || [],
                startDate,
                endDate,
                days,
                dailyCost: Number(dailyCost) || 0,
                deliveryCost: Number(deliveryCost) || 0,
                collectionCost: Number(collectionCost) || 0,
                totalCost: Number(totalCost) || 0,
                notes: notes || '',
                status: 'Awaiting deposit',
                source: 'quote',
                pod: '16ft Pod'
            };
            
            console.log('💾 Attempting to save quote as booking (no email config):', newBooking.id);
            
            // Save new booking to database
            const saved = await addBooking(newBooking);
            if (saved) {
                console.log('✅ Quote saved as booking successfully:', newBooking.id);
            } else {
                console.error('❌ FAILED to save quote to database:', newBooking.id);
                console.error('This quote request was NOT saved to admin system!');
            }
            
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
        
        try {
            await transporter.sendMail(customerMailOptions);
            console.log('Customer email sent successfully to:', email);
        } catch (emailError) {
            console.error('Error sending customer email:', emailError.message);
        }
        
        // Send notification email to business
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        const businessMailOptions = {
            from: `"Kitchen Rescue" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `📧 New Quote Request - ${name} (${postcode})`,
            html: generateBusinessNotificationHTML({
                name, email, phone, notes, postcode, selectedDates, startDate, endDate, days, dailyCost, deliveryCost, collectionCost, totalCost
            })
        };
        
        try {
            await transporter.sendMail(businessMailOptions);
            console.log('Business notification email sent successfully to:', adminEmail);
        } catch (emailError) {
            console.error('Error sending business email:', emailError.message);
        }
        
        // Save the quote as a booking in the admin system
        const newBooking = {
            id: `KR-${Date.now()}`,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(), // Matches Supabase schema (createdAt, not created_at)
            name,
            email,
            phone: phone || '',
            postcode,
            selectedDates: selectedDates || [],
            startDate,
            endDate,
            days,
            dailyCost: Number(dailyCost) || 0,
            deliveryCost: Number(deliveryCost) || 0,
            collectionCost: Number(collectionCost) || 0,
            totalCost: Number(totalCost) || 0,
            notes: notes || '',
            status: 'Awaiting deposit',
            source: 'quote',
            pod: '16ft Pod'
        };
        
        console.log('💾💾💾 Attempting to save quote as booking:', newBooking.id);
        console.log('📋 Booking details:', {
            name: newBooking.name,
            email: newBooking.email,
            postcode: newBooking.postcode,
            totalCost: newBooking.totalCost,
            source: newBooking.source,
            status: newBooking.status
        });
        console.log('📋 Full booking object keys:', Object.keys(newBooking));
        console.log('📋 Full booking object:', JSON.stringify(newBooking, null, 2));
        
        // Save new booking to database
        console.log('🔍 About to call addBooking...');
        const saved = await addBooking(newBooking);
        console.log('🔍 addBooking returned:', saved);
        if (saved) {
            console.log('✅✅✅ Quote saved as booking successfully:', newBooking.id);
        } else {
            console.error('========================================');
            console.error('❌❌❌ CRITICAL: FAILED to save quote to database');
            console.error('❌❌❌ Booking ID:', newBooking.id);
            console.error('❌❌❌ This quote request was NOT saved to admin system!');
            console.error('❌❌❌ Look for "SUPABASE INSERT ERROR" above for details');
            console.error('❌❌❌ Common issues: RLS policies, missing columns, or wrong data types');
            console.error('========================================');
            // Still send email even if save fails
        }
        
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
    const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === 'production' 
            ? 'https://www.thekitchenrescue.co.uk' 
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
    const money = (n) => `£${Number(n).toFixed(2)}`;
    const totalWithVAT = (data.totalCost * 1.2).toFixed(2);
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Quote Request</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .section h3 { margin-top: 0; color: #dc2626; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: 600; color: #374151; }
            .detail-value { color: #6b7280; }
            .total-box { background: #fef2f2; padding: 15px; border-radius: 8px; margin-top: 15px; border: 2px solid #dc2626; }
            .total-box .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
            .action-box { background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6; }
            .dates-list { font-size: 0.9em; color: #6b7280; margin-top: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 style="margin: 0;">📧 New Quote Request</h1>
            <p style="margin: 10px 0 0 0;">Customer has requested a quote via the website</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h3>👤 Customer Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${data.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value"><a href="mailto:${data.email}">${data.email}</a></span>
                </div>
                ${data.phone ? `
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value"><a href="tel:${data.phone}">${data.phone}</a></span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Postcode:</span>
                    <span class="detail-value">${data.postcode}</span>
                </div>
                ${data.notes ? `
                <div class="detail-row">
                    <span class="detail-label">Notes:</span>
                    <span class="detail-value">${data.notes}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="section">
                <h3>📅 Booking Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Start Date:</span>
                    <span class="detail-value">${data.startDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">End Date:</span>
                    <span class="detail-value">${data.endDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${data.days} day${data.days > 1 ? 's' : ''}</span>
                </div>
                <div class="dates-list">
                    <strong>Selected Dates:</strong><br/>
                    ${data.selectedDates.slice(0, 10).join(', ')}${data.selectedDates.length > 10 ? ` ... and ${data.selectedDates.length - 10} more` : ''}
                </div>
            </div>
            
            <div class="section">
                <h3>💰 Pricing Breakdown</h3>
                <div class="detail-row">
                    <span class="detail-label">Daily Hire (${data.days} days × £70):</span>
                    <span class="detail-value">${money(data.dailyCost)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Delivery:</span>
                    <span class="detail-value">${money(data.deliveryCost)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Collection:</span>
                    <span class="detail-value">${money(data.collectionCost)}</span>
                </div>
                <div class="total-box">
                    <div class="detail-row" style="border-bottom: none;">
                        <span class="detail-label" style="font-size: 18px;">Subtotal:</span>
                        <span class="detail-value" style="font-size: 18px; font-weight: 600;">${money(data.totalCost)}</span>
                    </div>
                    <div class="detail-row" style="border-bottom: none; margin-top: 8px;">
                        <span class="detail-label" style="font-size: 18px;">VAT (20%):</span>
                        <span class="detail-value" style="font-size: 18px;">${money(data.totalCost * 0.2)}</span>
                    </div>
                    <div class="detail-row" style="border-bottom: none; margin-top: 12px; padding-top: 12px; border-top: 2px solid #dc2626;">
                        <span class="detail-label" style="font-size: 20px;">Total (inc. VAT):</span>
                        <span class="amount">${money(totalWithVAT)}</span>
                    </div>
                </div>
            </div>
            
            <div class="action-box">
                <p style="margin: 0;"><strong>✅ Action Required:</strong> This quote has been saved to your admin system. Follow up with the customer within 24 hours.</p>
                <p style="margin: 10px 0 0 0; font-size: 0.9em;">You can view and manage this quote in your admin dashboard.</p>
            </div>
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
app.get('/api/bookings', authenticateAdmin, async (req, res) => {
    try {
        // Check if diagnostic info is requested
        const includeDiagnostics = req.query.diagnose === 'true';
        
        console.log('📥 Admin requesting bookings...');
        console.log('🔍 Supabase URL set:', !!process.env.SUPABASE_URL);
        console.log('🔍 Supabase key set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        const { supabaseAdmin } = require('./lib/supabaseAdmin');
        const diagnostics = {
            supabase: {
                connected: !!supabaseAdmin,
                url: process.env.SUPABASE_URL ? 'Set' : 'MISSING',
                serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'MISSING',
            }
        };
        
        const bookings = await getAllBookings();
        console.log(`✅ getAllBookings() returned ${bookings.length} bookings`);
        
        if (bookings.length === 0) {
            console.warn('⚠️ WARNING: No bookings returned from getAllBookings()');
            console.warn('   This could mean:');
            console.warn('   1. Supabase connection failed');
            console.warn('   2. Wrong Supabase project (check environment variables)');
            console.warn('   3. Database is empty');
            console.warn('   4. All bookings were filtered out');
        }
        
        // Debug: Count trade pack requests
        const tradePackRequests = bookings.filter(b => 
            b.status === 'Trade Pack Request' || 
            b.source === 'trade-landing' || 
            b.source === 'trade-quote' ||
            b.source === 'trade-quote-calculated'
        );
        console.log(`📦 Found ${tradePackRequests.length} trade pack/quote requests in response`);
        
        // Debug: Check for December bookings
        const decemberBookings = bookings.filter(b => {
            if (!b.createdAt && !b.timestamp) return false;
            const date = new Date(b.createdAt || b.timestamp);
            return date.getMonth() === 11 && date.getFullYear() === 2024; // December 2024
        });
        console.log(`📅 Found ${decemberBookings.length} bookings from December 2024`);
        
        // Log sample if we have bookings
        if (bookings.length > 0) {
            console.log('📋 Sample booking:', {
                id: bookings[0].id,
                name: bookings[0].name,
                email: bookings[0].email,
                status: bookings[0].status,
                source: bookings[0].source
            });
        }
        
        // If diagnostic requested, include diagnostic info
        if (includeDiagnostics) {
            // Try to get raw data from Supabase
            if (supabaseAdmin) {
                try {
                    const { data: rawData, error: rawError } = await supabaseAdmin
                        .from('bookings')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (!rawError) {
                        diagnostics.rawData = {
                            totalCount: rawData?.length || 0,
                            tradePackCount: (rawData || []).filter(b => 
                                b.status === 'Trade Pack Request' || 
                                b.source === 'trade-landing' || 
                                b.source === 'trade-quote' ||
                                b.source === 'trade-quote-calculated'
                            ).length,
                            december2024Count: (rawData || []).filter(b => {
                                if (!b.created_at) return false;
                                const date = new Date(b.created_at);
                                return date.getMonth() === 11 && date.getFullYear() === 2024;
                            }).length
                        };
                    } else {
                        diagnostics.rawError = rawError.message;
                    }
                } catch (e) {
                    diagnostics.rawError = e.message;
                }
            }
            
            diagnostics.mappedData = {
                totalCount: bookings.length,
                tradePackCount: tradePackRequests.length,
                december2024Count: decemberBookings.length
            };
            
            return res.json({
                bookings: bookings,
                diagnostics: diagnostics
            });
        }
        
        res.json(bookings);
    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch bookings',
            message: error.message,
            bookings: [] 
        });
    }
});

// Diagnostic endpoint to check Supabase connection and database contents
app.get('/api/diagnose', authenticateAdmin, async (req, res) => {
    try {
        const { supabaseAdmin } = require('./lib/supabaseAdmin');
        const diagnostics = {
            timestamp: new Date().toISOString(),
            supabase: {
                connected: !!supabaseAdmin,
                url: process.env.SUPABASE_URL ? 'Set' : 'MISSING',
                serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'MISSING',
            },
            rawData: null,
            mappedData: null,
            statistics: {}
        };

        if (!supabaseAdmin) {
            diagnostics.error = 'Supabase admin client not available - check environment variables';
            return res.json(diagnostics);
        }

        // Try to fetch raw data from Supabase
        try {
            console.log('🔍 Diagnostic: Fetching raw data from Supabase...');
            const { data: rawData, error: rawError } = await supabaseAdmin
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });

            if (rawError) {
                diagnostics.error = `Supabase query error: ${rawError.message}`;
                diagnostics.rawError = rawError;
            } else {
                diagnostics.rawData = {
                    totalCount: rawData?.length || 0,
                    sample: rawData?.slice(0, 5).map(b => ({
                        id: b.id,
                        booking_reference: b.booking_reference,
                        customer_name: b.customer_name,
                        customer_email: b.customer_email,
                        status: b.status,
                        source: b.source,
                        created_at: b.created_at
                    })) || []
                };

                // Count by status
                const statusCounts = {};
                (rawData || []).forEach(b => {
                    const status = b.status || 'Unknown';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });

                // Count by source
                const sourceCounts = {};
                (rawData || []).forEach(b => {
                    const source = b.source || 'Unknown';
                    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
                });

                // Count trade pack requests
                const tradePackRaw = (rawData || []).filter(b => 
                    b.status === 'Trade Pack Request' || 
                    b.source === 'trade-landing' || 
                    b.source === 'trade-quote' ||
                    b.source === 'trade-quote-calculated'
                );

                // Count December 2024 bookings
                const decemberRaw = (rawData || []).filter(b => {
                    if (!b.created_at) return false;
                    const date = new Date(b.created_at);
                    return date.getMonth() === 11 && date.getFullYear() === 2024;
                });

                // Count by month
                const monthCounts = {};
                (rawData || []).forEach(b => {
                    if (b.created_at) {
                        const date = new Date(b.created_at);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
                    }
                });

                diagnostics.statistics = {
                    totalBookings: rawData?.length || 0,
                    byStatus: statusCounts,
                    bySource: sourceCounts,
                    tradePackRequests: {
                        total: tradePackRaw.length,
                        samples: tradePackRaw.slice(0, 10).map(b => ({
                            id: b.id,
                            booking_reference: b.booking_reference,
                            customer_name: b.customer_name,
                            customer_email: b.customer_email,
                            status: b.status,
                            source: b.source,
                            created_at: b.created_at
                        }))
                    },
                    december2024: {
                        total: decemberRaw.length,
                        samples: decemberRaw.slice(0, 10).map(b => ({
                            id: b.id,
                            booking_reference: b.booking_reference,
                            customer_name: b.customer_name,
                            customer_email: b.customer_email,
                            status: b.status,
                            source: b.source,
                            created_at: b.created_at
                        }))
                    },
                    byMonth: monthCounts
                };
            }
        } catch (fetchError) {
            diagnostics.error = `Error fetching from Supabase: ${fetchError.message}`;
            diagnostics.fetchErrorStack = fetchError.stack;
        }

        // Now test the mapped data
        try {
            console.log('🔍 Diagnostic: Testing mapped data...');
            const { getAllBookings } = require('./bookings-storage');
            const mappedBookings = await getAllBookings();
            
            diagnostics.mappedData = {
                totalCount: mappedBookings.length,
                tradePackRequests: mappedBookings.filter(b => 
                    b.status === 'Trade Pack Request' || 
                    b.source === 'trade-landing' || 
                    b.source === 'trade-quote' ||
                    b.source === 'trade-quote-calculated'
                ).length,
                december2024: mappedBookings.filter(b => {
                    if (!b.createdAt && !b.timestamp) return false;
                    const date = new Date(b.createdAt || b.timestamp);
                    return date.getMonth() === 11 && date.getFullYear() === 2024;
                }).length,
                sample: mappedBookings.slice(0, 5).map(b => ({
                    id: b.id,
                    name: b.name,
                    email: b.email,
                    status: b.status,
                    source: b.source,
                    createdAt: b.createdAt || b.timestamp
                }))
            };
        } catch (mapError) {
            diagnostics.mapError = `Error mapping data: ${mapError.message}`;
            diagnostics.mapErrorStack = mapError.stack;
        }

        res.json(diagnostics);
    } catch (error) {
        console.error('❌ Diagnostic error:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
});

// Create new booking
app.post('/api/bookings', authenticateAdmin, async (req, res) => {
    try {
        const newBooking = {
            id: `KR-${Date.now()}`,
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        // Read existing bookings
        const bookings = await getAllBookings();
        
        // Add new booking
        bookings.push(newBooking);
        
        // Write back to file
        await saveAllBookings(bookings);
        
        res.json(newBooking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Update booking
app.put('/api/bookings/:id', authenticateAdmin, async (req, res) => {
    try {
        const bookingId = req.params.id;
        
        // Read existing bookings
        const bookings = await getAllBookings();
        
        // Find and update booking
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const oldBooking = bookings[bookingIndex];
        const newStatus = req.body.status;
        const oldStatus = oldBooking.status;
        
        bookings[bookingIndex] = { ...bookings[bookingIndex], ...req.body };
        
        // Write back to file
        await saveAllBookings(bookings);
        
        // If status changed to confirmed, block dates (only block confirmed bookings, not quotes)
        if (newStatus && newStatus !== oldStatus) {
            const confirmedStatuses = ['confirmed', 'Confirmed', 'Deposit Paid', 'deposit paid'];
            if (confirmedStatuses.includes(newStatus) && oldBooking.startDate && oldBooking.days) {
                // Block dates only when status changes to confirmed
                const bookingData = {
                    deliveryDate: oldBooking.startDate,
                    hireLength: oldBooking.days
                };
                await blockAvailabilityDates(bookingData, newStatus);
            }
        }
        
        res.json(bookings[bookingIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// Delete booking
app.delete('/api/bookings/:id', authenticateAdmin, async (req, res) => {
    try {
        const bookingId = req.params.id;
        
        // Read existing bookings
        const bookings = await getAllBookings();
        
        // Filter out the booking
        const filteredBookings = bookings.filter(b => b.id !== bookingId);
        
        // Write back to file
        await saveAllBookings(filteredBookings);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});

// Tasks API endpoints
// Get all tasks
app.get('/api/tasks', authenticateAdmin, async (req, res) => {
    try {
        console.log('📥 Admin requesting tasks...');
        const tasks = await getAllTasks();
        console.log(`✅ Returning ${tasks.length} tasks to admin`);
        res.json(tasks);
    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        res.json([]);
    }
});

// Get all projects
app.get('/api/projects', authenticateAdmin, async (req, res) => {
    try {
        const projects = await getAllProjects();
        res.json(projects);
    } catch (error) {
        console.error('❌ Error fetching projects:', error);
        res.json([]);
    }
});

// Create new task
app.post('/api/tasks', authenticateAdmin, async (req, res) => {
    try {
        const newTask = {
            id: req.body.id || `task-${Date.now()}`,
            title: req.body.title,
            description: req.body.description || '',
            priority: req.body.priority || 'medium',
            project: req.body.project || '',
            completed: req.body.completed || false,
            date: req.body.date || null,
        };
        
        console.log('📥 Creating new task:', newTask.id);
        const saved = await addTask(newTask);
        if (saved) {
            console.log('✅ Task created successfully');
            res.json(newTask);
        } else {
            console.error('❌ Failed to create task in Supabase');
            res.status(500).json({ 
                error: 'Failed to create task',
                message: 'Task may not have been saved. Check if Supabase tables exist.'
            });
        }
    } catch (error) {
        console.error('❌ Exception creating task:', error);
        res.status(500).json({ error: 'Failed to create task', message: error.message });
    }
});

// Update task
app.put('/api/tasks/:id', authenticateAdmin, async (req, res) => {
    try {
        const taskId = req.params.id;
        const updates = req.body;
        
        console.log(`📥 Updating task ${taskId}`);
        const updated = await updateTask(taskId, updates);
        if (updated) {
            console.log('✅ Task updated successfully');
            res.json({ success: true });
        } else {
            console.error(`❌ Failed to update task ${taskId}`);
            res.status(500).json({ 
                error: 'Failed to update task',
                message: 'Task may not exist or Supabase tables may not be set up.'
            });
        }
    } catch (error) {
        console.error('❌ Exception updating task:', error);
        res.status(500).json({ error: 'Failed to update task', message: error.message });
    }
});

// Delete task
app.delete('/api/tasks/:id', authenticateAdmin, async (req, res) => {
    try {
        const taskId = req.params.id;
        console.log(`📥 Deleting task ${taskId}`);
        const deleted = await deleteTask(taskId);
        if (deleted) {
            console.log('✅ Task deleted successfully');
            res.json({ success: true });
        } else {
            console.error(`❌ Failed to delete task ${taskId}`);
            res.status(500).json({ 
                error: 'Failed to delete task',
                message: 'Task may not exist or Supabase tables may not be set up.'
            });
        }
    } catch (error) {
        console.error('❌ Exception deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task', message: error.message });
    }
});

// Save all tasks (for bulk updates)
app.post('/api/tasks/bulk', authenticateAdmin, async (req, res) => {
    try {
        const tasks = req.body.tasks || [];
        // For Supabase, we'll update each task individually
        for (const task of tasks) {
            if (task.id) {
                await updateTask(task.id, task);
            } else {
                await addTask(task);
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save tasks' });
    }
});

// Save all projects
app.post('/api/projects', authenticateAdmin, async (req, res) => {
    try {
        const projects = req.body.projects || [];
        const saved = await saveAllProjects(projects);
        if (saved) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to save projects' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to save projects' });
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
        const bookings = await getAllBookings();
        
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

// Trade Quote Calculation Endpoint
app.post('/api/quote/calculate', async (req, res) => {
    try {
        const { postcode, weeks, includeReferral = false, startDate } = req.body;
        
        if (!postcode || !weeks || weeks < 1) {
            return res.status(400).json({ error: 'Postcode and weeks (minimum 1) are required' });
        }
        
        // Calculate distance from postcode (using same logic as availability.html)
        const postcodeArea = postcode.trim().toUpperCase().substring(0, 2);
        const distanceMap = {
            // Hertfordshire & nearby (0-50 miles)
            'EN': 5, 'AL': 15, 'HP': 20, 'LU': 25, 'MK': 30, 'SG': 35, 'CB': 40, 'CM': 45, 'CO': 50,
            // London areas (10-30 miles)
            'E': 15, 'EC': 20, 'N': 10, 'NW': 12, 'SE': 18, 'SW': 20, 'W': 15, 'WC': 18,
            'IG': 20, 'RM': 25, 'DA': 25, 'BR': 30, 'CR': 35, 'KT': 40, 'SM': 35, 'TW': 45,
            'UB': 50, 'HA': 40, 'WD': 45,
            // South East (50-100 miles)
            'SL': 55, 'RG': 60, 'GU': 65, 'PO': 70, 'SO': 75, 'BH': 80, 'DT': 85, 'SP': 90, 'OX': 95,
            // Midlands (100-150 miles)
            'BA': 105, 'SN': 110, 'WR': 115, 'CV': 120, 'B': 125, 'DY': 130, 'WS': 135, 'WV': 140,
            'ST': 145, 'TF': 150,
            // North England (150-200 miles)
            'SY': 155, 'HR': 160, 'LD': 165, 'NP': 170, 'CF': 175, 'SA': 180, 'LL': 185, 'CH': 190,
            'L': 195, 'M': 200, 'SK': 205, 'OL': 210, 'BL': 215, 'PR': 220, 'FY': 225,
            // North England & Scotland (200-300+ miles)
            'BB': 230, 'BD': 235, 'HD': 240, 'HX': 245, 'LS': 250, 'S': 255, 'WF': 260,
            'DN': 265, 'HU': 270, 'YO': 275, 'NE': 280, 'DH': 285, 'SR': 290, 'TS': 295,
            'DL': 300, 'HG': 305, 'LA': 310, 'CA': 315, 'TD': 320, 'EH': 325, 'FK': 330,
            'G': 335, 'KA': 340, 'KY': 345, 'ML': 350, 'PA': 355, 'PH': 360, 'AB': 365,
            'DD': 370, 'IV': 375, 'KW': 380, 'ZE': 385
        };
        
        const estimatedMiles = distanceMap[postcodeArea] || 100;
        
        // Calculate delivery/collection cost based on distance
        const deliveryRates = [
            { maxMiles: 50, price: 75 },
            { maxMiles: 100, price: 100 },
            { maxMiles: 150, price: 125 },
            { maxMiles: 200, price: 150 },
            { maxMiles: 300, price: 225 }
        ];
        
        let individualDeliveryCost = deliveryRates[deliveryRates.length - 1].price;
        for (const rate of deliveryRates) {
            if (estimatedMiles <= rate.maxMiles) {
                individualDeliveryCost = rate.price;
                break;
            }
        }
        
        const deliveryPrice = individualDeliveryCost * 2; // Delivery + collection
        
        // Calculate base hire cost (£70/day or weekly rate)
        const days = weeks * 7;
        const basePrice = days * 70;
        
        // Calculate total
        const total = basePrice + deliveryPrice;
        
        const quoteResult = {
            basePrice,
            deliveryPrice,
            total,
            distanceMiles: estimatedMiles,
            weeks,
            days
        };
        
        // Save quote calculation to admin (even if they don't email it)
        try {
            const bookingId = `trade-quote-calc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const calculationBooking = {
                id: bookingId,
                name: `Quote Request - ${postcode}`,
                email: `quote-${postcode.replace(/\s+/g, '').toLowerCase()}@temp.local`,
                postcode: postcode || '',
                phone: '',
                source: 'trade-quote-calculated',
                status: 'Quote Calculated',
                totalCost: total,
                dailyCost: 70,
                deliveryCost: individualDeliveryCost,
                collectionCost: individualDeliveryCost,
                days: days,
                notes: `Quote calculated for ${weeks} week(s).${startDate ? ` Start date: ${startDate}.` : ''}`,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            await addBooking(calculationBooking);
            console.log('✅ Quote calculation saved to admin:', postcode, weeks, 'weeks');
        } catch (saveErr) {
            console.error('⚠️ Error saving quote calculation to admin:', saveErr);
            // Don't fail the request if saving fails
        }
        
        res.json(quoteResult);
        
    } catch (error) {
        console.error('Error calculating quote:', error);
        res.status(500).json({ error: 'Failed to calculate quote' });
    }
});

// Trade Quote Send Endpoint (BULLETPROOF)
app.post('/api/quote/send', async (req, res) => {
    try {
    const {
      builderName,
      builderEmail,
      postcode,
      weeks,
      startDate,
      includeReferral = false,
      quote,
    } = req.body || {};
        
        if (!builderEmail || !quote) {
            return res.status(400).json({ error: 'Builder email and quote are required' });
        }
        
    // --- Referral code: NEVER let it break the flow
        let referralCode = null;
    try {
        if (includeReferral) {
        // simple + safe
        referralCode = 'KR-' + Math.random().toString(36).slice(2, 10).toUpperCase();
      }
    } catch (refErr) {
      console.error('Referral code error:', refErr);
      referralCode = null;
    }

    // PDF generation removed - builders can add their own uplift to quotes

    // --- Save builder info to admin area
    try {
      console.log('💾 Saving trade quote to admin...');
      const bookingId = `trade-quote-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const tradeQuoteBooking = {
        id: bookingId,
        name: builderName || 'Trade Partner',
        email: builderEmail,
        postcode: postcode || '',
        phone: '',
        source: 'trade-quote',
        status: 'Trade Quote Request',
        totalCost: quote.total,
        dailyCost: quote.basePrice / (weeks * 7),
        deliveryCost: quote.deliveryPrice / 2,
        collectionCost: quote.deliveryPrice / 2,
        days: weeks * 7,
        notes: `Quote requested from trade quote builder. Duration: ${weeks} week(s).${startDate ? ` Start date: ${startDate}.` : ''}${referralCode ? ` Referral code: ${referralCode}` : ''}`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      await addBooking(tradeQuoteBooking);
      console.log('✅ Trade quote builder info saved to admin:', builderEmail);
    } catch (saveErr) {
      console.error('❌ Error saving trade quote builder info:', saveErr);
      // Don't fail the request if saving fails
    }

    // --- Email HTML (no clickable referral link to avoid NOT_FOUND)
        const quoteEmailHTML = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#dc2626;color:#fff;padding:18px;text-align:center;border-radius:8px;">
          <h1 style="margin:0;font-size:20px;">Kitchen Rescue – Trade Quote</h1>
                    </div>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-top:16px;">
                        <p>Hi ${builderName || 'Builder'},</p>
                        <p>Here's your quote for your client:</p>
                        
          <div style="background:#fff;padding:12px;border-radius:8px;margin:12px 0;">
            <p><strong>Postcode:</strong> ${postcode}</p>
            <p><strong>Duration:</strong> ${weeks} week(s)</p>
            ${startDate ? `<p><strong>Start date:</strong> ${startDate}</p>` : ''}
            <p><strong>Base hire:</strong> £${quote.basePrice.toFixed(2)}</p>
            <p><strong>Delivery & collection:</strong> £${quote.deliveryPrice.toFixed(2)}</p>
            <p><strong>Distance:</strong> ${quote.distanceMiles?.toFixed(1)} miles</p>
            <p><strong>Total:</strong> £${quote.total.toFixed(2)}</p>
            <p style="color:#666;font-size:13px;margin-top:8px;">You can add your own margin/admin cost when quoting to your client.</p>
                        </div>
                        

          ${
            referralCode
              ? `<p style="background:#ecfdf5;padding:10px;border-left:4px solid #10b981;border-radius:6px;">
                   <strong>Your referral code:</strong> ${referralCode}<br/>
                   You earn £50 per booking using this code.
                 </p>`
              : ''
          }

          <p>Quote valid for 30 days. Final booking handled directly by Kitchen Rescue.</p>
          <p>Best regards,<br/>Kitchen Rescue Team</p>
                    </div>
                    </div>
    `;

    // --- Send email
    if (!transporter) {
      console.log('Email transporter not configured — skipping send.');
      return res.json({ success: true, referralCode });
    }

            const mailOptions = {
                from: `"Kitchen Rescue" <${process.env.EMAIL_USER}>`,
                to: builderEmail,
      subject: `Kitchen Rescue Trade Quote – ${postcode}`,
      html: quoteEmailHTML,
            };
            
                await transporter.sendMail(mailOptions);
    console.log('Trade quote email sent to:', builderEmail);

    return res.json({ success: true, referralCode });
  } catch (err) {
    console.error('SEND ENDPOINT CRASH:', err);
    return res.status(500).json({ error: 'Failed to send quote' });
    }
});

// Trade Pack Request Endpoint (Facebook Ad Landing Page)
app.post('/api/trade-pack-request', async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log('\n📥 ===== TRADE PACK REQUEST RECEIVED =====');
    console.log('⏰ Time:', timestamp);
    
    try {
        const {
            name,
            company,
            email,
            phone,
            kitchen_fits,
            message
        } = req.body || {};

        console.log('📋 Request data:', { 
            name: name || 'MISSING', 
            company: company || 'MISSING', 
            email: email || 'MISSING',
            phone: phone || 'Not provided',
            kitchen_fits: kitchen_fits || 'Not specified'
        });

        if (!name || !company || !email) {
            console.error('❌ VALIDATION FAILED: Missing required fields');
            return res.status(400).json({ error: 'Name, company, and email are required' });
        }

        // Generate referral code
        let referralCode = null;
        try {
            referralCode = 'KR-' + Math.random().toString(36).slice(2, 10).toUpperCase();
        } catch (refErr) {
            console.error('Referral code error:', refErr);
            referralCode = null;
        }

        // Save to admin system
        try {
            console.log('💾 Saving trade pack request to admin...');
            const bookingId = `trade-landing-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const tradePackBooking = {
                id: bookingId,
                name: name,
                email: email,
                phone: phone || '',
                postcode: '',
                source: 'trade-landing',
                status: 'Trade Pack Request',
                totalCost: 0,
                dailyCost: 0,
                deliveryCost: 0,
                collectionCost: 0,
                days: 0,
                notes: `Company: ${company}. Kitchen fits per month: ${kitchen_fits || 'Not specified'}. ${message ? `Message: ${message}` : ''}${referralCode ? ` Referral code: ${referralCode}` : ''}`,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            await addBooking(tradePackBooking);
            console.log('✅ Trade pack request SAVED to admin');
            console.log('   📧 Email:', email);
            console.log('   🏢 Company:', company);
            console.log('   🆔 Booking ID:', bookingId);
            console.log('   🔑 Referral Code:', referralCode || 'N/A');
        } catch (saveErr) {
            console.error('❌ ERROR saving trade pack request to admin:', saveErr);
            console.error('   Stack:', saveErr.stack);
            // Don't fail the request if saving fails
        }

        // Generate trade pack email HTML
        const tradePackEmailHTML = generateTradePackEmailHTML({
            name,
            company,
            email,
            phone,
            kitchen_fits,
            referralCode
        });

        // Send email
        if (!transporter) {
            console.log('Email transporter not configured — skipping send.');
            return res.json({ 
            success: true,
                referralCode,
                message: 'Trade pack request received. We will contact you within 24 hours.',
                note: 'Email system not configured - manual follow-up required'
            });
        }

        const mailOptions = {
            from: `"Kitchen Rescue" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Your Kitchen Rescue Trade Pack & Referral Code`,
            html: tradePackEmailHTML
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('✅ Trade pack email SENT successfully');
            console.log('   📧 To:', email);
        } catch (emailError) {
            console.error('❌ ERROR sending trade pack email:', emailError);
            console.error('   📧 Failed to send to:', email);
            // Still return success if email fails
        }

        console.log('✅ ===== TRADE PACK REQUEST COMPLETED SUCCESSFULLY =====\n');
        return res.json({ success: true, referralCode });
    } catch (err) {
        console.error('\n❌ ===== TRADE PACK REQUEST ERROR =====');
        console.error('⏰ Time:', timestamp);
        console.error('❌ Error:', err);
        console.error('   Stack:', err.stack);
        console.error('❌ ============================================\n');
        return res.status(500).json({ error: 'Failed to process trade pack request' });
    }
});

// Generate Trade Pack Email HTML
function generateTradePackEmailHTML(data) {
    const { name, company, referralCode } = data;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Your Kitchen Rescue Trade Pack</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto;">
            <p style="margin: 20px 0 10px 0; color: #333; font-size: 16px;">Hi ${name},</p>
            
            <p style="margin: 10px 0; color: #333; font-size: 16px;">Thanks for your interest in Kitchen Rescue. Here's everything you need to start offering temporary kitchen pods to your customers during their renovation.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            
            <div style="margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: bold;">🔑 Your Trade Referral Code</h2>
                ${referralCode ? `
                <div style="font-size: 24px; font-weight: bold; color: #e30613; margin: 15px 0;">${referralCode}</div>
                <p style="margin: 10px 0; color: #333; font-size: 16px;">Use this code on any booking and you'll receive £50 per completed hire.</p>
                <p style="margin: 10px 0; color: #333; font-size: 16px;">You're welcome to add your own margin when including the pod as an optional extra in your quote.</p>
                ` : ''}
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            
            <div style="margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: bold;">📋 What's Included in Your Trade Pack</h2>
                <ul style="margin: 10px 0; padding-left: 20px; color: #333; font-size: 16px;">
                    <li style="margin-bottom: 8px;">A one-page info sheet you can attach to your quotes</li>
                    <li style="margin-bottom: 8px;">Simple wording you can copy straight into your proposals</li>
                    <li style="margin-bottom: 8px;">A referral code for earning commission</li>
                    <li style="margin-bottom: 8px;">A customer-friendly overview of how the pod works</li>
                    <li style="margin-bottom: 8px;">A link to check availability online</li>
                </ul>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #e0e0e0;">
                <h3 style="margin-top: 0; color: #333; font-size: 18px;">📄 Download Your One-Page PDF</h3>
                <p style="margin: 10px 0 15px 0; color: #333; font-size: 16px;">A one-page info sheet you can attach to your quotes and send to your customers.</p>
                <a href="https://www.thekitchenrescue.co.uk/assets/Build Pack.pdf" style="display: inline-block; text-decoration: none;">
                    <img src="https://www.thekitchenrescue.co.uk/assets/Build Pack Preview.png" alt="Build Pack Preview" style="max-width: 300px; width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 15px 0;" />
                </a>
                <p style="margin: 10px 0; color: #333;">
                    <a href="https://www.thekitchenrescue.co.uk/assets/Build Pack.pdf" style="display: inline-block; background: #e30613; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">Download Build Pack PDF</a>
                </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            
            <div style="margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: bold;">🧾 Suggested Quote Wording</h2>
                <p style="margin: 10px 0; color: #666; font-size: 14px; font-style: italic;">(Feel free to copy/paste this into your kitchen proposals)</p>
                <div style="margin: 15px 0; padding: 20px; background: #f5f5f5; border-left: 4px solid #e30613; color: #333; font-size: 16px; line-height: 1.8;">
                    <p style="margin: 0; font-weight: 500;">"Optional: Temporary fully equipped kitchen pod available from Kitchen Rescue for clients needing full cooking and washing facilities during their renovation."</p>
                </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            
            <div style="margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: bold;">🌐 Your Customers Can Book Online</h2>
                <p style="margin: 10px 0; color: #333; font-size: 16px;">They can check availability and book directly at:</p>
                <p style="margin: 10px 0; color: #333; font-size: 16px;"><a href="https://www.thekitchenrescue.co.uk" style="color: #e30613; text-decoration: none;">www.thekitchenrescue.co.uk</a></p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            
            <p style="margin: 20px 0; color: #333; font-size: 16px;">If you have any upcoming jobs where the client will be without a kitchen, just send them the link or give me a call.</p>
            
            <p style="margin: 20px 0; color: #333; font-size: 16px;">Thanks,<br/>Janine<br/>Kitchen Rescue</p>
            
            <div style="margin: 20px 0; color: #333; font-size: 16px;">
                <p style="margin: 5px 0;">📞 <a href="tel:07872460097" style="color: #333; text-decoration: none;">07872 460097</a></p>
                <p style="margin: 5px 0;">📧 <a href="mailto:hello@thekitchenrescue.co.uk" style="color: #333; text-decoration: none;">hello@thekitchenrescue.co.uk</a></p>
                <p style="margin: 5px 0;">🌐 <a href="https://www.thekitchenrescue.co.uk" style="color: #333; text-decoration: none;">www.thekitchenrescue.co.uk</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the site`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

// Content Creator Organizer - Generate social media content
// Track recent hooks to avoid repetition
let recentHooks = [];
const MAX_RECENT_HOOKS = 10;

app.post("/api/generate-content", authenticateAdmin, async (req, res) => {
    try {
        const { igUrl, videoDescription, format, niche, platform } = req.body;

        if (!videoDescription) {
            return res.status(400).json({ error: "videoDescription is required" });
        }

        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY) {
            console.error("OpenAI API key not configured");
            return res.status(500).json({ error: "OpenAI API key not configured" });
        }

        const systemPrompt = `
You are a social video "style translator" for a creator who runs:

- Kitchen Rescue: temporary fully equipped kitchen pods for people doing kitchen renovations.
- Golf content: mindset, tips and relatable midlife golf content.

Your job:
- Analyse the described video style (NOT the topic).
- Rebuild it in the requested niche and platform, keeping the same *feel* and *format*.

You MUST reply with **valid JSON only**, no extra commentary, with this shape:

{
  "hook": "string – the main hook line for the post",
  "caption": "string – full caption with line breaks and CTA",
  "hashtags": ["#tag1", "#tag2", "..."],
  "storyboardShots": [
    {
      "visual": "what to film for this shot, in simple terms",
      "textOnScreen": "exact text that appears on screen for this shot",
      "searchKeywords": "keywords to search for stock photos/videos for this shot"
    }
  ],
  "visualSearchKeywords": ["keyword1", "keyword2", "keyword3"]
}
`.trim();

        // Add timestamp and random seed for variation
        const timestamp = Date.now();
        const randomSeed = Math.floor(Math.random() * 10000);
        
        // Get recent hooks to avoid
        const avoidHooks = recentHooks.length > 0 
            ? recentHooks.slice(-5).join(" | ") 
            : "none";
        
        // Add explicit hook structure variations
        const hookStructures = [
            { type: "question", example: "How do you cook during a kitchen renovation?" },
            { type: "number", example: "7 ways to survive a kitchen renovation" },
            { type: "story", example: "Sarah thought she'd be eating takeaways for 8 weeks..." },
            { type: "bold statement", example: "You don't have to give up cooking during renovations" },
            { type: "contrast", example: "No kitchen? No problem. Here's how..." },
            { type: "benefit", example: "Cook normally while your kitchen is being renovated" }
        ];
        const selectedStructure = hookStructures[Math.floor(Math.random() * hookStructures.length)];
        
        // Add creative variation angles
        const variationAngles = [
            "Focus on the emotional benefit and transformation",
            "Emphasize the problem-solution angle",
            "Use a storytelling approach with a relatable scenario",
            "Highlight the convenience and time-saving aspect",
            "Focus on cost savings and value proposition",
            "Use a before-and-after comparison style",
            "Emphasize the stress-free experience",
            "Highlight the professional quality and reliability"
        ];
        const selectedAngle = variationAngles[Math.floor(Math.random() * variationAngles.length)];
        
        // Add tone variations
        const tones = ["conversational", "enthusiastic", "helpful", "reassuring", "inspiring", "practical"];
        const selectedTone = tones[Math.floor(Math.random() * tones.length)];
        
        const userPrompt = `
Original video style description:
- IG URL (if any): ${igUrl || "none"}
- Format: ${format || "not specified"}
- Platform: ${platform || "Instagram Reel"}
- Niche for new version: ${niche || "Kitchen Rescue"}
- Request ID: ${timestamp}-${randomSeed}
- Creative Angle: ${selectedAngle}
- Tone: ${selectedTone}
- Required Hook Structure: ${selectedStructure.type} (example: "${selectedStructure.example}")

Video description:
${videoDescription}

CRITICAL REQUIREMENTS:
1. This is request #${randomSeed}. Generate a COMPLETELY UNIQUE version.
2. You MUST use a "${selectedStructure.type}" hook structure. Example: "${selectedStructure.example}"
3. You MUST avoid these recent hooks: ${avoidHooks}
4. Your hook must be DIFFERENT from all of the above. Do NOT use similar phrasing, words, or structure.
5. Use a DIFFERENT angle, DIFFERENT hook structure, and DIFFERENT approach than any previous generation.

What to vary:
- Hook opening: MUST be ${selectedStructure.type} style (NOT like the avoided hooks above)
- Caption structure and flow: Use different paragraph breaks and CTA placement
- Hashtag selection: Choose different hashtags than previous requests
- Visual approach: Different shot descriptions and text overlays

Please:
1. Infer the format, pacing and psychological trick (e.g. long text for replays).
2. Create a NEW and UNIQUE version for the niche: ${niche} using the "${selectedAngle}" angle with a "${selectedTone}" tone.
3. Include:
   - A strong, unique hook in "${selectedStructure.type}" style that fits ${niche}. MUST be different from: ${avoidHooks}. Example style: "${selectedStructure.example}"
   - A fresh caption that fits ${platform} with a clear CTA (vary the structure and flow from previous requests).
   - 6–10 relevant hashtags as an array (select DIFFERENT hashtags than previous requests).
   - A storyboard of 3–6 shots with "visual" and "textOnScreen" for each.
   - 3–5 visual search keywords as an array in "visualSearchKeywords" (use DIFFERENT keywords than previous requests).

Remember: respond ONLY with JSON in the schema specified. Be creative and generate something COMPLETELY NEW and DIFFERENT. Your hook MUST be in "${selectedStructure.type}" style and MUST NOT resemble: ${avoidHooks}
`.trim();

        // Use Node 18+ global fetch to call OpenAI directly
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // or any model you prefer
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 1.0, // Maximum variation (0-2 scale, 1.0 = most creative)
                top_p: 0.95, // Nucleus sampling for more diversity
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("OpenAI API error:", errText);
            return res.status(500).json({ error: "OpenAI API error", details: errText });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (err) {
            console.error("Failed to parse JSON from OpenAI:", content);
            return res.status(500).json({
                error: "Failed to parse JSON from OpenAI",
                raw: content,
            });
        }

        // Normalise fields so frontend doesn't explode if something is missing
        const result = {
            hook: parsed.hook || "",
            caption: parsed.caption || "",
            hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
            storyboardShots: Array.isArray(parsed.storyboardShots)
                ? parsed.storyboardShots
                : [],
            visualSearchKeywords: Array.isArray(parsed.visualSearchKeywords) 
                ? parsed.visualSearchKeywords 
                : [],
        };

        // Add new hook to recent hooks list to avoid repetition
        if (result.hook) {
            recentHooks.push(result.hook);
            // Keep only the most recent hooks
            if (recentHooks.length > MAX_RECENT_HOOKS) {
                recentHooks.shift(); // Remove oldest
            }
        }

        res.json(result);
    } catch (err) {
        console.error("Error in /api/generate-content:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// Content Idea Generator - Uses provided hook or generates one
app.post("/api/content-idea", authenticateAdmin, async (req, res) => {
    try {
        const { hook, description } = req.body;

        // Debug logging
        console.log("BODY:", req.body);
        console.log("Hook received:", hook);
        console.log("Description received:", description);

        if (!description || !description.trim()) {
            return res.status(400).json({ error: "description is required" });
        }

        if (!openai) {
            return res.status(500).json({ error: "OpenAI API key not configured" });
        }

        const originalHook = hook?.trim() || "";
        const hasHook = originalHook.length > 0;

        // System message with Kitchen Rescue business context
        const systemMessage = `You are the Kitchen Rescue Content Assistant.

BUSINESS OVERVIEW:

- Kitchen Rescue provides fully equipped temporary kitchen pods for people renovating their kitchens.

- Customers avoid takeaways, mess, stress and laundrette trips.

- Builders can add Kitchen Rescue to their quotes and earn a referral fee.

- Tone of voice: practical, friendly, reassuring, UK-based, renovation-aware.

WRITING QUALITY:

- Use UK English: "takeaways", "rubbish", "renovation", "neighbours".

- Avoid Americanisms like "takeout", "trash", "remodel".

- Keep emojis light: 0–2 maximum per caption, only if they genuinely add warmth.

- Avoid cheesy marketing language like "perfect solution" or "unlock your dream kitchen".

- Focus on real life: mess, noise, laundry, kids, busy work days, renovation stress.

- Sound like a friendly, switched-on human, not a corporate advert.

RULES:

1. If the user provides a hook, use it EXACTLY as written. Do not change it.

2. If no hook is provided, create a strong, scroll-stopping hook based on the description.

3. ALWAYS respond with a VALID JSON object in this exact shape:

{
  "hook": "string",
  "caption": "string (80–140 words)",
  "hashtags": ["#KitchenRescue", "..."],
  "storyboard": [
    {
      "visual": "string",
      "text_on_screen": "string"
    },
    ...
  ],
  "image_search_terms": ["string", "string", "string"]
}

"image_search_terms":
- Provide 2–4 short, literal search phrases that a stock site like Pexels would understand.
- Focus on what should be shown visually: e.g. "messy kitchen renovation", "family cooking in temporary kitchen", "takeaway food boxes", "laundrette washing machines".
- Do NOT include abstract words like 'stress', 'dream', 'transformation'.

4. Do NOT generate images, URLs, stock photos or visual mockups.

5. "visual" must be simple textual descriptions only (not actual images).

6. Never leave any field empty.

7. Caption must ALWAYS be included.`;

        // User prompt with placeholders substituted
        const userPrompt = `USER INPUT:

Hook (may be empty):

<<<HOOK>>>
${originalHook}
<<<HOOK>>>

Description:

${description || "Kitchen renovation, hidden costs, stress, takeaways, laundry."}

Generate the JSON now.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Using more capable model for better content generation and keyword understanding
            messages: [
                {
                    role: "system",
                    content: systemMessage
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        let output = completion.choices[0].message.content;
        let parsedOutput;

        try {
            parsedOutput = JSON.parse(output);
        } catch (err) {
            console.error("Failed to parse JSON from OpenAI:", output);
            return res.status(500).json({ error: "Failed to parse JSON response from AI" });
        }

        // Safety net: If hook was provided, force it into the JSON
        if (hasHook && parsedOutput.hook !== originalHook) {
            console.log("Safety net applied: Hook forced to:", originalHook);
            parsedOutput.hook = originalHook;
        }

        // Ensure #KitchenRescue is in hashtags
        if (parsedOutput.hashtags && Array.isArray(parsedOutput.hashtags)) {
            const hasKitchenRescue = parsedOutput.hashtags.some(tag => 
                tag.toLowerCase().includes('kitchenrescue') || tag.toLowerCase().includes('kitchen-rescue')
            );
            if (!hasKitchenRescue) {
                parsedOutput.hashtags.push('#KitchenRescue');
            }
        }

        // Second call: Refine the caption with an editor
        if (parsedOutput.caption) {
            try {
                const edited = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: "You are an editor improving Instagram captions for Kitchen Rescue. Keep the same idea but make it clearer, more natural, and a bit punchier. Keep UK English and no more than 2 emojis. Return only the improved caption text, nothing else."
                        },
                        {
                            role: "user",
                            content: parsedOutput.caption
                        }
                    ],
                    temperature: 0.7
                });

                const betterCaption = edited.choices[0].message.content.trim();
                if (betterCaption) {
                    console.log("Caption refined by editor");
                    parsedOutput.caption = betterCaption;
                }
            } catch (err) {
                console.error("Error refining caption (using original):", err.message);
                // Continue with original caption if editing fails
            }
        }

        res.json(parsedOutput);

    } catch (err) {
        console.error("Error in /api/content-idea:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// Search for stock photos/videos using Pexels
app.post("/api/search-visuals", authenticateAdmin, async (req, res) => {
    try {
        const { query, type = "photos", perPage = 6 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
        if (!PEXELS_API_KEY) {
            return res.status(500).json({ error: "Pexels API key not configured" });
        }

        const endpoint = type === "videos" 
            ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`
            : `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;

        const response = await fetch(endpoint, {
            headers: {
                Authorization: PEXELS_API_KEY,
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Pexels API error:", errText);
            return res.status(500).json({ error: "Pexels API error", details: errText });
        }

        const data = await response.json();
        
        // Format response consistently
        if (type === "videos") {
            const videos = data.videos.map(video => ({
                id: video.id,
                url: video.url,
                thumbnail: video.image,
                duration: video.duration,
                photographer: video.user.name,
                photographerUrl: video.user.url,
                link: video.url,
            }));
            res.json({ videos });
        } else {
            const photos = data.photos.map(photo => ({
                id: photo.id,
                url: photo.src.large,
                thumbnail: photo.src.medium,
                photographer: photo.photographer,
                photographerUrl: photo.photographer_url,
                link: photo.url,
            }));
            res.json({ photos });
        }
    } catch (err) {
        console.error("Error in /api/search-visuals:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

module.exports = app;
