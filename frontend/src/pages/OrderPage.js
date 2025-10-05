import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaClock, FaUser, FaPhone, FaCreditCard, FaCalendar } from 'react-icons/fa';
import { ordersAPI } from '../services/api';
import './OrderPage.css';

const OrderPage = () => {
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupTime: '',
    paymentMethod: 'cash',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const navigate = useNavigate();

  useEffect(() => {
      const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      toast.error('No items in cart. Please add items from the menu.');
      navigate('/menu');
    }

    const defaultPickupTime = new Date(Date.now() + 30 * 60 * 1000);
    setFormData(prev => ({
      ...prev,
      pickupTime: defaultPickupTime.toISOString().slice(0, 16)
    }));
  }, [navigate]);

  useEffect(() => {
    if (timeLeft <= 0) {
      toast.error('Order session expired. Please start a new order.');
      navigate('/menu');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!formData.customerPhone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!formData.pickupTime) {
      toast.error('Please select pickup time');
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          menuItem: item._id,
          quantity: item.quantity
        })),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        pickupTime: formData.pickupTime,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      };

      const response = await ordersAPI.create(orderData);
      
      localStorage.removeItem('cart');
      
      toast.success('Order placed successfully!');
      
      navigate(`/order-status/${response.data.orderNumber}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place order');
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (cart.length === 0) {
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
      <div className="order-page">
        <div className="order-header">
          <h1 className="page-title">📋 Place Your Order</h1>
          <div className={`countdown-timer ${timeLeft <= 300 ? 'warning' : ''}`}>
            <FaClock />
            <span>Time Remaining: {formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="order-content">
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="order-items">
              {cart.map(item => (
                <div key={item._id} className="order-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p className="item-price">₹{item.price} × {item.quantity}</p>
                  </div>
                  <div className="item-total">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
            <div className="order-total">
              <strong>Total ({getTotalItems()} items): ₹{getTotalAmount()}</strong>
            </div>
          </div>

          <div className="customer-form">
            <h2>Customer Details</h2>
            <form onSubmit={(e) => { e.preventDefault(); placeOrder(); }}>
              <div className="form-group">
                <label className="form-label">
                  <FaUser /> Full Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaPhone /> Phone Number *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaCalendar /> Pickup Time *
                </label>
                <input
                  type="datetime-local"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaCreditCard /> Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="cash">Cash on Pickup</option>
                  <option value="card">Card Payment</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Special Instructions</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                  placeholder="Any special instructions or dietary requirements..."
                />
              </div>

              <div className="order-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/menu')}
                  disabled={loading}
                >
                  Back to Menu
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading || timeLeft <= 0}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
              
        <div className="order-notice">
          <div className="notice-content">
            <h3>⚠️ Important Notice</h3>
            <ul>
              <li>Orders will be automatically cancelled if not paid or picked up within 15 minutes</li>
              <li>Stock is locked when you place your order</li>
              <li>Please ensure your contact details are correct</li>
              <li>You will receive an order number for tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage; 