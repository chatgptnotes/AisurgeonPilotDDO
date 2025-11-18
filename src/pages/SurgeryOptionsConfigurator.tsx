/**
 * Surgery Options Configurator
 * Version: 1.3
 *
 * CRUD interface for managing surgery options
 * Allows surgeons to create comparison charts for patient decision-making
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { SurgeryOption, SurgeryOptionInsert } from '@/types/ai-followup-types';

interface Diagnosis {
  id: string;
  name: string;
}

interface SurgeryOptionWithDiagnosis extends SurgeryOption {
  diagnosis?: Diagnosis;
}

const SurgeryOptionsConfigurator = () => {
  const [options, setOptions] = useState<SurgeryOptionWithDiagnosis[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<SurgeryOption | null>(null);
  const [viewComparison, setViewComparison] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<SurgeryOptionInsert>({
    diagnosis_id: '',
    surgery_name: '',
    procedure_type: null,
    procedure_details: '',
    indications: '',
    contraindications: '',
    risks: [],
    benefits: [],
    recovery_time_days: null,
    hospital_stay_days: null,
    cost_range_min: null,
    cost_range_max: null,
    success_rate: null,
    anesthesia_type: '',
    preparation_requirements: '',
    post_op_care: '',
    alternative_treatments: '',
    is_recommended: false,
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchDiagnoses();
    fetchOptions();
  }, []);

  const fetchDiagnoses = async () => {
    try {
      const { data, error } = await supabase
        .from('diagnoses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDiagnoses(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('surgery_options')
        .select('*, diagnosis:diagnoses(id, name)')
        .order('display_order');

      if (error) throw error;
      setOptions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOption) {
        const { error } = await supabase
          .from('surgery_options')
          .update(formData)
          .eq('id', editingOption.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Surgery option updated successfully' });
      } else {
        const { error } = await supabase
          .from('surgery_options')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Surgery option created successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchOptions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this surgery option?')) return;

    try {
      const { error } = await supabase
        .from('surgery_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Surgery option deleted successfully' });
      fetchOptions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      diagnosis_id: '',
      surgery_name: '',
      procedure_type: null,
      procedure_details: '',
      indications: '',
      contraindications: '',
      risks: [],
      benefits: [],
      recovery_time_days: null,
      hospital_stay_days: null,
      cost_range_min: null,
      cost_range_max: null,
      success_rate: null,
      anesthesia_type: '',
      preparation_requirements: '',
      post_op_care: '',
      alternative_treatments: '',
      is_recommended: false,
      display_order: 0,
      is_active: true,
    });
    setEditingOption(null);
  };

  const openEditDialog = (option: SurgeryOption) => {
    setEditingOption(option);
    setFormData({
      diagnosis_id: option.diagnosis_id,
      surgery_name: option.surgery_name,
      procedure_type: option.procedure_type,
      procedure_details: option.procedure_details,
      indications: option.indications,
      contraindications: option.contraindications,
      risks: option.risks || [],
      benefits: option.benefits || [],
      recovery_time_days: option.recovery_time_days,
      hospital_stay_days: option.hospital_stay_days,
      cost_range_min: option.cost_range_min,
      cost_range_max: option.cost_range_max,
      success_rate: option.success_rate,
      anesthesia_type: option.anesthesia_type,
      preparation_requirements: option.preparation_requirements,
      post_op_care: option.post_op_care,
      alternative_treatments: option.alternative_treatments,
      is_recommended: option.is_recommended,
      display_order: option.display_order,
      is_active: option.is_active,
    });
    setIsDialogOpen(true);
  };

  const filteredOptions = options.filter(option => {
    return selectedDiagnosis === 'all' || option.diagnosis_id === selectedDiagnosis;
  });

  const getProcedureTypeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      laparoscopic: 'bg-blue-100 text-blue-800',
      open: 'bg-red-100 text-red-800',
      robotic: 'bg-purple-100 text-purple-800',
      minimally_invasive: 'bg-green-100 text-green-800',
    };
    return type ? colors[type] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Surgery Options Configurator</h1>
          <p className="text-gray-600 mt-1">Manage surgery options and create comparison charts</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setViewComparison(!viewComparison)}>
            {viewComparison ? 'List View' : 'Comparison View'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <span className="mr-2">+</span> Add Surgery Option
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOption ? 'Edit Surgery Option' : 'Add Surgery Option'}</DialogTitle>
                <DialogDescription>
                  {editingOption ? 'Update surgery option details' : 'Create new surgery option for patient decision-making'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Diagnosis *</label>
                    <Select
                      value={formData.diagnosis_id}
                      onValueChange={(value) => setFormData({ ...formData, diagnosis_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select diagnosis" />
                      </SelectTrigger>
                      <SelectContent>
                        {diagnoses.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-medium">Surgery Name *</label>
                    <Input
                      value={formData.surgery_name}
                      onChange={(e) => setFormData({ ...formData, surgery_name: e.target.value })}
                      placeholder="e.g., Laparoscopic Hernia Repair"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Procedure Type</label>
                    <Select
                      value={formData.procedure_type || ''}
                      onValueChange={(value: any) => setFormData({ ...formData, procedure_type: value || null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laparoscopic">Laparoscopic</SelectItem>
                        <SelectItem value="open">Open Surgery</SelectItem>
                        <SelectItem value="robotic">Robotic</SelectItem>
                        <SelectItem value="minimally_invasive">Minimally Invasive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Success Rate (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.success_rate || ''}
                      onChange={(e) => setFormData({ ...formData, success_rate: parseFloat(e.target.value) || null })}
                      placeholder="95.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Recovery Time (days)</label>
                    <Input
                      type="number"
                      value={formData.recovery_time_days || ''}
                      onChange={(e) => setFormData({ ...formData, recovery_time_days: parseInt(e.target.value) || null })}
                      placeholder="14"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Hospital Stay (days)</label>
                    <Input
                      type="number"
                      value={formData.hospital_stay_days || ''}
                      onChange={(e) => setFormData({ ...formData, hospital_stay_days: parseInt(e.target.value) || null })}
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Min Cost</label>
                    <Input
                      type="number"
                      value={formData.cost_range_min || ''}
                      onChange={(e) => setFormData({ ...formData, cost_range_min: parseFloat(e.target.value) || null })}
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Max Cost</label>
                    <Input
                      type="number"
                      value={formData.cost_range_max || ''}
                      onChange={(e) => setFormData({ ...formData, cost_range_max: parseFloat(e.target.value) || null })}
                      placeholder="80000"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-medium">Procedure Details</label>
                    <Textarea
                      value={formData.procedure_details || ''}
                      onChange={(e) => setFormData({ ...formData, procedure_details: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-medium">Risks (comma-separated)</label>
                    <Input
                      value={formData.risks?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, risks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Infection, Bleeding, Recurrence"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-medium">Benefits (comma-separated)</label>
                    <Input
                      value={formData.benefits?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Faster recovery, Less pain, Smaller scars"
                    />
                  </div>

                  <div className="flex items-center space-x-4 col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_recommended}
                        onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Recommended Option</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingOption ? 'Update' : 'Create'} Option
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={selectedDiagnosis} onValueChange={setSelectedDiagnosis}>
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Diagnoses</SelectItem>
            {diagnoses.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">Loading surgery options...</div>
      ) : filteredOptions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No surgery options found. Create your first option!
        </div>
      ) : viewComparison ? (
        // Comparison Table View
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold">Feature</th>
                {filteredOptions.map((option) => (
                  <th key={option.id} className="p-4 text-left">
                    <div className="font-semibold">{option.surgery_name}</div>
                    {option.is_recommended && (
                      <Badge className="mt-1 bg-green-100 text-green-800">Recommended</Badge>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Procedure Type</td>
                {filteredOptions.map((option) => (
                  <td key={option.id} className="p-4">
                    {option.procedure_type ? (
                      <Badge className={getProcedureTypeColor(option.procedure_type)}>
                        {option.procedure_type.replace('_', ' ')}
                      </Badge>
                    ) : '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Success Rate</td>
                {filteredOptions.map((option) => (
                  <td key={option.id} className="p-4 text-green-600 font-semibold">
                    {option.success_rate ? `${option.success_rate}%` : '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Recovery Time</td>
                {filteredOptions.map((option) => (
                  <td key={option.id} className="p-4">
                    {option.recovery_time_days ? `${option.recovery_time_days} days` : '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Hospital Stay</td>
                {filteredOptions.map((option) => (
                  <td key={option.id} className="p-4">
                    {option.hospital_stay_days ? `${option.hospital_stay_days} days` : '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Cost Range</td>
                {filteredOptions.map((option) => (
                  <td key={option.id} className="p-4">
                    {option.cost_range_min && option.cost_range_max
                      ? `₹${option.cost_range_min.toLocaleString()} - ₹${option.cost_range_max.toLocaleString()}`
                      : '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Key Benefits</td>
                {filteredOptions.map((option) => (
                  <td key={option.id} className="p-4">
                    {option.benefits && option.benefits.length > 0 ? (
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {option.benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                      </ul>
                    ) : '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-4 font-medium bg-gray-50">Risks</td>
                {filteredOptions.map((option) => (
                  <td key={option.id} className="p-4">
                    {option.risks && option.risks.length > 0 ? (
                      <div className="text-sm text-red-600">
                        {option.risks.length} risk(s)
                      </div>
                    ) : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        // Card List View
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOptions.map((option) => (
            <Card key={option.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {option.procedure_type && (
                      <Badge className={getProcedureTypeColor(option.procedure_type)}>
                        {option.procedure_type.replace('_', ' ')}
                      </Badge>
                    )}
                    {option.is_recommended && (
                      <Badge className="ml-2 bg-green-100 text-green-800">Recommended</Badge>
                    )}
                  </div>
                  {!option.is_active && (
                    <Badge variant="outline" className="bg-gray-100">Inactive</Badge>
                  )}
                </div>
                <CardTitle className="mt-2">{option.surgery_name}</CardTitle>
                {option.diagnosis && (
                  <div className="text-sm text-gray-600">{option.diagnosis.name}</div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {option.success_rate && (
                      <div>
                        <div className="text-gray-500">Success Rate</div>
                        <div className="font-semibold text-green-600">{option.success_rate}%</div>
                      </div>
                    )}
                    {option.recovery_time_days && (
                      <div>
                        <div className="text-gray-500">Recovery</div>
                        <div className="font-semibold">{option.recovery_time_days} days</div>
                      </div>
                    )}
                    {option.hospital_stay_days && (
                      <div>
                        <div className="text-gray-500">Hospital Stay</div>
                        <div className="font-semibold">{option.hospital_stay_days} days</div>
                      </div>
                    )}
                    {option.cost_range_min && option.cost_range_max && (
                      <div>
                        <div className="text-gray-500">Cost Range</div>
                        <div className="font-semibold">
                          ₹{option.cost_range_min.toLocaleString()} - ₹{option.cost_range_max.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {option.benefits && option.benefits.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Benefits:</div>
                      <div className="flex flex-wrap gap-1">
                        {option.benefits.slice(0, 3).map((benefit, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{benefit}</Badge>
                        ))}
                        {option.benefits.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{option.benefits.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(option)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(option.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SurgeryOptionsConfigurator;
