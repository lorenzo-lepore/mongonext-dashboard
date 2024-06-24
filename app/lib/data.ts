import { sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  FormattedCustomersTable,
} from './definitions';
import { formatCurrency } from './utils';
import { unstable_noStore as noStore } from 'next/cache';
import { resolveSoa } from 'dns';
import { ObjectId } from 'mongodb';
import { object } from 'zod';

export async function fetchRevenues() {
  noStore();

  try {
    const res = await fetch ('http://localhost:8091/revenues/all');
    const data = await res.json();

    for (const element of data) {
        element.revenue = element.amount;
        delete element.amount; 
    }

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();

  try {
    const res = await fetch('http://localhost:8091/invoices/latest');
    const data = await res.json();

    const latestInvoices = data.map((invoice: any) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));

    for (const element of latestInvoices) {
      const res2 = await fetch(`http://localhost:8091/customers/id/${element.customerId}`);
      const data2 = await res2.json();

      element.email = data2.email;    
      element.name = data2.name;
      element.image_url = data2.imageUrl;
    }

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();

  try {
    const res_1 = await fetch('http://localhost:8091/invoices/numberOfInvoices');
    const data_1 = await res_1.json();

    const res_2 = await fetch('http://localhost:8091/customers/numberOfCustomers');
    const data_2 = await res_2.json();
    
    const res_3 = await fetch('http://localhost:8091/invoices/sumOfPaidInvoices');
    const data_3 = await res_3.json();

    const res_4 = await fetch('http://localhost:8091/invoices/sumOfPendingInvoices');
    const data_4 = await res_4.json();

    const numberOfInvoices = parseInt(data_1);
    const numberOfCustomers = parseInt(data_2);
    const totalPaidInvoices = formatCurrency(parseInt(data_3));
    const totalPendingInvoices = formatCurrency(parseInt(data_4));

    return{
      numberOfInvoices,
      numberOfCustomers,
      totalPaidInvoices,
      totalPendingInvoices
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  noStore();

  try {
    const res = await fetch(`http://localhost:8091/invoices/getFilteredInvoices?query=${query}&currentPage=${currentPage}`);
    const invoices = await res.json();

    for (const element of invoices) {  
      element.name = element.customer[0].name;
      element.email = element.customer[0].email;
      element.image_url = element.customer[0].imageUrl;

      delete element.customer;
    }
    
    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  noStore();
  
  try {
    const res = await fetch(`http://localhost:8091/customers/numberOfPages?query=${query}`);
    const data = await res.json();

    const numberOfInvoices = parseInt(data);
    const totalPages = Math.ceil(numberOfInvoices / ITEMS_PER_PAGE);
    
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}
export async function fetchInvoiceById(id: string) {
  noStore();

  try {
    const res = await fetch(`http://localhost:8091/invoices/${id}`);    
    const data = await res.json();

    const invoice: InvoiceForm = {
      id: data.id,
      customer_id: data.customerId,
      amount: data.amount / 100,
      status: data.status,
    };

    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  noStore();

  try {
    const res = await fetch('http://localhost:8091/customers/all');
    const customers = await res.json();

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore();

  try {
    const res = await fetch(`http://localhost:8091/customers/getFilteredAggregation?query=${query}`);
    const data = await res.json();

    const customers: FormattedCustomersTable[] = data.map((customer: any) => ({
      ...customer,
      id: customer._id,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  try {
    const data = await fetch(`http://localhost:8091/users/${email}`);
    const user = await data.json();

    return user as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
