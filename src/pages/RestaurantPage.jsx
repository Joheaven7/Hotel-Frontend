import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/Modal';
import {
  Utensils, Plus, Edit2, Trash2, Search, Filter,
  CheckCircle, XCircle, Clock, Tag, RefreshCw, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestaurantPage() {
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'categories'

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states - Item
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    preparationTime: 15,
    image: '',
    isAvailable: true,
  });

  // Form states - Category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catRes] = await Promise.all([
        apiClient.get('/restaurant/items'),
        apiClient.get('/restaurant/categories'),
      ]);
      setItems(itemsRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch restaurant data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Item Handlers
  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name || '',
        category: item.category?._id || item.category || '',
        description: item.description || '',
        price: item.price || '',
        preparationTime: item.preparationTime || 15,
        image: item.image || '',
        isAvailable: item.isAvailable ?? true,
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        category: categories[0]?._id || '',
        description: '',
        price: '',
        preparationTime: 15,
        image: '',
        isAvailable: true,
      });
    }
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.category || !itemForm.price) {
      return toast.error('Please fill in Item Name, Category, and Price');
    }

    try {
      const payload = {
        ...itemForm,
        price: Number(itemForm.price),
        preparationTime: Number(itemForm.preparationTime),
      };

      if (editingItem) {
        await apiClient.put(`/restaurant/items/${editingItem._id}`, payload);
        toast.success('Food item updated');
      } else {
        await apiClient.post('/restaurant/items', payload);
        toast.success('Food item created');
      }
      setItemModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving food item');
    }
  };

  const handleToggleAvailability = async (itemId) => {
    try {
      await apiClient.patch(`/restaurant/items/${itemId}/availability`);
      setItems((prev) =>
        prev.map((i) => (i._id === itemId ? { ...i, isAvailable: !i.isAvailable } : i))
      );
      toast.success('Availability toggled');
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await apiClient.delete(`/restaurant/items/${itemId}`);
      toast.success('Item deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete item');
    }
  };

  // Category Handlers
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name || '',
        description: cat.description || '',
        displayOrder: cat.displayOrder || 0,
        isActive: cat.isActive ?? true,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        displayOrder: categories.length,
        isActive: true,
      });
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      return toast.error('Category Name is required');
    }

    try {
      if (editingCategory) {
        await apiClient.put(`/restaurant/categories/${editingCategory._id}`, categoryForm);
        toast.success('Category updated');
      } else {
        await apiClient.post('/restaurant/categories', categoryForm);
        toast.success('Category created');
      }
      setCategoryModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await apiClient.delete(`/restaurant/categories/${catId}`);
      toast.success('Category deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const itemCatId = item.category?._id || item.category;
    const matchesCategory = selectedCategoryFilter === 'ALL' || itemCatId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Restaurant Menu Management"
        subtitle="Manage food categories, room service menu items, and item availability"
        breadcrumbs={[{ label: 'Home' }, { label: 'Restaurant' }]}
        action={
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenCategoryModal()}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-btn font-medium hover:bg-secondary/90 transition-colors shadow-soft"
            >
              <Tag size={16} /> Add Category
            </button>
            <button
              onClick={() => handleOpenItemModal()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft"
            >
              <Plus size={16} /> Add Menu Item
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'items'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          onClick={() => setActiveTab('items')}
        >
          Food Items ({items.length})
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'categories'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          onClick={() => setActiveTab('categories')}
        >
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-card border border-border shadow-soft">
            <div className="relative w-full sm:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search dishes or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter size={18} className="text-text-secondary" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Food Items Table */}
          <div className="bg-white rounded-card border border-border shadow-soft overflow-hidden">
            {loading ? (
              <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">
                <Utensils size={40} className="mx-auto mb-2 opacity-40" />
                <p>No food items found matching criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-background border-b border-border text-text-secondary font-medium">
                    <tr>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Prep Time</th>
                      <th className="py-3 px-4">Available</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-background/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                                <Utensils size={20} />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-text-primary">{item.name}</p>
                              <p className="text-xs text-text-secondary line-clamp-1 max-w-xs">{item.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                            {item.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-text-primary">
                          ETB {(item.price || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {item.preparationTime || 15} mins
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleAvailability(item._id)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${item.isAvailable
                              ? 'bg-success/15 text-success hover:bg-success/25'
                              : 'bg-error/15 text-error hover:bg-error/25'
                              }`}
                          >
                            {item.isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenItemModal(item)}
                              className="p-1.5 text-text-secondary hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-1.5 text-text-secondary hover:text-error transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white rounded-card border border-border shadow-soft overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              <Tag size={40} className="mx-auto mb-2 opacity-40" />
              <p>No food categories created yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-background border-b border-border text-text-secondary font-medium">
                <tr>
                  <th className="py-3 px-4">Display Order</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-background/50">
                    <td className="py-3 px-4 font-mono font-semibold text-text-secondary">
                      #{cat.displayOrder}
                    </td>
                    <td className="py-3 px-4 font-bold text-text-primary">
                      {cat.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.isActive ? 'bg-success/15 text-success' : 'bg-text-secondary/15 text-text-secondary'}`}>
                        {cat.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenCategoryModal(cat)}
                          className="p-1.5 text-text-secondary hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat._id)}
                          className="p-1.5 text-text-secondary hover:text-error transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Item Modal */}
      {itemModalOpen && (
        <Modal
          isOpen={itemModalOpen}
          onClose={() => setItemModalOpen(false)}
          title={editingItem ? 'Edit Food Item' : 'Add New Food Item'}
        >
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. Traditional Ethiopian Beyaynetu"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Category *</label>
                <select
                  required
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Price (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="250.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Prep Time (mins)</label>
                <input
                  type="number"
                  value={itemForm.preparationTime}
                  onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="15"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Image URL</label>
                <input
                  type="text"
                  value={itemForm.image}
                  onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Description</label>
              <textarea
                rows={3}
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="Ingredients, preparation style, allergen warnings..."
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={itemForm.isAvailable}
                onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                className="w-4 h-4 text-primary rounded"
              />
              <label htmlFor="isAvailable" className="text-sm font-medium text-text-primary cursor-pointer">
                In Stock & Available for Room Service
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="px-4 py-2 border border-border rounded-btn text-sm font-medium hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90"
              >
                {editingItem ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Category Modal */}
      {categoryModalOpen && (
        <Modal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          title={editingCategory ? 'Edit Food Category' : 'Add Food Category'}
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. Starters, Main Courses, Beverages..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Display Order</label>
              <input
                type="number"
                value={categoryForm.displayOrder}
                onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Description</label>
              <textarea
                rows={2}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="Category summary shown to guests"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="px-4 py-2 border border-border rounded-btn text-sm font-medium hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
