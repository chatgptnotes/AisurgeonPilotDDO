import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Phone, Mail, MapPin, Clock, Users, Zap, Shield, TrendingUp, BarChart, Calendar, FileText, MessageSquare, Video, Brain, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
}

const LandingPage = ({ onGetStarted, onLoginClick }: LandingPageProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    practice_name: '',
    specialty: '',
    message: '',
    interested_in: 'professional'
  });
  const [submitting, setSubmitting] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_form_submissions')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Thank you for your interest!',
        description: 'Our team will contact you within 24 hours.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        practice_name: '',
        specialty: '',
        message: '',
        interested_in: 'professional'
      });
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-blue-900">AI Surgeon Pilot</div>
              <div className="hidden md:flex items-center gap-2 text-sm text-blue-800">
                <span className="px-3 py-1 bg-blue-100 rounded-full font-medium">
                  Powered by Bettroi
                </span>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-blue-600 font-medium">Features</button>
              <button onClick={() => scrollToSection('roadmap')} className="text-gray-700 hover:text-blue-600 font-medium">Roadmap</button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-700 hover:text-blue-600 font-medium">Pricing</button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-blue-600 font-medium">Contact</button>
              <Button
                onClick={() => window.location.href = '/login'}
                variant="outline"
                size="sm"
              >
                Login
              </Button>
            </div>
            <Button
              onClick={() => window.location.href = '/login'}
              variant="outline"
              size="sm"
              className="lg:hidden"
            >
              Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6">
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                Transform Your Surgical Practice with AI
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              AI Surgeon Pilot
            </h1>
            <p className="text-2xl md:text-3xl text-gray-700 mb-8 font-light">
              Your AI-Powered Digital Office – Empowering Surgeons with Intelligent Automation
            </p>
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your surgical practice with AI agents that handle patient communication,
              create educational content, automate WhatsApp messaging, and manage appointments –
              so you can focus on what matters most: your patients' care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => scrollToSection('contact')} size="lg" className="text-lg px-8 py-6">
                Get Started Free
              </Button>
              <Button onClick={() => scrollToSection('features')} size="lg" variant="outline" className="text-lg px-8 py-6">
                Explore Features
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-blue-600">1000+</div>
                <div className="text-gray-600 mt-2">Surgeons</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600">60%</div>
                <div className="text-gray-600 mt-2">Reduced No-Shows</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600">10+</div>
                <div className="text-gray-600 mt-2">Hours Saved/Week</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Comprehensive Features for Modern Surgical Practices
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to automate patient engagement and streamline your practice
            </p>
          </div>

          {/* Current Features */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Currently Available</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-blue-100">
                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">WhatsApp Automation</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Automated patient messaging for appointment reminders, follow-ups, and educational content delivery via WhatsApp
                </p>
                <div className="flex items-center text-green-600 text-sm font-semibold">
                  <Check className="w-4 h-4 mr-2" /> Live Now
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-purple-100">
                <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Patient Education Library</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Comprehensive library of educational videos, articles, and PDFs. Create, manage, and share custom content
                </p>
                <div className="flex items-center text-green-600 text-sm font-semibold">
                  <Check className="w-4 h-4 mr-2" /> Live Now
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-green-100">
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Patient Follow-Up Dashboard</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Track indecisive patients, monitor engagement scores, and manage decision journeys with intelligent insights
                </p>
                <div className="flex items-center text-green-600 text-sm font-semibold">
                  <Check className="w-4 h-4 mr-2" /> Live Now
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-orange-100">
                <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Surgery Options Configurator</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Present multiple surgery options with side-by-side comparisons, costs, risks, and recovery timelines
                </p>
                <div className="flex items-center text-green-600 text-sm font-semibold">
                  <Check className="w-4 h-4 mr-2" /> Live Now
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-red-100">
                <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center mb-6">
                  <BarChart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Engagement Analytics</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Real-time tracking of patient engagement, content views, message read rates, and call completion metrics
                </p>
                <div className="flex items-center text-green-600 text-sm font-semibold">
                  <Check className="w-4 h-4 mr-2" /> Live Now
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-indigo-100">
                <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Decision Journey Tracking</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Monitor patient decision stages from consultation to surgery scheduling with automated milestone tracking
                </p>
                <div className="flex items-center text-green-600 text-sm font-semibold">
                  <Check className="w-4 h-4 mr-2" /> Live Now
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Future Enhancements / Roadmap */}
      <div id="roadmap" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Future Enhancements
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Exciting features coming soon to make your practice even more efficient
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-xl text-sm font-semibold">
                Q1 2026
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 mt-4">
                <Phone className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Voice Agents</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Intelligent voice AI that handles patient calls, answers FAQs, schedules appointments, and provides pre/post-op instructions 24/7
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /> Natural conversation AI</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /> Multilingual support</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /> Call recording & transcription</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /> Sentiment analysis</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-purple-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-xl text-sm font-semibold">
                Q1 2026
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 mt-4">
                <Video className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Video Generation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Automatically generate personalized educational videos for patients based on their diagnosis and selected surgery option
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0" /> Custom video creation</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0" /> Procedure walkthroughs</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0" /> Recovery guidelines</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0" /> Patient-specific content</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-green-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-xl text-sm font-semibold">
                Q2 2026
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 mt-4">
                <Calendar className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Scheduling AI</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                AI-powered appointment scheduling that optimizes your calendar, predicts no-shows, and automatically reschedules
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /> Calendar optimization</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /> No-show prediction</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /> Auto-rescheduling</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /> Waitlist management</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-orange-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 rounded-bl-xl text-sm font-semibold">
                Q2 2026
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6 mt-4">
                <Zap className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Workflow Automation Rules</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Create custom automation workflows based on patient behavior, decision stages, and engagement patterns
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" /> Trigger-based actions</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" /> Custom rule builder</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" /> Conditional workflows</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" /> Multi-channel actions</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-red-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-xl text-sm font-semibold">
                Q2 2026
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6 mt-4">
                <Brain className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Predictive Analytics</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                ML-powered insights to predict patient conversion likelihood, optimal contact times, and content preferences
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" /> Conversion predictions</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" /> Churn detection</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" /> Best contact time</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" /> Content recommendations</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-indigo-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1 rounded-bl-xl text-sm font-semibold">
                Q3 2026
              </div>
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 mt-4">
                <TrendingUp className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Reporting & BI</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Comprehensive business intelligence dashboards with practice performance metrics and ROI tracking
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-indigo-500 flex-shrink-0" /> Custom dashboards</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-indigo-500 flex-shrink-0" /> ROI calculations</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-indigo-500 flex-shrink-0" /> Export to Excel/PDF</li>
                <li className="flex items-start"><Sparkles className="w-4 h-4 mr-2 mt-0.5 text-indigo-500 flex-shrink-0" /> Trend analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your practice size and needs. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 hover:border-blue-400 transition-all">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600 mb-6">Perfect for solo practitioners</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">₹9,999</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <Button onClick={() => scrollToSection('contact')} className="w-full" variant="outline">
                  Get Started
                </Button>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Up to 100 patients/month</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">WhatsApp automation (500 messages)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Patient education library</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Basic analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Email support</span>
                </li>
              </ul>
            </div>

            {/* Professional Plan - Most Popular */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-8 transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <p className="text-blue-100 mb-6">For growing practices</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">₹24,999</span>
                  <span className="text-blue-100">/month</span>
                </div>
                <Button onClick={() => scrollToSection('contact')} className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  Get Started
                </Button>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Up to 500 patients/month</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">WhatsApp automation (2,500 messages)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">All Starter features</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Patient follow-up dashboard</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Surgery options configurator</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Advanced analytics & reports</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Priority support (24/7)</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 hover:border-blue-400 transition-all">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-6">For multi-surgeon clinics</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">Custom</span>
                </div>
                <Button onClick={() => scrollToSection('contact')} className="w-full">
                  Contact Sales
                </Button>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Unlimited patients</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Unlimited WhatsApp messages</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">All Professional features</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">AI Voice Agents (when available)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">White-label options</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 text-lg">
              All plans include 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Get Started Today
              </h2>
              <p className="text-xl text-gray-600">
                Transform your practice with AI. Our team will contact you within 24 hours.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Dr. Rajesh Kumar"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      placeholder="rajesh@example.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91 98765 43210"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Practice Name</label>
                    <Input
                      type="text"
                      value={formData.practice_name}
                      onChange={(e) => setFormData({...formData, practice_name: e.target.value})}
                      placeholder="Kumar Surgical Clinic"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                    <Input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                      placeholder="General & Laparoscopic Surgery"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interested In *</label>
                    <select
                      value={formData.interested_in}
                      onChange={(e) => setFormData({...formData, interested_in: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="starter">Starter Plan</option>
                      <option value="professional">Professional Plan</option>
                      <option value="enterprise">Enterprise Plan</option>
                      <option value="other">Just Exploring</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required
                      placeholder="Tell us about your practice and how AI Surgeon Pilot can help..."
                      rows={4}
                      className="w-full"
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full" size="lg">
                    {submitting ? 'Sending...' : 'Get Started Free'}
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose AI Surgeon Pilot?</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <Shield className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">HIPAA Compliant</div>
                        <div className="text-gray-600 text-sm">Your patient data is secure and encrypted</div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Clock className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">24/7 Support</div>
                        <div className="text-gray-600 text-sm">We're here whenever you need us</div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <TrendingUp className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Proven ROI</div>
                        <div className="text-gray-600 text-sm">Average 3x return within 6 months</div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Users className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Trusted by 1000+ Surgeons</div>
                        <div className="text-gray-600 text-sm">Join India's leading surgical practices</div>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
                  <h3 className="text-xl font-bold mb-4">Need Help Choosing?</h3>
                  <p className="mb-6 text-blue-100">
                    Schedule a free 30-minute consultation with our team to find the perfect plan for your practice.
                  </p>
                  <p className="text-white text-sm">
                    Fill out the contact form above and our team will reach out to you within 24 hours to discuss your practice needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">AI Surgeon Pilot</h3>
              <p className="text-gray-400 mb-4">
                Empowering surgeons with AI-powered patient engagement and practice automation.
              </p>
              <div className="text-sm text-gray-500">
                <span className="px-3 py-1 bg-blue-900/50 rounded-full">Powered by Bettroi</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Features</button></li>
                <li><button onClick={() => scrollToSection('roadmap')} className="hover:text-white">Roadmap</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white">Pricing</button></li>
                <li><a href="/login" className="hover:text-white">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white">Contact Us</button></li>
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                  <span>India</span>
                </li>
                <li className="text-gray-400 text-sm mt-4">
                  Use the contact form to get in touch with our team. We'll respond within 24 hours.
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              A Product of <span className="text-blue-400 font-semibold">DRMHopes Software</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Developed by DRMHopes Software in partnership with <span className="text-blue-400 font-semibold">Bettroi</span>
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
              <span>Version 1.5</span>
              <span>•</span>
              <span>Last Updated: 2025-10-26</span>
            </div>
            <p className="text-xs text-gray-600 mt-4">
              © 2025 DRMHopes Software & Bettroi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
