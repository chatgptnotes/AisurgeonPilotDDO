/**
 * Patient Education Content Manager
 * Version: 1.3
 *
 * CRUD interface for managing educational materials (videos, blogs, PDFs, articles)
 * Allows surgeons to create, edit, and manage content for patient education
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
import { PatientEducationContent, PatientEducationContentInsert } from '@/types/ai-followup-types';

const PatientEducationManager = () => {
  const [contents, setContents] = useState<PatientEducationContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<PatientEducationContent | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<PatientEducationContentInsert>({
    title: '',
    content_type: 'video',
    content_url: '',
    content_text: '',
    description: '',
    thumbnail_url: '',
    duration_minutes: null,
    surgery_types: [],
    tags: [],
    is_active: true,
  });

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_education_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContents(data || []);
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
      if (editingContent) {
        // Update existing content
        const { error } = await supabase
          .from('patient_education_content')
          .update(formData)
          .eq('id', editingContent.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Content updated successfully' });
      } else {
        // Create new content
        const { error } = await supabase
          .from('patient_education_content')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Content created successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchContents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('patient_education_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Content deleted successfully' });
      fetchContents();
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
      title: '',
      content_type: 'video',
      content_url: '',
      content_text: '',
      description: '',
      thumbnail_url: '',
      duration_minutes: null,
      surgery_types: [],
      tags: [],
      is_active: true,
    });
    setEditingContent(null);
  };

  const openEditDialog = (content: PatientEducationContent) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      content_type: content.content_type,
      content_url: content.content_url,
      content_text: content.content_text,
      description: content.description,
      thumbnail_url: content.thumbnail_url,
      duration_minutes: content.duration_minutes,
      surgery_types: content.surgery_types || [],
      tags: content.tags || [],
      is_active: content.is_active,
    });
    setIsDialogOpen(true);
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || content.content_type === filterType;
    return matchesSearch && matchesType;
  });

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      video: 'bg-blue-100 text-blue-800',
      blog: 'bg-green-100 text-green-800',
      pdf: 'bg-red-100 text-red-800',
      article: 'bg-purple-100 text-purple-800',
      infographic: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Education Content</h1>
          <p className="text-gray-600 mt-1">Manage educational materials for patient follow-up</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <span className="mr-2">+</span> Add New Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContent ? 'Edit Content' : 'Add New Content'}</DialogTitle>
              <DialogDescription>
                {editingContent ? 'Update educational content details' : 'Create new educational content for patients'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Understanding Hernia Surgery"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content Type *</label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value: any) => setFormData({ ...formData, content_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="infographic">Infographic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Content URL</label>
                <Input
                  value={formData.content_url || ''}
                  onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                  placeholder="https://example.com/content.mp4"
                  type="url"
                />
              </div>

              {(formData.content_type === 'blog' || formData.content_type === 'article') && (
                <div>
                  <label className="text-sm font-medium">Content Text</label>
                  <Textarea
                    value={formData.content_text || ''}
                    onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                    placeholder="Write your article content here..."
                    rows={8}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the content"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Thumbnail URL</label>
                <Input
                  value={formData.thumbnail_url || ''}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                  type="url"
                />
              </div>

              {formData.content_type === 'video' && (
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={formData.duration_minutes || ''}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || null })}
                    placeholder="10"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Surgery Types (comma-separated)</label>
                <Input
                  value={formData.surgery_types?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, surgery_types: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Inguinal Hernia, Appendicitis"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="hernia, surgery, recovery"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium">Active</label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingContent ? 'Update' : 'Create'} Content
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="Search content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="blog">Blogs</SelectItem>
            <SelectItem value="pdf">PDFs</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="infographic">Infographics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="text-center py-12">Loading content...</div>
      ) : filteredContents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No content found. Create your first educational content!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((content) => (
            <Card key={content.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge className={getContentTypeColor(content.content_type)}>
                    {content.content_type}
                  </Badge>
                  {!content.is_active && (
                    <Badge variant="outline" className="bg-gray-100">Inactive</Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-lg">{content.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {content.description || 'No description'}
                </p>

                {content.surgery_types && content.surgery_types.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Surgery Types:</div>
                    <div className="flex flex-wrap gap-1">
                      {content.surgery_types.slice(0, 3).map((type, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{type}</Badge>
                      ))}
                      {content.surgery_types.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{content.surgery_types.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {content.tags && content.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Tags:</div>
                    <div className="flex flex-wrap gap-1">
                      {content.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                      {content.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{content.tags.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-xs text-gray-500">
                    Views: {content.view_count || 0}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(content)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(content.id)}
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

export default PatientEducationManager;
