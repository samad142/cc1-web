const Order = require('../models/order');
const Customer = require('../models/customer');
const Product = require('../models/product');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Public
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('customer', 'name email')
      .populate('products.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('products.product');
    
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const { customer: customerId, date, products } = req.body;
    
    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(400).json({ message: 'Customer not found' });
    }
    
    // Calculate totals
    let subtotal = 0;
    
    // Process products
    const orderProducts = [];
    
    for (const item of products) {
      const { productId, name, quantity, unitPrice } = item;
      
      // If productId is provided, verify it exists
      if (productId) {
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(400).json({ message: `Product with ID ${productId} not found` });
        }
      }
      
      const total = quantity * unitPrice;
      subtotal += total;
      
      orderProducts.push({
        product: productId,
        name,
        quantity,
        unitPrice,
        total,
      });
    }
    
    const tax = subtotal * 0.2; // 20% Tax
    const grandTotal = subtotal + tax;
    
    const order = await Order.create({
      customer: customerId,
      date: date || Date.now(),
      products: orderProducts,
      subtotal,
      tax,
      grandTotal,
    });
    
    if (order) {
      res.status(201).json(order);
    } else {
      res.status(400).json({ message: 'Invalid order data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an order
// @route   PUT /api/orders/:id
// @access  Public
const updateOrder = async (req, res) => {
  try {
    const { customer: customerId, date, products } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify customer exists if provided
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(400).json({ message: 'Customer not found' });
      }
      order.customer = customerId;
    }
    
    if (date) {
      order.date = date;
    }
    
    // Update products if provided
    if (products && products.length > 0) {
      // Calculate totals
      let subtotal = 0;
      
      // Process products
      const orderProducts = [];
      
      for (const item of products) {
        const { productId, name, quantity, unitPrice } = item;
        
        // If productId is provided, verify it exists
        if (productId) {
          const product = await Product.findById(productId);
          if (!product) {
            return res.status(400).json({ message: `Product with ID ${productId} not found` });
          }
        }
        
        const total = quantity * unitPrice;
        subtotal += total;
        
        orderProducts.push({
          product: productId,
          name,
          quantity,
          unitPrice,
          total,
        });
      }
      
      const tax = subtotal * 0.2; // 20% Tax
      const grandTotal = subtotal + tax;
      
      order.products = orderProducts;
      order.subtotal = subtotal;
      order.tax = tax;
      order.grandTotal = grandTotal;
    }
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Public
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (order) {
      await order.deleteOne();
      res.json({ message: 'Order removed' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
