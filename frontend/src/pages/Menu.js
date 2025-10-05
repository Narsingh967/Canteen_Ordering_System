import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaClock, FaUtensils } from 'react-icons/fa';
import { menuAPI } from '../services/api';
import './Menu.css';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const params = { available: 'true' };
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      const response = await menuAPI.getAll(params);
      setMenuItems(response.data);
    } catch (error) {
      toast.error('Failed to load menu items');
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await menuAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory]);

  const addToCart = (item) => {
    if (item.stock === 0) {
      toast.warning(`${item.name} is out of stock`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id);
      
      if (existingItem) {
        if (existingItem.quantity >= item.stock) {
          toast.warning(`Maximum available quantity for ${item.name} is ${item.stock}`);
          return prevCart;
        }
        
        return prevCart.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== itemId));
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const item = menuItems.find(menuItem => menuItem._id === itemId);
    if (newQuantity > item.stock) {
      toast.warning(`Maximum available quantity for ${item.name} is ${item.stock}`);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const proceedToOrder = () => {
    if (cart.length === 0) {
      toast.warning('Please add items to cart first');
      return;
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/order');
  };

  const getStatusBadge = (stock) => {
    if (stock === 0) {
      return <span className="badge badge-danger">Out of Stock</span>;
    } else if (stock <= 5) {
      return <span className="badge badge-warning">Low Stock ({stock})</span>;
    } else {
      return <span className="badge badge-success">In Stock ({stock})</span>;
    }
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
      <h1 className="page-title">🍽️ Our Menu</h1>
      
      <div className="category-filter">
        <button
          className={`category-btn ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('')}
        >
          All Categories
        </button>
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {menuItems.map(item => (
          <div key={item._id} className="menu-card">
            <div className="menu-card-image">
              <img src={item.image} alt={item.name} />
              {getStatusBadge(item.stock)}
            </div>
            <div className="menu-card-content">
              <h3 className="menu-item-name">{item.name}</h3>
              <p className="menu-item-description">{item.description}</p>
              <div className="menu-item-details">
                <span className="menu-item-price">₹{item.price}</span>
                <span className="menu-item-category">
                  <FaUtensils /> {item.category}
                </span>
              </div>
              <button
                className={`btn btn-primary add-to-cart-btn ${item.stock === 0 ? 'disabled' : ''}`}
                onClick={() => addToCart(item)}
                disabled={item.stock === 0}
              >
                <FaShoppingCart />
                {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
        
      {cart.length > 0 && (
        <div className="cart-summary">
          <div className="cart-header">
            <h3>🛒 Cart ({getTotalItems()} items)</h3>
            <button className="btn btn-secondary" onClick={() => setCart([])}>
              Clear Cart
            </button>
          </div>
          
          <div className="cart-items">
            {cart.map(item => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
                </div>
                <div className="cart-item-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => updateCartQuantity(item._id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    +
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => removeFromCart(item._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-footer">
            <div className="cart-total">
              <strong>Total: ₹{getTotalAmount()}</strong>
            </div>
            <button className="btn btn-success" onClick={proceedToOrder}>
              <FaClock /> Proceed to Order
            </button>
          </div>
        </div>
      )}

      {menuItems.length === 0 && (
        <div className="empty-state">
          <h3>No menu items found</h3>
          <p>Try selecting a different category or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default Menu; 