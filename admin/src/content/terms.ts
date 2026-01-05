// Terms & Conditions Content
// Uses business configuration for consistency

import { BUSINESS } from "../config/business";

export const TERMS_MARKDOWN = `
# Terms & Conditions

_Last updated: 5 January 2026_

These Terms & Conditions apply to hire of a temporary kitchen provided by **${BUSINESS.tradingName}**.

## 1. Who we are
**Trading name:** ${BUSINESS.tradingName}  
**Legal entity:** ${BUSINESS.legalEntityName}  
**Company number:** ${BUSINESS.companyNumber}  
**VAT number:** ${BUSINESS.vatNumber}  
**Registered office:** ${BUSINESS.registeredOffice}  
**Trading address:** ${BUSINESS.tradingAddress}  
**Email:** ${BUSINESS.supportEmail}  
**Telephone:** ${BUSINESS.phone}

## 2. Definitions
- **We/Us/Our** means ${BUSINESS.legalEntityName} trading as ${BUSINESS.tradingName}.
- **You/Your** means the person hiring the temporary kitchen.
- **Equipment** means the kitchen pod/trailer and any appliances, fittings and accessories supplied.
- **Hire Period** means the period shown on your booking confirmation (weekly hire unless stated otherwise).
- **Security Deposit** means the refundable £250 amount taken to cover loss/damage/extra cleaning.

## 3. Booking and payment
### 3.1 Hire price
Hire is charged at **£499 per week (incl. VAT)** unless stated otherwise in writing.

### 3.2 Delivery & collection
Delivery and collection charges will be confirmed in your quote/booking. Where stated as "Delivery & collection: £150 + VAT (£75 delivery + £75 collection)", the final cost depends on distance and access.

### 3.3 Booking & Security Deposit (£250)
A **£250 deposit** is required to secure your booking.

If you cancel more than 1 month before the scheduled delivery date, the £250 deposit will be refunded in full.

If the hire goes ahead, the £250 deposit is retained as a security deposit for the duration of the hire. The deposit is refundable after collection and inspection of the unit, subject to deductions for:
- damage beyond fair wear and tear,
- missing items,
- excessive cleaning,
- misuse of the equipment.

Any deductions will be itemised on request.

Refunds of any remaining balance will be processed within 5 working days of inspection.

## 4. Your responsibilities
You agree to:
- provide safe, reasonable access for delivery/collection,
- keep the Equipment secure and use it with reasonable care,
- follow any operating instructions provided,
- not move or tow the trailer/pod yourself unless agreed in writing,
- not tamper with electrics/gas/water connections,
- notify us promptly of any faults or damage.

## 5. Cancellations and changes
### 5.1 If you cancel
- **More than 1 month before delivery:** Full refund of the £250 deposit and any hire payments made.
- **7–30 days before delivery:** 50% refund of hire payments (deposit retained).
- **Less than 7 days before delivery:** No refund of hire payments (deposit retained).
- **On or after delivery day:** No refund available.

### 5.2 If we cancel
If we need to cancel and cannot provide a suitable alternative, we will refund any amounts paid for the affected period (including the Security Deposit).

If The Kitchen Rescue cancels your booking due to our own operational issues or safety concerns not caused by the customer, you will receive a full refund of all payments made.

## 6. Faults and service
If something stops working, contact us at ${BUSINESS.supportEmail} or ${BUSINESS.phone}.  
Do not attempt repairs yourself unless we authorise it.

If a fault occurs through no fault of the customer and the pod becomes unusable, The Kitchen Rescue will:
- aim to resolve the issue promptly (normally within 24 hours), and
- refund for any full days the unit could not be used.

If a call-out is required due to customer misuse or failure to follow instructions, a £168 per hour fee (plus materials if required) will apply.

## 7. Damage, cleaning, and deposit refund
Your £250 Security Deposit will be refunded in full once the pod has been returned and inspected, provided that:
- The pod is in the same condition as when delivered
- All appliances are clean, complete, and fully functioning
- No damage or misuse has occurred
- All accessories and equipment are returned

Charges may be deducted from your deposit for:
- Damage or missing items
- Excessive cleaning
- Misuse or unauthorised alterations

## 8. Liability
Nothing in these terms excludes or limits liability where it would be unlawful to do so.  
We are not responsible for losses caused by misuse of the Equipment or failure to follow instructions.

The Kitchen Rescue maintains public liability insurance. Customers remain responsible for any damage to the hired equipment and are encouraged to arrange their own insurance for the hire period.

## 9. Privacy
We process personal data in accordance with our Privacy Policy available at ${BUSINESS.website}/privacy-policy.html.

## 10. Governing law
These terms are governed by the laws of England and Wales and disputes are subject to the courts of England and Wales.

## 11. Contact
If you have any concerns or disputes regarding charges, damage, or refunds, please contact us immediately:
- **Email:** ${BUSINESS.supportEmail}
- **Phone:** ${BUSINESS.phone}

We aim to resolve all matters fairly and promptly.
`;

