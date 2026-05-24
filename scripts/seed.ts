// Sample data seeder.
// Run with: npm run seed
// Requires SUPABASE_SERVICE_ROLE_KEY and a target user email in env.

import { createClient } from '@supabase/supabase-js';

const SEED_EMAIL = process.env.SEED_USER_EMAIL || 'demo@studioos.app';

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Find user
  const { data: users } = await supabase.from('users').select('*').eq('email', SEED_EMAIL).limit(1);
  if (!users || users.length === 0) {
    console.error(`User ${SEED_EMAIL} not found. Sign up via the app first, then run seed.`);
    process.exit(1);
  }
  const user = users[0];
  const wsId = user.workspace_id;

  console.log(`Seeding workspace ${wsId} for ${SEED_EMAIL}`);

  // Sample contacts
  const { data: contacts } = await supabase.from('contacts').insert([
    { workspace_id: wsId, name: 'Priya Sharma', agency: 'IMG Fashion', city: 'Mumbai', profession: 'Brand Manager', phone: '+91 98200 11001', email: 'priya@imgfashion.com' },
    { workspace_id: wsId, name: 'Amit Verma', agency: 'Nykaa', city: 'Delhi', profession: 'PR Manager', phone: '+91 98100 55678', email: 'amit.v@nykaa.com' },
    { workspace_id: wsId, name: 'Rahul Nair', agency: 'H&M PR', city: 'Mumbai', profession: 'Stylist', phone: '+91 99200 33445', email: 'rahul@hmpr.in' },
    { workspace_id: wsId, name: 'Kavita Singh', agency: 'IMG Reliance', city: 'Mumbai', profession: 'Event Producer', phone: '+91 98200 11223', email: 'kavita@imgreliance.com' }
  ]).select();

  console.log(`Created ${contacts?.length} contacts`);

  // Sample sourcing
  const today = new Date();
  const f = (d: Date) => d.toISOString().split('T')[0];
  const offsetDate = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

  await supabase.from('sourcing_records').insert([
    { workspace_id: wsId, brand: 'Zara India', outfit: 'Summer Linen Dress + 3 looks', agency: 'IMG Fashion', poc_name: 'Priya Sharma', poc_phone: '+91 98200 11001', poc_email: 'priya@imgfashion.com', source_date: f(offsetDate(-10)), return_date: f(offsetDate(15)), status: 'Shot', deliverables_text: '1 Reel, 3 Stories' },
    { workspace_id: wsId, brand: 'Nykaa Beauty', outfit: 'Skincare Starter Kit', poc_name: 'Amit Verma', source_date: f(offsetDate(-5)), status: 'Pending', deliverables_text: '3 Stories, 1 Post' },
    { workspace_id: wsId, brand: 'Mango', outfit: 'Resort Collection', source_date: f(today), return_date: f(offsetDate(30)), status: 'Shipped', deliverables_text: '1 Reel, 2 Posts' }
  ]);

  // Sample events
  await supabase.from('events').insert([
    { workspace_id: wsId, name: 'Lakme Fashion Week', event_type: 'personal_appearance', start_date: f(offsetDate(8)), end_date: f(offsetDate(10)), city: 'Mumbai', venue: 'NESCO, Goregaon', importance: 5, organiser: 'IMG Reliance', poc_name: 'Kavita Singh', poc_phone: '+91 98200 11223', poc_email: 'kavita@imgreliance.com', travel_required: false },
    { workspace_id: wsId, name: 'Goa Content Trip', event_type: 'travel', start_date: f(offsetDate(18)), end_date: f(offsetDate(23)), city: 'Goa', importance: 3, travel_required: true, travel_destination: 'Goa', travel_depart_date: f(offsetDate(17)), travel_return_date: f(offsetDate(24)), travel_hotel: 'W Goa' }
  ]);

  console.log('Seed complete!');
}

main().catch(console.error);
