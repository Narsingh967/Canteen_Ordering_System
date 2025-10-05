import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaPrint } from 'react-icons/fa';
import { ordersAPI } from '../services/api';
import './OrderStatus.css';

const OrderStatus = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 30000); 
    return () => clearInterval(interval);
  }, [orderNumber]);

  useEffect(() => {
    if (order) {
      const expiresAt = new Date(order.expiresAt);
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
    }
  }, [order]);

  useEffect(() => {
    if (timeLeft <= 0 && order && ['pending', 'confirmed'].includes(order.status)) {
      toast.error('Order has expired!');
    }
  }, [timeLeft, order]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getByNumber(orderNumber);
      setOrder(response.data);
    } catch (error) {
      toast.error('Order not found');
      navigate('/menu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'confirmed':
        return <FaCheckCircle className="status-icon confirmed" />;
      case 'preparing':
        return <FaSpinner className="status-icon preparing" />;
      case 'ready':
        return <FaCheckCircle className="status-icon ready" />;
      case 'picked_up':
        return <FaCheckCircle className="status-icon picked-up" />;
      case 'cancelled':
      case 'expired':
        return <FaTimesCircle className="status-icon cancelled" />;
      default:
        return <FaClock className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Order Pending';
      case 'confirmed':
        return 'Order Confirmed';
      case 'preparing':
        return 'Preparing Your Order';
      case 'ready':
        return 'Ready for Pickup';
      case 'picked_up':
        return 'Order Completed';
      case 'cancelled':
        return 'Order Cancelled';
      case 'expired':
        return 'Order Expired';
      default:
        return status;
    }
  };

  const getStatusBadge = (status) => {
    const baseClass = 'badge';
    switch (status) {
      case 'pending':
        return `${baseClass} badge-warning`;
      case 'confirmed':
        return `${baseClass} badge-info`;
      case 'preparing':
        return `${baseClass} badge-info`;
      case 'ready':
        return `${baseClass} badge-success`;
      case 'picked_up':
        return `${baseClass} badge-success`;
      case 'cancelled':
      case 'expired':
        return `${baseClass} badge-danger`;
      default:
        return baseClass;
    }
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const printOrder = () => {
    window.print();
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

  if (!order) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Order not found</h3>
          <p>The order you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="order-status-page">
        <div className="order-status-header">
          <h1 className="page-title"> Order Status</h1>
          <div className="order-number">
            <strong>Order #: {order.orderNumber}</strong>
          </div>
        </div>

        <div className="status-card">
          <div className="status-header">
            {getStatusIcon(order.status)}
            <div className="status-info">
              <h2 className={getStatusBadge(order.status)}>
                {getStatusText(order.status)}
              </h2>
              <p className="status-description">
                {order.status === 'pending' && 'Your order has been received and is being processed.'}
                {order.status === 'confirmed' && 'Your order has been confirmed and will be prepared soon.'}
                {order.status === 'preparing' && 'Your order is being prepared in the kitchen.'}
                {order.status === 'ready' && 'Your order is ready for pickup!'}
                {order.status === 'picked_up' && 'Thank you for your order!'}
                {order.status === 'cancelled' && 'Your order has been cancelled.'}
                {order.status === 'expired' && 'Your order has expired due to non-payment or non-pickup.'}
              </p>
            </div>
          </div>

          {['pending', 'confirmed'].includes(order.status) && timeLeft > 0 && (
            <div className={`countdown-timer ${timeLeft <= 300 ? 'warning' : ''}`}>
              <FaClock />
              <span>Time Remaining: {formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        <div className="order-details">
          <h3>Order Details</h3>
          
          <div className="details-grid">
            <div className="detail-item">
              <label>Customer Name:</label>
              <span>{order.customerName}</span>
            </div>
            <div className="detail-item">
              <label>Phone Number:</label>
              <span>{order.customerPhone}</span>
            </div>
            <div className="detail-item">
              <label>Order Time:</label>
              <span>{formatDateTime(order.orderTime)}</span>
            </div>
            <div className="detail-item">
              <label>Pickup Time:</label>
              <span>{formatDateTime(order.pickupTime)}</span>
            </div>
            <div className="detail-item">
              <label>Payment Method:</label>
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
            <div className="detail-item">
              <label>Payment Status:</label>
              <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {order.notes && (
            <div className="order-notes">
              <label>Special Instructions:</label>
              <p>{order.notes}</p>
            </div>
          )}
        </div>

        <div className="order-items-section">
          <h3>Order Items</h3>
          <div className="order-items-list">
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>₹{item.price} × {item.quantity}</p>
                </div>
                <div className="item-total">
                  ₹{item.totalPrice}
                </div>
              </div>
            ))}
          </div>
          <div className="order-total">
            <strong>Total Amount: ₹{order.totalAmount}</strong>
          </div>
        </div>

        <div className="order-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/menu')}>
            Back to Menu
          </button>
          <button className="btn btn-primary" onClick={printOrder}>
            <FaPrint /> Print Order
          </button>
          <button className="btn btn-success" onClick={() => navigate('/order-history')}>
            View Order History
          </button>
        </div>

              
        {['pending', 'confirmed'].includes(order.status) && (
          <div className="order-notice">
            <div className="notice-content">
              <h3>⚠️ Important Reminder</h3>
              <ul>
                <li>Please complete payment and pickup within 15 minutes</li>
                <li>Orders are automatically cancelled if not completed on time</li>
                <li>Keep this order number for reference</li>
                <li>Contact the canteen if you have any questions</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatus; 