import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaEye, FaUtensils } from 'react-icons/fa';
import { menuAPI } from '../services/api';
import './AdminMenu.css';

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Lunch',
    image: '',
    isAvailable: true
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await menuAPI.getAll();
      setMenuItems(response.data);
    } catch (error) {
      toast.error('Failed to load menu items');
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'Lunch',
      image: '',
      isAvailable: true
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingItem) {
        await menuAPI.update(editingItem._id, formData);
        toast.success('Menu item updated successfully');
      } else {
        await menuAPI.create(formData);
        toast.success('Menu item created successfully');
      }
      
      resetForm();
      fetchMenuItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save menu item');
      console.error('Error saving menu item:', error);
    }
  };

  const editItem = (item) => {
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      stock: item.stock.toString(),
      category: item.category,
      image: item.image,
      isAvailable: item.isAvailable
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await menuAPI.delete(id);
      toast.success('Menu item deleted successfully');
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to delete menu item');
      console.error('Error deleting menu item:', error);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await menuAPI.update(item._id, { isAvailable: !item.isAvailable });
      toast.success(`Menu item ${item.isAvailable ? 'disabled' : 'enabled'} successfully`);
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to update menu item');
      console.error('Error updating menu item:', error);
    }
  };

  const getStatusBadge = (stock, isAvailable) => {
    if (!isAvailable) {
      return <span className="badge badge-danger">Disabled</span>;
    }
    if (stock === 0) {
      return <span className="badge badge-danger">Out of Stock</span>;
    }
    if (stock <= 5) {
      return <span className="badge badge-warning">Low Stock ({stock})</span>;
    }
    return <span className="badge badge-success">In Stock ({stock})</span>;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-menu-page">
        <div className="admin-header">
          <h1 className="page-title">
            <FaUtensils /> Menu Management
          </h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <FaPlus /> Add New Item
          </button>
        </div>

        {showForm && (
          <div className="form-overlay">
            <div className="form-modal">
              <div className="form-header">
                <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                <button className="close-btn" onClick={resetForm}>×</button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Enter item name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-control"
                      rows="3"
                      placeholder="Enter item description"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Image URL</label>
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleInputChange}
                      />
                      Available for ordering
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    
        <div className="menu-items-grid">
          {menuItems.map(item => (
            <div key={item._id} className="menu-item-card">
              <div className="item-image">
                <img src={item.image || 'https://via.placeholder.com/300x200?text=Food+Item'} alt={item.name} />
                {getStatusBadge(item.stock, item.isAvailable)}
              </div>
              
              <div className="item-content">
                <div className="item-header">
                  <h3>{item.name}</h3>
                  <span className="item-category">{item.category}</span>
                </div>
                
                <p className="item-description">{item.description}</p>
                
                <div className="item-details">
                  <div className="detail-row">
                    <span className="label">Price:</span>
                    <span className="price">₹{item.price}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Stock:</span>
                    <span className="stock">{item.stock}</span>
                  </div>
                </div>

                <div className="item-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => editItem(item)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={`btn ${item.isAvailable ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => toggleAvailability(item)}
                    title={item.isAvailable ? 'Disable' : 'Enable'}
                  >
                    <FaEye />
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteItem(item._id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {menuItems.length === 0 && (
          <div className="empty-state">
            <h3>No menu items found</h3>
            <p>Start by adding your first menu item.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMenu; 