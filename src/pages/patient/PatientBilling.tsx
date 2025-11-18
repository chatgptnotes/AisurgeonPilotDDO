import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  FileText,
  IndianRupee,
  Receipt,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface Invoice {
  id: string;
  visit_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'partial';
  date: string;
  invoice_number?: string;
  description?: string;
  payment_method?: string;
  visit_type?: string;
}

const PatientBilling: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [totalThisYear, setTotalThisYear] = useState(0);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const patientId = localStorage.getItem('patient_id');

      if (!patientId) {
        toast.error('Please login to view your billing information');
        navigate('/patient-dashboard');
        return;
      }

      // Load appointments with payment information
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          visit_id,
          start_at,
          status,
          amount,
          payment_status,
          doctors(full_name, specialties)
        `)
        .eq('patient_id', patientId)
        .order('start_at', { ascending: false });

      if (appointmentsError) {
        console.error('Error loading appointments:', appointmentsError);
      }

      // Transform appointments into invoices
      const formattedInvoices: Invoice[] = (appointmentsData || []).map((apt: any, index: number) => {
        const isPaid = apt.status === 'confirmed' || apt.payment_status === 'paid';
        const isPending = apt.status === 'pending_payment' || apt.payment_status === 'pending';

        return {
          id: apt.id,
          visit_id: apt.visit_id || apt.id,
          amount: apt.amount || 0,
          status: isPaid ? 'paid' : isPending ? 'pending' : 'partial',
          date: apt.start_at,
          invoice_number: `INV-${String(index + 1).padStart(4, '0')}`,
          description: `Consultation with Dr. ${apt.doctors?.full_name || 'Doctor'}`,
          payment_method: isPaid ? 'Online Payment' : undefined,
          visit_type: apt.doctors?.specialties?.[0] || 'General Consultation'
        };
      });

      setInvoices(formattedInvoices);

      // Calculate totals
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);

      const monthTotal = formattedInvoices
        .filter(inv => {
          const invDate = new Date(inv.date);
          return inv.status === 'paid' && invDate >= monthStart && invDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      const yearTotal = formattedInvoices
        .filter(inv => {
          const invDate = new Date(inv.date);
          return inv.status === 'paid' && invDate >= yearStart && invDate <= yearEnd;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      setTotalThisMonth(monthTotal);
      setTotalThisYear(yearTotal);

    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (invoiceId: string) => {
    toast.info('Download feature coming soon');
  };

  const handlePayNow = (invoice: Invoice) => {
    toast.info('Online payment feature coming soon');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/patient-dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Billing & Payments</h1>
              <p className="text-sm text-gray-600">View invoices and payment history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-green-600 flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {totalThisMonth.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Year</p>
                  <p className="text-2xl font-bold text-blue-600 flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {totalThisYear.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invoices</p>
                  <p className="text-3xl font-bold text-purple-600">{invoices.length}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {invoices.filter(inv => inv.status === 'pending').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Invoice Cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Invoices & Receipts</h2>
            {invoices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold">No invoices yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Your billing history will appear here
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate('/doctors')}
                    >
                      Book an Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              invoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedInvoice?.id === invoice.id ? 'border-green-500 border-2' : ''
                  }`}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Receipt className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-sm text-gray-600">{invoice.description}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(invoice.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>

                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-xl font-bold text-green-600 flex items-center">
                          <IndianRupee className="h-4 w-4" />
                          {invoice.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {invoice.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayNow(invoice);
                            }}
                          >
                            Pay Now
                          </Button>
                        )}
                        {invoice.status === 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReceipt(invoice.id);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Invoice Details Panel */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            {selectedInvoice ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice Details
                  </CardTitle>
                  <CardDescription>{selectedInvoice.invoice_number}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Status</span>
                    {getStatusBadge(selectedInvoice.status)}
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Date</span>
                    <span className="font-semibold">
                      {format(new Date(selectedInvoice.date), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Description</span>
                    <span className="font-semibold text-right max-w-xs">
                      {selectedInvoice.description}
                    </span>
                  </div>

                  {selectedInvoice.visit_type && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600">Type</span>
                      <Badge variant="outline">{selectedInvoice.visit_type}</Badge>
                    </div>
                  )}

                  {selectedInvoice.payment_method && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-semibold">{selectedInvoice.payment_method}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-4 bg-green-50 rounded-lg px-4 mt-4">
                    <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                    <span className="text-2xl font-bold text-green-600 flex items-center">
                      <IndianRupee className="h-5 w-5" />
                      {selectedInvoice.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-4 space-y-2">
                    {selectedInvoice.status === 'paid' && (
                      <Button
                        className="w-full"
                        onClick={() => handleDownloadReceipt(selectedInvoice.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                    )}
                    {selectedInvoice.status === 'pending' && (
                      <Button
                        className="w-full"
                        onClick={() => handlePayNow(selectedInvoice)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/patient/medical-records?visit=${selectedInvoice.visit_id}`)}
                    >
                      View Visit Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Select an invoice to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBilling;
