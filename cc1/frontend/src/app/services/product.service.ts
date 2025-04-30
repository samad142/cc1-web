import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:5000/api';

export interface Product {
  _id?: string;
  name: string;
  unitPrice: number;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private http: HttpClient) { }

  // Get all products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_URL}/products`);
  }

  // Get product by ID
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${API_URL}/products/${id}`);
  }

  // Create new product
  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${API_URL}/products`, product);
  }

  // Update product
  updateProduct(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${API_URL}/products/${id}`, product);
  }

  // Delete product
  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/products/${id}`);
  }
}
