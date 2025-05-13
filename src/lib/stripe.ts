// /src/lib/stripe.ts
import { supabase } from './supabase'
import { requestGeolocation } from './geolocation'

interface Geo {
  latitude: number
  longitude: number
}

export async function createCheckoutSession(
  lineItems: any[],
  successUrl: string,
  cancelUrl: string,
  courseId: string,
  notes: string = '',
  location?: { lat: number; lng: number },
  holeNumber?: number
) {
  // 1) grab the user's lat/lng if not provided
  let lat: number = location?.lat ?? 0;
  let lng: number = location?.lng ?? 0;

  // 2) call your nearest_hole RPC if no hole number provided
  let finalHoleNumber = holeNumber;
  if (!finalHoleNumber) {
    const { data: holes, error: holeErr } = await supabase
      .rpc('nearest_hole', {
        course_id: courseId,
        p_lat: lat,
        p_lng: lng,
      });

    if (holeErr) {
      console.error('Error calling nearest_hole:', holeErr);
      throw holeErr;
    }
    if (!holes || holes.length === 0) {
      throw new Error('No hole returned from nearest_hole');
    }
    finalHoleNumber = holes[0].hole_number;
  }

  // 3) send everything to your Supabase Edge Function
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        course_id: courseId,
        hole_number: finalHoleNumber,
        notes: notes.trim(),
        mode: 'payment',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('🔥 Stripe function error:', error);
    throw new Error(error.error || 'Failed to create checkout session');
  }

  const { url } = await response.json();
  return { url };
}