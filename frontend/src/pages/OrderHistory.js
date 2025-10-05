import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPhone, FaSearch, FaEye, FaHistory } from 'react-icons/fa';
import { ordersAPI } from '../services/api';
import './OrderHistory.css';

const OrderHistory = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const searchOrders = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await ordersAPI.getByCustomer(phoneNumber.trim());
      setOrders(response.data);
      setSearched(true);
      
      if (response.data.length === 0) {
        toast.info('No orders found for this phone number');
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready';
      case 'picked_up':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const viewOrder = (orderNumber) => {
    navigate(`/order-status/${orderNumber}`);
  };

  const getTotalItems = (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="container">
      <div className="order-history-page">
        <div className="history-header">
          <h1 className="page-title">
            <FaHistory /> Order History
          </h1>
          <p>Enter your phone number to view your order history</p>
        </div>

        <div className="search-section">
          <form onSubmit={searchOrders} className="search-form">
            <div className="form-group">
              <label className="form-label">
                <FaPhone /> Phone Number
              </label>
              <div className="search-input-group">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="form-control"
                  placeholder="Enter your phone number"
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary search-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner-small"></div>
                  ) : (
                    <>
                      <FaSearch /> Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {searched && (
          <div className="results-section">
            {orders.length > 0 ? (
              <>
                <h2>Found {orders.length} order(s)</h2>
                <div className="orders-grid">
                  {orders.map(order => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <div className="order-number">
                          <strong>#{order.orderNumber}</strong>
                        </div>
                        <span className={getStatusBadge(order.status)}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      
                      <div className="order-info">
                        <div className="info-row">
                          <label>Date:</label>
                          <span>{formatDateTime(order.orderTime)}</span>
                        </div>
                        <div className="info-row">
                          <label>Items:</label>
                          <span>{getTotalItems(order.items)} items</span>
                        </div>
                        <div className="info-row">
                          <label>Total:</label>
                          <span className="total-amount">₹{order.totalAmount}</span>
                        </div>
                        <div className="info-row">
                          <label>Pickup:</label>
                          <span>{formatDateTime(order.pickupTime)}</span>
                        </div>
                      </div>

                      <div className="order-items-preview">
                        <label>Items:</label>
                        <div className="items-list">
                          {order.items.slice(0, 3).map((item, index) => (
                            <span key={index} className="item-tag">
                              {item.name} × {item.quantity}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="item-tag more">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="order-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => viewOrder(order.orderNumber)}
                        >
                          <FaEye /> View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>No orders found</h3>
                <p>No orders were found for the phone number: {phoneNumber}</p>
                <p>Please check the phone number and try again.</p>
              </div>
            )}
          </div>
        )}

        
        {!searched && (
          <div className="instructions">
            <div className="instruction-card">
              <h3>How to view your order history</h3>
              <ol>
                <li>Enter the phone number you used when placing your orders</li>
                <li>Click the "Search" button to find your orders</li>
                <li>View details of any order by clicking "View Details"</li>
                <li>You can track the status of your current orders</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory; 