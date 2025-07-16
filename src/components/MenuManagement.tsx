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
  Building2,
  Upload,
  Loader2,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { Menu } from '@headlessui/react';

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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Image upload states
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form state for new/editing items
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    price: 0,
    category: 'Breakfast',
    image_url: '',
    tags: [] as string[]
  });

  useEffect(() => {
    if (!userLoading && golfCourseId) {
      fetchGolfCourse();
      fetchMenuItems();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [userLoading, golfCourseId]);

  // Reset upload states when form data changes
  useEffect(() => {
    if (formData.image_url) {
      setImagePreview(formData.image_url);
      setUploadSuccess(false);
    } else {
      setImagePreview(null);
      setUploadSuccess(false);
    }
  }, [formData.image_url]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !golfCourseId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      setError('Image file size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${golfCourseId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        // Update form data with the new URL
        setFormData(prev => ({
          ...prev,
          image_url: urlData.publicUrl
        }));
        
        setImagePreview(urlData.publicUrl);
        setUploadSuccess(true);
        
        // Clear success state after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(`Failed to upload image: ${err.message}`);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

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

  const handleSave = async () => {
    if (!golfCourseId) {
      setError('No golf course assigned to your account');
      return;
    }

    try {
      setError(null);

      // Validate required fields
      if (!formData.item_name.trim()) {
        setError('Item name is required');
        return;
      }

      if (!formData.description.trim()) {
        setError('Description is required');
        return;
      }

      if (formData.price <= 0) {
        setError('Price must be greater than 0');
        return;
      }

      // Ensure tags is properly formatted as an array
      const tagsToSave = formData.tags.length > 0 ? formData.tags : null;

      if (editingItemId) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            item_name: formData.item_name.trim(),
            description: formData.description.trim(),
            price: formData.price,
            category: formData.category,
            image_url: formData.image_url.trim() || null,
            tags: tagsToSave
          })
          .eq('id', editingItemId)
          .eq('golf_course_id', golfCourseId); // Ensure user can only update items from their course

        if (updateError) throw updateError;
      } else {
        // Create new item
        const { error: insertError } = await supabase
          .from('menu_items')
          .insert({
            golf_course_id: golfCourseId,
            item_name: formData.item_name.trim(),
            description: formData.description.trim(),
            price: formData.price,
            category: formData.category,
            image_url: formData.image_url.trim() || null,
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
    // Close any existing edit form and open new one
    setEditingItemId(item.id);
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
    setEditingItemId(null);
    setIsAddingNew(false);
    setFormData({
      item_name: '',
      description: '',
      price: 0,
      category: 'Breakfast',
      image_url: '',
      tags: []
    });
    setImagePreview(null);
    setUploadSuccess(false);
    setUploading(false);
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Render the edit form component
  const renderEditForm = () => (
    <div className="bg-gray-50 border-l-4 border-green-500 p-6 animate-slideDown">
      <h4 className="text-lg font-semibold mb-4 text-green-800">
        {editingItemId ? 'Edit Menu Item' : 'Add New Menu Item'}
      </h4>
      
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
          <div className="flex gap-2">
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <button
                type="button"
                disabled={uploading}
                className={`px-3 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                  uploading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : uploadSuccess
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                title="Upload image"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : uploadSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload an image or enter a URL manually. Max file size: 5MB
          </p>
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
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tags
          </label>
          
          {/* Clickable Tag Chips */}
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => {
              const isSelected = formData.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                      : 'bg-gray-200 text-gray-600 border border-gray-300 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Click tags to select or deselect them for this menu item
          </p>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Preview
            </label>
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                onError={() => setImagePreview(null)}
              />
              {uploadSuccess && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        )}
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
          disabled={!formData.item_name || !formData.description || formData.price <= 0 || uploading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </button>
      </div>
    </div>
  );

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

      {/* Add New Item Form */}
      {isAddingNew && renderEditForm()}

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
      <div className="overflow-x-auto">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  min-w-[80px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-gray-50">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium min-w-[80px]">
  {/* Mobile/Tablet: Show menu button */}
  <div className="flex lg:hidden items-center justify-end">
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" fill="#4B5563"/><circle cx="12" cy="12" r="2" fill="#4B5563"/><circle cx="19" cy="12" r="2" fill="#4B5563"/></svg>
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-2 w-32 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-50">
        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => handleEdit(item)}
                className={`${
                  active ? 'bg-gray-100' : ''
                } flex w-full items-center px-4 py-2 text-sm text-green-700`}
              >
                <Edit className="w-4 h-4 mr-2" /> Edit
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => handleDelete(item.id)}
                className={`${
                  active ? 'bg-gray-100' : ''
                } flex w-full items-center px-4 py-2 text-sm text-red-700`}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  </div>

  {/* Desktop: Show icons inline */}
  <div className="hidden lg:flex space-x-2">
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
                  {/* Inline Edit Form */}
                  {editingItemId === item.id && (
                    <tr>
                      <td colSpan={5} className="px-0 py-0">
                        {renderEditForm()}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}