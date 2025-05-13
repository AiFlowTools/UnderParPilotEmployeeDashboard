// src/lib/holes.ts
import { supabase } from './supabase'
import { requestGeolocation } from './geolocation'

export interface NearestHole {
  hole_id: string
  hole_number: number
  latitude: number
  longitude: number
  distance: number
}

/**
 * Ask the browser for the user's GPS position,
 * then call your Supabase RPC to find the nearest hole.
 */
export async function findNearestHole(courseId: string): Promise<NearestHole> {
  // 1) get the device's current position
  const coords = await requestGeolocation()

  // 2) call the RPC
  const { data, error } = await supabase
    .rpc('nearest_hole', {
      course_id: courseId,
      p_lat:     coords.latitude,
      p_lng:     coords.longitude,
    })

  if (error) throw error
  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error('No hole returned')
  }

  // our function does `LIMIT 1`, so data[0] is what we want
  return data[0] as NearestHole
}