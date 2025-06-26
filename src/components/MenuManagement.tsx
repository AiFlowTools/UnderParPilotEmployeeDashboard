import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  Filter,
  AlertCircle,
  Building2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';

interface MenuItem {
  id: string;
  golf_course_id: string;
  category: string;
  item_name: string;
  description: string;
  price: number;
  image_url?: string;
  tags?: string[];
}

interface GolfCourse {
  id: string;
  name: string;
  location?: string;
}

const categories = [
  'Breakfast',
  'Lunch & Dinner',
  'Snacks',
  'Beer',
  'Pro Shop'
];

const availableTags = [
  'spicy',
  'vegetarian',
  'bestseller',
  'gluten-free',
  'dairy-free',
  'vegan',
  'keto',
  'low-carb',
  'organic',
  'local'
];

export default function MenuManagement() {
  const { golfCourseId, loading: userLoading, hasGolfCourse } = useUser();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [golfCourse, setGolfCourse] = useState<GolfCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state for new/editing items
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    price: 0,
    category: 'Breakfast',
    image_url: '',
    tags: [] as string[]
  });

  // Tag input state
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  useEffect(() => {
    if (!userLoading && golfCourseId) {
      fetchGolfCourse();
      fetchMenuItems();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [userLoading, golfCourseId]);

  const fetchGolfCourse = async () => {
    if (!golfCourseId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('golf_courses')
        .select('id, name, location')
        .eq('id', golfCourseId)
        .single();

      if (fetchError) throw fetchError;
      setGolfCourse(data);
    } catch (err: any) {
      console.error('Error fetching golf course:', err);
      setError('Failed to load golf course information');
    }
  };

  const fetchMenuItems = async () => {
    if (!golfCourseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching menu items for golf course:', golfCourseId);

      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('golf_course_id', golfCourseId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (fetchError) throw fetchError;
      
      console.log('Fetched menu items:', data);
      setMenuItems(data || []);
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
      setError(`Failed to load menu items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
  if (editingItem) {
    // Update existing item
    const { error: updateError } = async; supabase
      .from('menu_items')
      .update({
        item_name: formData.item_name,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        image_url: formData.image_url,
        tags: formData.tags, // ✅ Include this
      })
      .eq('id', editingItem.id);

    if (updateError) {
      console.error("Update error:", updateError);
    } else {
      toast.success("Item updated!");
      setEditingItem(null);
      fetchMenuItems(); // or however you're refreshing the list
    }
  }
};

      // Ensure tags is properly formatted as an array
      const tagsToSave = formData.tags.length > 0 ? formData.tags : null;

      if (editingItem) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            item_name: formData.item_name,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            image_url: formData.image_url || null,
            tags: tagsToSave
          })
          .eq('id', editingItem.id)
          .eq('golf_course_id', golfCourseId); // Ensure user can only update items from their course

        if (updateError) throw updateError;
      } else {
        // Create new item
        const { error: insertError } = await supabase
          .from('menu_items')
          .insert({
            golf_course_id: golfCourseId,
            item_name: formData.item_name,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            image_url: formData.image_url || null,
            tags: tagsToSave
          });

        if (insertError) throw insertError;
      }

      // Refresh the list
      await fetchMenuItems();
      
      // Reset form
      handleCancel();
    } catch (err: any) {
      console.error('Error saving menu item:', err);
      setError(`Failed to save menu item: ${err.message}`);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.image_url || '',
      tags: item.tags || []
    });
    setIsAddingNew(false);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId)
        .eq('golf_course_id', golfCourseId); // Ensure user can only delete items from their course

      if (deleteError) throw deleteError;
      await fetchMenuItems();
    } catch (err: any) {
      console.error('Error deleting menu item:', err);
      setError(`Failed to delete menu item: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setIsAddingNew(false);
    setFormData({
      item_name: '',
      description: '',
      price: 0,
      category: 'Breakfast',
      image_url: '',
      tags: []
    });
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  const filteredTagSuggestions = availableTags.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !formData.tags.includes(tag)
  );

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Show loading while checking user data
  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Show error if no golf course is assigned
  if (!hasGolfCourse) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Golf Course Assigned
        </h3>
        <p className="text-gray-600 mb-4">
          Your admin account is not currently assigned to a golf course. 
          Please contact your system administrator to assign you to a golf course.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
          <h4 className="font-medium text-amber-800 mb-2">What you can do:</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Contact your system administrator</li>
            <li>• Request assignment to a golf course</li>
            <li>• Verify your admin permissions</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Golf Course Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Management</h2>
            {golfCourse && (
              <div className="flex items-center text-gray-600">
                <Building2 className="w-5 h-5 mr-2" />
                <span className="font-medium">{golfCourse.name}</span>
                {golfCourse.location && (
                  <span className="ml-2 text-gray-500">• {golfCourse.location}</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsAddingNew(true)}
            disabled={!golfCourseId}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Item
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingItem) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.item_name}
                onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (optional)
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter item description"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              
              {/* Current Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input */}
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleTagInputKeyDown}
                  onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Type a tag and press Enter, or select from suggestions"
                />

                {/* Tag Suggestions Dropdown */}
                {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredTagSuggestions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-1">
                Add tags to help categorize your menu items (e.g., spicy, vegetarian, gluten-free)
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.item_name || !formData.description || formData.price <= 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      )}

      {/* Menu Items List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {menuItems.length === 0 ? 'No menu items yet' : 'No items match your search'}
            </h3>
            <p className="text-gray-500 mb-4">
              {menuItems.length === 0 
                ? 'Start building your menu by adding your first item.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {menuItems.length === 0 && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add First Menu Item
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.item_name}
                          className="w-12 h-12 object-cover rounded-lg mr-4"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.item_name}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full shadow-sm"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No tags</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                        title="Edit item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}