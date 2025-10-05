const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

const autoCancelOrders = async () => {
  try {
    const expiredOrders = await Order.find({
      status: { $in: ['pending', 'confirmed'] },
      expiresAt: { $lt: new Date() }
    });

    console.log(`Found ${expiredOrders.length} expired orders to cancel`);

    for (const order of expiredOrders) {
      await Order.findByIdAndUpdate(
        order._id,
        { 
          status: 'expired',
          updatedAt: new Date()
        }
      );

      for (const item of order.items) {
        await MenuItem.findByIdAndUpdate(
          item.menuItem,
          { 
            $inc: { stock: item.quantity }
          }
        );
      }

      console.log(`Cancelled order ${order.orderNumber} and restored stock`);
    }
  } catch (error) {
    console.error('Error in auto-cancellation:', error);
    throw error;
  }
};

    
const cancelOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'cancelled' || order.status === 'expired') {
      throw new Error('Order is already cancelled or expired');
    }

    await Order.findByIdAndUpdate(
      orderId,
      { 
        status: 'cancelled',
        updatedAt: new Date()
      }
    );

    for (const item of order.items) {
      await MenuItem.findByIdAndUpdate(
        item.menuItem,
        { 
          $inc: { stock: item.quantity }
        }
      );
    }

    return order;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

module.exports = {
  autoCancelOrders,
  cancelOrder
}; 