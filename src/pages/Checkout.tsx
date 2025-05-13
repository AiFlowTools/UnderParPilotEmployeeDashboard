import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
} from 'lucide-react';
import { createCheckoutSession } from '../lib/stripe';
import { requestGeolocation, GeolocationError } from '../lib/geolocation';

interface CartItem {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
  image_url?: string;
  note?: string;
}

interface OrderStatus {
  success: boolean;
  message: string;
}

interface SubmitOrderOptions {
  location?: { lat: number; lng: number };
  hole?: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [showHoleSelect, setShowHoleSelect] = useState(false);
  const [selectedHole, setSelectedHole] = useState<number>(0);

  // Load cart on mount
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updated = cart
      .map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter(item => item.quantity > 0);
    updateCart(updated);
  };

  const removeItem = (itemId: string) => {
    updateCart(cart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const submitOrder = async (options: SubmitOrderOptions = {}) => {
    if (!courseId || cart.length === 0) return;
    setIsSubmitting(true);
    setOrderStatus(null);

    try {
      const lineItems = cart.map(item => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: item.item_name,
            images: item.image_url ? [item.image_url] : undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      const combinedNotes = [
        notes,
        ...cart
          .filter(item => item.note)
          .map(item => `${item.item_name}: ${item.note}`)
      ].filter(Boolean).join('\n');

      const { url } = await createCheckoutSession(
        lineItems,
        `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        `${window.location.origin}/checkout/${courseId}`,
        courseId,
        combinedNotes,
        options.location,
        options.hole
      );

      if (!url) throw new Error('Failed to create checkout session.');
      window.location.href = url;
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setOrderStatus({
        success: false,
        message: err.message || 'An unexpected error occurred.',
      });
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const location = await requestGeolocation();
      await submitOrder({
        location: { lat: location.latitude, lng: location.longitude }
      });
    } catch (err) {
      if (err instanceof GeolocationError && err.code === GeolocationError.PERMISSION_DENIED) {
        setShowHoleSelect(true);
      } else {
        // For other errors, proceed without location
        await submitOrder();
      }
    }
  };

  const handleManualSubmit = async () => {
    if (!selectedHole) {
      setOrderStatus({
        success: false,
        message: 'Please select a hole number'
      });
      return;
    }
    await submitOrder({ hole: selectedHole });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(courseId ? `/menu/${courseId}` : '/')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Return to menu"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Menu
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Order</h1>

        {/* Order Status */}
        {orderStatus && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center ${
              orderStatus.success
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {orderStatus.success ? (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <p>{orderStatus.message}</p>
          </div>
        )}

        {cart.length === 0 ? (
          // Empty Cart
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Your cart is empty</p>
          </div>
        ) : (
          // Cart with items + notes + subtotal
          <>
            {/* Global Notes / Allergies */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes / Allergies (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special requests or allergy info?"
                rows={3}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>

            {/* Line items */}
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div className="p-4 flex items-center gap-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.item_name}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.item_name}
                      </h3>
                      <p className="text-gray-500">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-5 h-5 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="w-24 text-right">
                      <p className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Item-specific note */}
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <input
                      type="text"
                      placeholder="Add a note (e.g. no onions)"
                      value={item.note || ''}
                      onChange={e => {
                        const updated = cart.map(ci =>
                          ci.id === item.id ? { ...ci, note: e.target.value } : ci
                        );
                        updateCart(updated);
                      }}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Checkout */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium text-gray-900">Subtotal</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              {showHoleSelect ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="hole-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Hole Number
                    </label>
                    <select
                      id="hole-select"
                      value={selectedHole}
                      onChange={(e) => setSelectedHole(Number(e.target.value))}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
                    >
                      <option value={0}>Select a hole...</option>
                      {Array.from({ length: 18 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Hole {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={clearCart}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Clear Cart
                    </button>
                    <button
                      onClick={handleManualSubmit}
                      disabled={isSubmitting}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                        isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isSubmitting ? 'Processing…' : 'Submit Order'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={clearCart}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                      isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isSubmitting ? 'Processing…' : 'Place Order'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}