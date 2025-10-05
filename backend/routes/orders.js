const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { cancelOrder } = require('../utils/autoCancel');
const router = express.Router();


const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menuItem').isMongoId().withMessage('Invalid menu item ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('customerName').trim().isLength({ min: 1, max: 100 }).withMessage('Customer name is required'),
  body('customerPhone').trim().isLength({ min: 1 }).withMessage('Customer phone is required'),
  body('pickupTime').isISO8601().withMessage('Valid pickup time is required'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'online']).withMessage('Invalid payment method')
];


router.get('/', async (req, res) => {
  try {
    const { status, customerPhone } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (customerPhone) {
      query.customerPhone = customerPhone;
    }

    const orders = await Order.find(query)
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem', 'name price description image');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});


router.post('/', validateOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, customerName, customerPhone, pickupTime, paymentMethod, notes } = req.body;
    

    const orderItems = [];
    let totalAmount = 0;


    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      
      if (!menuItem) {
        return res.status(400).json({ error: `Menu item ${item.menuItem} not found` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({ error: `Menu item ${menuItem.name} is not available` });
      }

      if (menuItem.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.stock}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItem: item.menuItem,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        totalPrice: itemTotal
      });
    }


    const order = new Order({
      items: orderItems,
      totalAmount,
      customerName,
      customerPhone,
      pickupTime: new Date(pickupTime),
      paymentMethod: paymentMethod || 'cash',
      notes
    });

    await order.save();


    for (const item of items) {
      const result = await MenuItem.findByIdAndUpdate(
        item.menuItem,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      
      if (!result) {

        console.error(`Failed to update stock for item ${item.menuItem}`);
      }
    }


    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name price description image');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});


router.put('/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('items.menuItem', 'name price description image');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const cancelledOrder = await cancelOrder(req.params.id);
    res.json({ 
      message: 'Order cancelled successfully',
      order: cancelledOrder
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(400).json({ error: error.message });
  }
});


router.get('/number/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.menuItem', 'name price description image');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order by number:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});


router.get('/customer/:phone', async (req, res) => {
  try {
    const orders = await Order.find({ customerPhone: req.params.phone })
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

    
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['picked_up', 'ready'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      statusBreakdown: stats,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

module.exports = router; 