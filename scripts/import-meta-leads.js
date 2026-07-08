#!/usr/bin/env node
/**
 * Import Meta (Facebook) leads into Supabase enquiries.
 * Usage: node scripts/import-meta-leads.js
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const META_LEADS = [
  { created: '07/07/2026 3:21pm', name: 'Colin Ord', email: 'colin3216@gmail.com', phone: '447740396235' },
  { created: '07/06/2026 1:56pm', name: 'Ovie Okumagba', email: 'oviokus2@gmail.com', phone: '447958794580' },
  { created: '07/06/2026 5:55am', name: 'Antonio Manzi', email: 'vivirestaurantairdrie@gmail.com', phone: '4407341399485' },
  { created: '07/05/2026 1:20pm', name: 'MD sheikhAbdul Awall Bakul', email: 'sheikhbakul71@gmail.com', phone: '447442458793' },
  { created: '07/05/2026 3:30am', name: 'Make Money Online Followlink', email: 'shahiburhussain64@gmail.com', phone: '447565564090' },
  { created: '07/04/2026 8:01am', name: 'Mariotou Ceesay', email: 'Maria2say@yahoo.co.uk', phone: '447534576722' },
  { created: '07/02/2026 11:05pm', name: 'Janine Cicchirillo', email: 'jcicchirillo@icloud.com', phone: '447884583200' },
  { created: '07/02/2026 3:06pm', name: 'Egid', email: 'Alibasyurt45@gmail.com', phone: '447733777872' },
  { created: '06/30/2026 6:32am', name: 'Dwayne Campbell', email: 'Dwaynecampbell40@yahoo.com', phone: '447885692271' },
  { created: '06/29/2026 9:12am', name: 'Adele Spencer', email: 'adelemspencer@gmail.com', phone: '447890841734' },
  { created: '06/29/2026 4:52am', name: 'Csaba Angyal', email: 'csaba.angyal@yahoo.com', phone: '4407466331051' },
  { created: '06/28/2026 10:26am', name: 'Caroline Graham', email: 'caroline.kane320@gmail.com', phone: '447446020660' },
  { created: '06/28/2026 7:01am', name: 'John Hailey', email: 'john.hailey48@gmail.com', phone: '447484118412' },
  { created: '06/27/2026 12:00am', name: 'David Legg', email: 'daddycharlie2011@gmail.com', phone: '447837736165' },
  { created: '06/25/2026 10:11pm', name: 'Nigel Mcleary', email: 'nigelbreadmore66@msn.com', phone: '447500118687' },
  { created: '06/25/2026 12:16pm', name: 'Yener acar', email: 'Yenerleo5@gmail.com', phone: '4407393577022' },
  { created: '06/22/2026 3:21pm', name: 'Beverley neuvill', email: 'bevvey007@gmail.com', phone: '447944026213' },
  { created: '06/22/2026 11:21am', name: 'Janet Marshall', email: 'janetm1978@hotmail.com', phone: '447771978873' },
  { created: '06/22/2026 5:26am', name: 'Donald Campbell', email: 'Donald.campbell26@btinternet.com', phone: '4407860412716' },
];

function parseCreatedAt(value) {
  const m = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!m) return new Date().toISOString();
  let hour = Number(m[4]);
  const minute = Number(m[5]);
  const ampm = m[6].toLowerCase();
  if (ampm === 'pm' && hour !== 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), hour, minute, 0);
  return d.toISOString();
}

function formatPhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('440')) digits = '44' + digits.slice(3);
  if (digits.startsWith('44')) return `+${digits}`;
  if (digits.startsWith('0')) return `+44${digits.slice(1)}`;
  return digits ? `+${digits}` : null;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('email');
  if (fetchError) {
    console.error('Failed to fetch existing leads:', fetchError.message);
    process.exit(1);
  }

  const existingEmails = new Set(
    (existing || []).map((row) => (row.email || '').trim().toLowerCase()).filter(Boolean)
  );

  let inserted = 0;
  let skipped = 0;

  for (const lead of META_LEADS) {
    const email = lead.email.trim().toLowerCase();
    if (existingEmails.has(email)) {
      console.log(`Skip (already exists): ${lead.name} <${email}>`);
      skipped += 1;
      continue;
    }

    const row = {
      name: lead.name.trim(),
      email,
      phone: formatPhone(lead.phone),
      source: 'meta',
      created_at: parseCreatedAt(lead.created),
      followed_up: false,
      notes: 'Imported from Meta leads export',
    };

    const { error } = await supabase.from('leads').insert([row]);
    if (error) {
      console.error(`Failed: ${lead.name} — ${error.message}`);
      continue;
    }

    existingEmails.add(email);
    inserted += 1;
    console.log(`Added: ${lead.name} <${email}>`);
  }

  console.log(`\nDone. Inserted ${inserted}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
