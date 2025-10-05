import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaHistory, FaCog } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1> Canteen Ordering</h1>
          </Link>
          
          <nav className="nav">
            <Link 
              to="/menu" 
              className={`nav-link ${isActive('/menu') || isActive('/') ? 'active' : ''}`}
            >
              Menu
            </Link>
            <Link 
              to="/order" 
              className={`nav-link ${isActive('/order') ? 'active' : ''}`}
            >
              <FaShoppingCart /> Order
            </Link>
            <Link 
              to="/order-history" 
              className={`nav-link ${isActive('/order-history') ? 'active' : ''}`}
            >
              <FaHistory /> History
            </Link>
            <div className="nav-dropdown">
              <button className="nav-link dropdown-toggle">
                <FaCog /> Admin
              </button>
              <div className="dropdown-menu">
                <Link to="/admin/menu" className="dropdown-item">Manage Menu</Link>
                <Link to="/admin/orders" className="dropdown-item">Manage Orders</Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 