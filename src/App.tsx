import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Calendar, Clock, Users, Goal as GolfBall, ShoppingCart } from 'lucide-react';
import Menu from './pages/Menu';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import ThankYou from './pages/ThankYou';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Orders from './pages/Orders';
import NotificationBell from './components/NotificationBell';

interface TeeTime {
  id: number;
  time: string;
  price: number;
  players: number;
}

// Default course ID
const DEFAULT_COURSE_ID = "c4a48f69-a535-4f57-8716-d34cff63059b";

function App() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [players, setPlayers] = useState<number>(2);
  const [cart, setCart] = useState<TeeTime[]>([]);

  const availableTimes: TeeTime[] = [
    { id: 1, time: '07:00', price: 85, players },
    { id: 2, time: '07:30', price: 85, players },
    { id: 3, time: '08:00', price: 95, players },
    { id: 4, time: '08:30', price: 95, players },
    { id: 5, time: '09:00', price: 105, players },
  ];

  const addToCart = (teeTime: TeeTime) => {
    setCart([...cart, { ...teeTime, players }]);
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.players), 0);

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>
      
      <Routes>
        {/* Redirect root to default course menu */}
        <Route path="/" element={<Navigate to={`/menu/${DEFAULT_COURSE_ID}`} replace />} />

        {/* Main pages */}
        <Route path="/menu/:courseId" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/checkout/:courseId" element={<Checkout />} />
        <Route path="/thank-you" element={<ThankYou />} />

        {/* Tee Time Booking Page */}
        <Route path="/tee-times/:courseId" element={
          <div className="min-h-screen bg-[#f8f9fa]">
            {/* Hero Banner */}
            <div 
              className="h-[40vh] bg-cover bg-center relative"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <h1 className="text-white text-5xl font-bold">Pine Valley Golf Club</h1>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Booking Section */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4">Book a Tee Time</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="inline-block w-4 h-4 mr-2" />
                          Select Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full p-2 border rounded-md"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Users className="inline-block w-4 h-4 mr-2" />
                          Number of Players
                        </label>
                        <select
                          value={players}
                          onChange={(e) => setPlayers(Number(e.target.value))}
                          className="w-full p-2 border rounded-md"
                        >
                          {[1, 2, 3, 4].map(num => (
                            <option key={num} value={num}>
                              {num} Player{num > 1 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {availableTimes.map((teeTime) => (
                        <div key={teeTime.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                            <Clock className="w-5 h-5 mr-3 text-green-600" />
                            <div>
                              <p className="font-semibold">{teeTime.time}</p>
                              <p className="text-sm text-gray-600">${teeTime.price} per player</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addToCart(teeTime)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                            disabled={cart.some(item => item.id === teeTime.id)}
                          >
                            {cart.some(item => item.id === teeTime.id) ? 'Added' : 'Book Now'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cart Section */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                    <div className="flex items-center mb-6">
                      <ShoppingCart className="w-6 h-6 mr-2 text-green-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
                    </div>
                    
                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <GolfBall className="w-12 h-12 mx-auto mb-3" />
                        <p>Your cart is empty</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 mb-6">
                          {cart.map((item) => (
                            <div key={item.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{item.time}</h4>
                                <p className="text-sm text-gray-600">
                                  {item.players} Player{item.players > 1 ? 's' : ''} × ${item.price}
                                </p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t pt-4">
                          <div className="flex justify-between mb-4">
                            <span className="font-semibold">Total:</span>
                            <span className="font-semibold">${totalPrice}</span>
                          </div>
                          <button
                            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition"
                          >
                            Proceed to Checkout
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </>
  );
}

export default App;