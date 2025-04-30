import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService, Customer } from '../../services/customer.service';
import { ProductService, Product } from '../../services/product.service';
import { OrderService, Order, OrderItem } from '../../services/order.service';

// Declaration for accessing libraries loaded via CDN
declare const jspdf: any;
declare const html2canvas: any;
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  form: FormGroup;
  customers: Customer[] = [];
  products: Product[] = [];
  loading = false;
  submitted = false;
  success = false;
  error = '';
  invoiceNumber: string = 'INV-' + Math.floor(Math.random() * 10000);
  selectedCustomer: Customer | null = null;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private productService: ProductService,
    private orderService: OrderService
  ) {
    // Format current date as YYYY-MM-DD for date input
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    this.form = this.fb.group({
      customer: ['', Validators.required],
      date: [formattedDate, Validators.required],
      products: this.fb.array([this.createProduct()])
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.error = 'Error loading customers';
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Error loading products';
      }
    });
  }

  get productsArray(): FormArray {
    return this.form.get('products') as FormArray;
  }

  createProduct(): FormGroup {
    return this.fb.group({
      product: ['', Validators.required],
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      total: [{ value: 0, disabled: true }]
    });
  }

  addProduct() {
    this.productsArray.push(this.createProduct());
  }

  removeProduct(index: number) {
    this.productsArray.removeAt(index);
  }
  
  onProductSelect(index: number): void {
    const productControl = this.productsArray.at(index).get('product');
    const nameControl = this.productsArray.at(index).get('name');
    const priceControl = this.productsArray.at(index).get('unitPrice');
    
    if (productControl && productControl.value) {
      const selectedProduct = this.products.find(p => p._id === productControl.value);
      if (selectedProduct) {
        nameControl?.setValue(selectedProduct.name);
        priceControl?.setValue(selectedProduct.unitPrice);
        this.calculateTotal(index);
      }
    }
  }

  calculateTotal(index: number) {
    const product = this.productsArray.at(index);
    const q = product.get('quantity')?.value || 0;
    const p = product.get('unitPrice')?.value || 0;
    const t = Number((q * p).toFixed(2)); // Round to 2 decimals
    product.get('total')?.setValue(t);
  }

  getSubtotal(): number {
    const total = this.productsArray.controls.reduce((acc, cur) => {
      return acc + (cur.get('total')?.value || 0);
    }, 0);
    return Number(total.toFixed(2)); // Round to 2 decimals
  }

  getTax(): number {
    return Number((this.getSubtotal() * 0.20).toFixed(2)); // Round to 2 decimals
  }

  getGrandTotal(): number {
    return Number((this.getSubtotal() + this.getTax()).toFixed(2)); // Round to 2 decimals
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p._id === productId);
    return product ? product.name : 'Unknown Product';
  }
  
  // Generate PDF invoice
  generatePDF(): void {
    if (this.form.invalid) {
      this.submitted = true;
      this.error = 'Please fill out the form correctly before generating PDF';
      return;
    }
    
    const formData = this.form.getRawValue();
    
    // Find selected customer name
    const customer = this.customers.find(c => c._id === formData.customer);
    const customerName = customer ? customer.name : 'Unknown Customer';
    
    // Create new jsPDF instance
    // @ts-ignore - Access to library loaded via CDN
    const { jsPDF } = window['jspdf'];
    // @ts-ignore
    const doc = new jsPDF();
    
    // Define main colors
    const primaryColor = [63, 81, 181]; // Indigo
    const secondaryColor = [33, 33, 33]; // Dark gray
    const accentColor = [76, 175, 80]; // Green
    
    // Add colored background at top
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Space for logo if needed
    
    // Add header
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', 105, 25, { align: 'center' });
    
    // Space for company information
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    
    // Add frame for customer information
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(249, 249, 249);
    doc.roundedRect(15, 50, 180, 40, 3, 3, 'FD');
    
    // Add customer information
    doc.setFontSize(12);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION', 25, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Customer: ${customerName}`, 25, 70);
    doc.text(`Date: ${new Date(formData.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, 25, 80);
    
    // Space for other information if needed
    
    // Prepare data for table
    const tableColumn = ['Product', 'Quantity', 'Unit Price', 'Total'];
    const tableRows: any[] = [];
    
    // Add products to table
    formData.products.forEach((product: any) => {
      const productData = this.products.find(p => p._id === product.product);
      const productName = productData ? productData.name : 'Unknown Product';
      const total = Number((product.quantity * product.unitPrice).toFixed(2));
      
      tableRows.push([productName, product.quantity, product.unitPrice.toFixed(2) + ' $', total.toFixed(2) + ' $']);
    });
    
    // Add table with improved style
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 100,
      theme: 'grid',
      styles: { 
        fontSize: 10,
        cellPadding: 6,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center' 
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        3: { halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249]
      }
    });
    
    // Calculate Y position after table
    const finalY = (doc as any).lastAutoTable?.finalY + 10 || 150;
    
    // Add frame for totals summary
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(249, 249, 249);
    doc.roundedRect(110, finalY, 85, 40, 3, 3, 'FD');
    
    // Add totals summary
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(10);
    doc.text('Subtotal:', 120, finalY + 10);
    doc.text('Tax (20%):', 120, finalY + 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL:', 120, finalY + 32);
    
    // Add amounts aligned to right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${this.getSubtotal().toFixed(2)} $`, 185, finalY + 10, { align: 'right' });
    doc.text(`${this.getTax().toFixed(2)} $`, 185, finalY + 20, { align: 'right' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`${this.getGrandTotal().toFixed(2)} $`, 185, finalY + 32, { align: 'right' });
    
    // Add separator line before grand total
    doc.setDrawColor(180, 180, 180);
    doc.line(120, finalY + 25, 185, finalY + 25);
    
    // Space for other information if needed
    const legalY = finalY + 60;
    
    // Add footer
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 280, 210, 17, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 105, 290, { align: 'center' });
    
    // Download PDF
    doc.save(`Invoice_${customerName}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  onSubmit(): void {
    this.submitted = true;
    console.log('Form submitted', this.form.value);
    
    if (this.form.invalid) {
      console.error('Form is invalid', this.form.errors);
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    const formData = this.form.getRawValue();
    console.log('Form data:', formData);
    
    // Check if customer is selected
    if (!formData.customer) {
      this.error = 'Please select a customer';
      this.loading = false;
      return;
    }
    
    // Check if products are valid
    if (!formData.products || formData.products.length === 0) {
      this.error = 'Please add at least one product';
      this.loading = false;
      return;
    }
    
    try {
      // Simplify structure to match exactly what backend expects
      // Backend expects: { customer, date, products: [{ productId, name, quantity, unitPrice }] }
      const simplifiedProducts = [];
      
      for (const p of formData.products) {
        // Check if product is valid
        if (!p.product || !p.name || !p.quantity || !p.unitPrice) {
          continue; // Skip incomplete products
        }
        
        simplifiedProducts.push({
          productId: p.product,
          name: p.name,
          quantity: Number(p.quantity),
          unitPrice: Number(p.unitPrice)
          // Don't include total, backend will calculate it
        });
      }
      
      // Check if there's at least one valid product
      if (simplifiedProducts.length === 0) {
        this.error = 'No valid products in the order';
        this.loading = false;
        return;
      }
      
      // Calculate totals (even if we don't send them, keep for interface compatibility)
      const subtotal = this.getSubtotal();
      const tax = this.getTax();
      const grandTotal = this.getGrandTotal();
      
      // Format date (use current date if not specified)
      const orderDate = formData.date ? new Date(formData.date) : new Date();
      
      // Create object that matches Order interface and backend expectations
      const orderData: Order = {
        customer: formData.customer,
        date: orderDate,
        products: simplifiedProducts as any, // Cast for interface compatibility
        subtotal: subtotal,
        tax: tax,
        grandTotal: grandTotal
      };
      
      console.log('Order to send:', JSON.stringify(orderData, null, 2));
      
      // Send order to server
      this.orderService.createOrder(orderData).subscribe({
        next: (data) => {
          this.loading = false;
          this.success = true;
          console.log('Order created successfully:', data);
          
          // Reset form after successful submission
          setTimeout(() => {
            // Reset form with today's date
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            
            this.form.reset({
              customer: '',
              date: formattedDate
            });
            
            // Reset products
            this.productsArray.clear();
            this.addProduct();
            
            this.submitted = false;
            this.success = false;
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating order:', error);
          this.error = 'Error creating order: ' + (error.message || 'Check that the backend server is running');
        }
      });
    } catch (error: any) {
      this.loading = false;
      console.error('Error preparing order:', error);
      this.error = 'Error preparing order: ' + (error.message || 'Unknown error');
    }
  }
}
