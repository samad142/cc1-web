const Customer = require('../models/customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Public
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Public
const createCustomer = async (req, res) => {
  try {
    const { name, age, email } = req.body;
    
    const customerExists = await Customer.findOne({ email });
    
    if (customerExists) {
      return res.status(400).json({ message: 'Customer already exists' });
    }
    
    const customer = await Customer.create({
      name,
      age,
      email,
    });
    
    if (customer) {
      res.status(201).json(customer);
    } else {
      res.status(400).json({ message: 'Invalid customer data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
  try {
    const { name, age, email } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    
    if (customer) {
      customer.name = name || customer.name;
      customer.age = age || customer.age;
      customer.email = email || customer.email;
      
      const updatedCustomer = await customer.save();
      res.json(updatedCustomer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (customer) {
      await customer.deleteOne();
      res.json({ message: 'Customer removed' });
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
