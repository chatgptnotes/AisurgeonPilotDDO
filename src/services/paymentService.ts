/**
 * Payment Service
 * Handles payments using Razorpay
 *
 * Setup:
 * 1. Sign up at https://razorpay.com
 * 2. Get API keys from dashboard
 * 3. Add VITE_RAZORPAY_KEY_ID and VITE_RAZORPAY_KEY_SECRET to .env
 */

import { supabase } from '@/integrations/supabase/client';
import { emailService } from './emailService';
import { whatsappService } from './whatsappService';

interface PaymentData {
  amount: number; // in rupees
  currency?: string;
  description?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  tenant_id: string;
  patient_id: string;
  appointment_id?: string;
}

interface PaymentResult {
  success: boolean;
  payment_id?: string;
  order_id?: string;
  error?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

class PaymentService {
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
    this.keySecret = import.meta.env.VITE_RAZORPAY_KEY_SECRET || '';
  }

  /**
   * Load Razorpay checkout script
   */
  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  /**
   * Create payment order
   */
  async createPaymentOrder(data: PaymentData): Promise<PaymentResult> {
    if (!this.keyId) {
      console.warn('Razorpay key ID not configured. Using demo mode.');
      // Return demo payment for development
      return this.demoPayment(data);
    }

    try {
      // In production, this should call your backend API to create Razorpay order
      // For now, we'll use frontend integration (not recommended for production)

      const options = {
        key: this.keyId,
        amount: data.amount * 100, // Razorpay expects amount in paise
        currency: data.currency || 'INR',
        name: 'AI Surgeon Pilot',
        description: data.description || 'Appointment Payment',
        prefill: {
          name: data.customer_name,
          email: data.customer_email,
          contact: data.customer_phone
        },
        theme: {
          color: '#059669'
        }
      };

      return new Promise(async (resolve) => {
        const scriptLoaded = await this.loadRazorpayScript();

        if (!scriptLoaded) {
          resolve({
            success: false,
            error: 'Failed to load Razorpay SDK'
          });
          return;
        }

        const razorpay = new window.Razorpay({
          ...options,
          handler: async (response: any) => {
            // Payment successful
            const result = await this.handlePaymentSuccess({
              ...data,
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature
            });

            resolve({
              success: true,
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id
            });
          },
          modal: {
            ondismiss: () => {
              resolve({
                success: false,
                error: 'Payment cancelled by user'
              });
            }
          }
        });

        razorpay.open();
      });
    } catch (error) {
      console.error('Payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Demo payment for development (when Razorpay keys not configured)
   */
  private async demoPayment(data: PaymentData): Promise<PaymentResult> {
    return new Promise((resolve) => {
      // Simulate payment process
      const confirmed = window.confirm(
        `Demo Payment\n\nAmount: ₹${data.amount}\nCustomer: ${data.customer_name}\n\nClick OK to simulate successful payment, Cancel to simulate failure.`
      );

      if (confirmed) {
        const demoPaymentId = 'demo_' + Date.now();
        const demoOrderId = 'order_' + Date.now();

        // Handle successful demo payment
        this.handlePaymentSuccess({
          ...data,
          payment_id: demoPaymentId,
          order_id: demoOrderId,
          signature: 'demo_signature'
        });

        resolve({
          success: true,
          payment_id: demoPaymentId,
          order_id: demoOrderId
        });
      } else {
        resolve({
          success: false,
          error: 'Payment cancelled by user'
        });
      }
    });
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(data: PaymentData & {
    payment_id: string;
    order_id: string;
    signature: string;
  }): Promise<void> {
    try {
      // Store payment transaction in database
      const { data: transaction, error } = await supabase
        .from('online_payment_transactions')
        .insert([
          {
            tenant_id: data.tenant_id,
            patient_id: data.patient_id,
            appointment_id: data.appointment_id,
            amount: data.amount,
            currency: data.currency || 'INR',
            payment_gateway: 'razorpay',
            transaction_id: data.payment_id,
            order_id: data.order_id,
            status: 'completed',
            payment_method: 'online',
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            metadata: {
              signature: data.signature,
              description: data.description
            }
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error storing payment transaction:', error);
        return;
      }

      // Send confirmation email
      await emailService.sendPaymentConfirmation({
        tenant_id: data.tenant_id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        patient_name: data.customer_name,
        patient_email: data.customer_email,
        hospital_name: 'AI Surgeon Pilot', // Should be fetched from tenant
        amount: data.amount,
        transaction_id: data.payment_id,
        payment_date: new Date().toLocaleDateString(),
        payment_method: 'Online (Razorpay)'
      });

      // Send confirmation WhatsApp
      await whatsappService.sendPaymentConfirmation({
        tenant_id: data.tenant_id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        patient_name: data.customer_name,
        patient_phone: data.customer_phone,
        hospital_name: 'AI Surgeon Pilot', // Should be fetched from tenant
        amount: data.amount,
        transaction_id: data.payment_id,
        payment_date: new Date().toLocaleDateString(),
        payment_method: 'Online (Razorpay)'
      });
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('online_payment_transactions')
        .select('*')
        .eq('transaction_id', paymentId)
        .single();

      if (error) {
        console.error('Error fetching payment details:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }

  /**
   * Get patient payment history
   */
  async getPatientPayments(patientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('online_payment_transactions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
