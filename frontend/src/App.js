import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Menu from './pages/Menu';
import OrderPage from './pages/OrderPage';
import OrderHistory from './pages/OrderHistory';
import OrderStatus from './pages/OrderStatus';
import AdminMenu from './pages/AdminMenu';
import AdminOrders from './pages/AdminOrders';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/order-status/:orderNumber" element={<OrderStatus />} />
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Routes>
      </main>
    </div>
  );
}

export default App; 