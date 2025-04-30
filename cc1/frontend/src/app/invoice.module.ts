import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form.component';
import { CustomerService } from './services/customer.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';

@NgModule({
  declarations: [
    InvoiceFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  exports: [
    InvoiceFormComponent
  ],
  providers: [
    CustomerService,
    ProductService,
    OrderService
  ]
})
export class InvoiceModule { }
