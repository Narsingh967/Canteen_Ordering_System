import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaEye, FaCheckCircle, FaTimesCircle, FaSpinner, FaChartBar, FaList } from 'react-icons/fa';
import { ordersAPI } from '../services/api';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus) {
        params.status = selectedStatus;
      }
      const response = await ordersAPI.getAll(params);
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ordersAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update order status');
      console.error('Error updating order status:', error);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await ordersAPI.cancel(orderId);
      toast.success('Order cancelled successfully');
      fetchOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to cancel order');
      console.error('Error cancelling order:', error);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
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

  const getTotalItems = (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': 'picked_up'
    };
    return statusFlow[currentStatus];
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
      <div className="admin-orders-page">
        <div className="admin-header">
          <h1 className="page-title">
            <FaList /> Order Management
          </h1>
          <div className="header-actions">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-control status-filter"
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="picked_up">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="stats-section">
            <h2>
              <FaChartBar /> Order Statistics
            </h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalOrders}</div>
                <div className="stat-label">Total Orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">₹{stats.totalRevenue}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              {stats.statusBreakdown.map(stat => (
                <div key={stat._id} className="stat-card">
                  <div className="stat-number">{stat.count}</div>
                  <div className="stat-label">{getStatusText(stat._id)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="orders-section">
          <h2>Orders ({orders.length})</h2>
          <div className="orders-table">
            <div className="table-header">
              <div className="header-cell">Order #</div>
              <div className="header-cell">Customer</div>
              <div className="header-cell">Items</div>
              <div className="header-cell">Total</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Order Time</div>
              <div className="header-cell">Actions</div>
            </div>
            
            <div className="table-body">
              {orders.map(order => (
                <div key={order._id} className="table-row">
                  <div className="table-cell order-number">
                    <strong>{order.orderNumber}</strong>
                  </div>
                  <div className="table-cell customer-info">
                    <div className="customer-name">{order.customerName}</div>
                    <div className="customer-phone">{order.customerPhone}</div>
                  </div>
                  <div className="table-cell items-count">
                    {getTotalItems(order.items)} items
                  </div>
                  <div className="table-cell total-amount">
                    ₹{order.totalAmount}
                  </div>
                  <div className="table-cell status">
                    <span className={getStatusBadge(order.status)}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="table-cell order-time">
                    {formatDateTime(order.orderTime)}
                  </div>
                  <div className="table-cell actions">
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => viewOrderDetails(order)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      
                      {['pending', 'confirmed', 'preparing', 'ready'].includes(order.status) && (
                        <>
                          {getNextStatus(order.status) && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                              title={`Mark as ${getStatusText(getNextStatus(order.status))}`}
                            >
                              <FaCheckCircle />
                            </button>
                          )}
                          
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => cancelOrder(order._id)}
                            title="Cancel Order"
                          >
                            <FaTimesCircle />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {orders.length === 0 && (
            <div className="empty-state">
              <h3>No orders found</h3>
              <p>No orders match the current filter criteria.</p>
            </div>
          )}
        </div>

        {showOrderDetails && selectedOrder && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Order Details - {selectedOrder.orderNumber}</h2>
                <button className="close-btn" onClick={() => setShowOrderDetails(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="order-details-grid">
                  <div className="detail-section">
                    <h3>Customer Information</h3>
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedOrder.customerName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{selectedOrder.customerPhone}</span>
                    </div>
                    <div className="detail-item">
                      <label>Order Time:</label>
                      <span>{formatDateTime(selectedOrder.orderTime)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Pickup Time:</label>
                      <span>{formatDateTime(selectedOrder.pickupTime)}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Order Information</h3>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={getStatusBadge(selectedOrder.status)}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Payment Method:</label>
                      <span className="capitalize">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="detail-item">
                      <label>Payment Status:</label>
                      <span className={`badge ${selectedOrder.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Total Amount:</label>
                      <span className="total-amount">₹{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="order-items-section">
                  <h3>Order Items</h3>
                  <div className="items-list">
                    {selectedOrder.items.map((item, index) => (
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
                </div>

                {selectedOrder.notes && (
                  <div className="order-notes">
                    <h3>Special Instructions</h3>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders; 