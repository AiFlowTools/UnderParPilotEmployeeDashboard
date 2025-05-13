import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Order {
  id: string
  ordered_items: string
  course_id: string
}

export default function ThankYou() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    // Clear cart once we arrive on this page
    localStorage.removeItem('cart')

    if (!sessionId) {
      setLoading(false)
      return
    }

    // Look up the order by stripe_session_id
    supabase
      .from<Order>('orders')
      .select('id, ordered_items, course_id')
      .eq('stripe_session_id', sessionId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch order:', error)
        } else {
          setOrder(data)
        }
      })
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      {loading ? (
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600" />
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center animate-fadeIn max-w-md w-full">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="text-green-600 w-20 h-20 animate-pingOnce" />
          </div>
          <h1 className="text-3xl font-serif text-charcoal mb-4">
            Thank you for your order!
          </h1>
          {order ? (
            <p className="text-charcoal mb-6">
              Order <strong>#{order.id}</strong> confirmed!<br />
              Items: {order.ordered_items}<br />
              We’ll deliver it to hole <strong>#{order.course_id}</strong> shortly.
            </p>
          ) : (
            <p className="text-charcoal mb-6">
              Your payment was successful. Enjoy your refreshments!
            </p>
          )}
          <button
            onClick={() => {
              if (order?.course_id) {
                navigate(`/menu/${order.course_id}`)
              } else {
                navigate('/')
              }
            }}
            className="bg-primary-green hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  )
}
