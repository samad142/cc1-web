import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from './customer.service';
import { Product } from './product.service';

const API_URL = 'http://localhost:5000/api';

export interface OrderItem {
  product?: string | Product; // Optional for compatibility with existing interface
  productId?: string;        // Used by backend
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  _id?: string;
  customer: string | Customer;
  date: Date;
  products: OrderItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient) { }

  // Get all orders
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_URL}/orders`);
  }

  // Get order by ID
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${API_URL}/orders/${id}`);
  }

  // Create new order
  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(`${API_URL}/orders`, order);
  }

  // Update order
  updateOrder(id: string, order: Order): Observable<Order> {
    return this.http.put<Order>(`${API_URL}/orders/${id}`, order);
  }

  // Delete order
  deleteOrder(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/orders/${id}`);
  }
}
