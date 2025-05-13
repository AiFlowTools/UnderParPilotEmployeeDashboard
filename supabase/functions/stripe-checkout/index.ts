// stripe-checkout/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// 1) Supabase client with service-role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// 2) Stripe client
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  appInfo: { name: 'Golf Course Food Ordering', version: '1.0.0' },
  apiVersion: '2023-10-16'
});

// 3) CORS headers
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: cors });
  }

  try {
    const { line_items, success_url, cancel_url, course_id, hole_number, notes } = await req.json();

    // Calculate total
    const total_price = line_items.reduce(
      (sum: number, li: any) =>
        sum + (li.price_data.unit_amount / 100) * li.quantity,
      0
    );

    // Insert one "pending" order and grab its id
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        course_id,
        items: line_items.map((li: any) => ({
          item_name: li.price_data.product_data.name,
          price: li.price_data.unit_amount / 100,
          quantity: li.quantity,
        })),
        total_price,
        status: 'pending',
        hole_number,
        notes: notes?.trim() || null,
      })
      .select('id')
      .single();

    if (insertError || !order?.id) {
      console.error('🛑 Insert order failed:', insertError);
      throw new Error('Could not create order');
    }

    const orderId = order.id as string;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url,
      cancel_url,
      customer_creation: 'always',
      billing_address_collection: 'auto',
      metadata: {
        course_id,
        order_id: orderId,
        hole_number,
        notes: notes?.trim() || '',
      },
    });

    // Store session ID on the Supabase row
    const { error: updateError } = await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', orderId);

    if (updateError) {
      console.error('🛑 Failed to save session ID:', updateError);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('🔥 Checkout error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});