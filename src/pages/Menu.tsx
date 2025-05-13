import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Coffee,
  Utensils,
  Pizza,
  Beer,
  CupSoda,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MenuItem {
  id: string;
  golf_course_id: string;
  category: string;
  item_name: string;
  description: string;
  price: number;
  image_url: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const categories = [
  { id: 'Breakfast', name: 'Breakfast', icon: Coffee },
  { id: 'Lunch & Dinner', name: 'Lunch & Dinner', icon: Utensils },
  { id: 'Snacks', name: 'Snacks', icon: Pizza },
  { id: 'Drinks', name: 'Drinks', icon: CupSoda },
  { id: 'Beer', name: 'Beer', icon: Beer }
];

export default function Menu() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('Breakfast');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, { session }) => {
      setSession(session);
      setDropdownOpen(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
    setDropdownOpen(false);
  }

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Fetch menu items
  useEffect(() => {
    if (!courseId) {
      setError('No golf course ID provided');
      setLoading(false);
      return;
    }
    supabase
      .from('menu_items')
      .select('*')
      .eq('golf_course_id', courseId)
      .then(({ data, error: e }) => {
        if (e) throw e;
        setMenuItems(data || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  const filteredItems = menuItems.filter(
    item =>
      item.category === selectedCategory &&
      (item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const persist = (newCart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const addToCart = (item: MenuItem) => {
    const newCart = [...cart];
    const existing = newCart.find(c => c.id === item.id);
    if (existing) existing.quantity++;
    else newCart.push({ ...item, quantity: 1 });
    setCart(newCart);
    persist(newCart);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const newCart = cart
      .map(c => (c.id === itemId ? { ...c, quantity: c.quantity + delta } : c))
      .filter(c => c.quantity > 0);
    setCart(newCart);
    persist(newCart);
  };

  const removeFromCart = (itemId: string) => {
    const newCart = cart.filter(c => c.id !== itemId);
    setCart(newCart);
    persist(newCart);
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#4CAF50] rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-[#2C2C2C] text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#2E7D32] transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Auth Menu */}
      <div className="absolute top-4 right-4">
        {session?.user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              {session.user.email}
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Login
          </Link>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C2C2C] mb-4">Menu</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search menu items..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex space-x-4 overflow-x-auto mb-12">
          {categories.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              className={`flex items-center px-5 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === id
                  ? 'bg-[#4CAF50] text-white'
                  : 'bg-white text-[#2C2C2C] hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 mr-2" />
              {name}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu Grid */}
          <div className="flex-grow">
            <h2 className="text-2xl font-serif text-[#2C2C2C] mb-4">{selectedCategory}</h2>
            {filteredItems.length === 0 ? (
              <p className="text-gray-500">No items found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
                  >
                    {item.image_url && (
                      <div
                        className="h-48 bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image_url})` }}
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-serif text-[#2C2C2C] mb-2">{item.item_name}</h3>
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-[#2C2C2C]">
                          ${item.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-[#4CAF50] text-white px-5 py-2 rounded-lg hover:bg-[#2E7D32] transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <aside className="lg:w-96">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="flex items-center mb-6">
                <ShoppingBag className="w-6 h-6 text-[#4CAF50] mr-2" />
                <h2 className="text-2xl font-serif text-[#2C2C2C]">Your Cart</h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-grow">
                          <h4 className="font-medium text-[#2C2C2C]">{item.item_name}</h4>
                          <div className="flex items-center mt-2">
                            <button onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                            </button>
                            <span className="mx-3">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[#2C2C2C]">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-4">
                      <span className="text-lg font-medium text-[#2C2C2C]">Total:</span>
                      <span className="text-lg font-bold text-[#2C2C2C]">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <Link to={`/checkout/${courseId}`} className="block w-full">
                      <button className="w-full bg-[#4CAF50] text-white py-3 rounded-lg hover:bg-[#2E7D32] transition">
                        Proceed to Checkout
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}