// Refund & Cancellation Policy Content
// Uses business configuration for consistency

import { BUSINESS } from "../config/business";

export const REFUNDS_MARKDOWN = `
# Refund & Cancellation Policy

_Last updated: 5 January 2026_

This Refund & Cancellation Policy applies to hire bookings made with **${BUSINESS.tradingName}**.

## 1. Company Information
This policy applies to services provided by **${BUSINESS.legalEntityName}** trading as **${BUSINESS.tradingName}** (Company Registration Number: ${BUSINESS.companyNumber}, VAT Number: ${BUSINESS.vatNumber}).

Registered and trading address: ${BUSINESS.registeredOffice}

## 2. Booking & Security Deposit (£250)
A £250 deposit is required to secure your booking.

If you cancel more than 1 month before the scheduled delivery date, the £250 deposit will be refunded in full.

If the hire goes ahead, the £250 deposit is retained as a security deposit for the duration of the hire. The deposit is refundable after collection and inspection of the unit, subject to deductions for:
- damage beyond fair wear and tear
- missing items
- excessive cleaning
- misuse of the equipment

Any deductions will be itemised on request.

Refunds of any remaining balance will be processed within 5 working days of inspection.

## 3. Cancellation Policy

### 3.1 Customer Cancellation
You may cancel your booking at any time by contacting us at ${BUSINESS.supportEmail} or ${BUSINESS.phone}. Cancellation charges apply as follows:

- **More than 1 month before delivery:** Full refund of the £250 deposit and any hire payments made
- **7–30 days before delivery:** 50% refund of hire payments (deposit retained)
- **Less than 7 days before delivery:** No refund of hire payments (deposit retained)
- **On or after delivery day:** No refund available

### 3.2 Company Cancellation
We reserve the right to cancel your booking in the following circumstances:
- Insufficient access to your property
- Safety concerns at the delivery location
- Extreme weather conditions preventing safe delivery
- Non-payment of outstanding balances
- Breach of our terms and conditions

In the event of cancellation by The Kitchen Rescue, we will provide a full refund of all payments made.

## 4. Refund Policy

### 4.1 Security Deposit Refund (£250)
If the hire goes ahead, the £250 deposit is retained as a security deposit for the duration of the hire. The deposit is refundable after collection and inspection of the unit, subject to deductions for:
- damage beyond fair wear and tear
- missing items
- excessive cleaning
- misuse of the equipment

Any deductions will be itemised on request.

### 4.2 Damage Charges
Any damage to the kitchen pod or its contents will result in charges being deducted from your deposit. Charges will be based on repair costs or replacement value. You will be notified of any charges before they are applied.

### 4.3 Refund Processing
Refunds will be processed within 5–10 business days of:
- Successful cancellation (if applicable)
- Pod inspection and return
- Resolution of any damage claims

Refunds will be made to the original payment method used for the booking.

## 5. Force Majeure
Neither party shall be liable for any failure or delay in performance under this agreement which is due to fire, flood, earthquake, elements of nature or acts of God, acts of war, terrorism, strikes, labour disputes, or any other cause which is beyond the reasonable control of either party.

## 6. Insurance
We recommend that customers have appropriate insurance coverage for the hire period. The Kitchen Rescue maintains public liability insurance, but customers are responsible for any damage to the hired equipment.

## 7. Dispute Resolution
If you are not satisfied with our service or have concerns about charges, please contact us immediately. We will work with you to resolve any issues fairly and promptly.

## 8. Changes to This Policy
We reserve the right to modify this refund and cancellation policy at any time. Changes will be posted on this page with an updated revision date. Existing bookings will be subject to the policy in effect at the time of booking.

## 9. Contact Information
For questions about cancellations, refunds, or this policy, please contact us:

**Email:** ${BUSINESS.supportEmail}  
**Phone:** ${BUSINESS.phone}  
**Address:** ${BUSINESS.tradingAddress}

If you have any questions about this policy or need to discuss a specific situation, please don't hesitate to call us. We're here to help!
`;

