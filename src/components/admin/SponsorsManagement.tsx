'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import type { Sponsor } from '@/types/supabase';

export default function SponsorsManagement() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editSponsorId, setEditSponsorId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<number | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [newSponsor, setNewSponsor] = useState({
    name: '',
    website_url: '',
    description: ''
  });

  useEffect(() => {
    fetchSponsors();
  }, []);

  async function fetchSponsors() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSponsors(data || []);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      toast.error('Failed to load sponsors');
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG and PNG files are allowed');
      e.target.value = '';
      return;
    }

    setLogoFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadLogo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('sponsor-logos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleAddSponsor(e: React.FormEvent) {
    e.preventDefault();
    
    if (!logoFile && !editSponsorId) {
      toast.error('Please upload a logo image');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let logoUrl = '';
      
      // If adding a new sponsor or updating logo
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      } else if (editSponsorId) {
        // If editing but not changing logo, keep existing URL
        logoUrl = sponsors.find(s => s.id === editSponsorId)?.logo_url || '';
      }
      
      if (editSponsorId) {
        // Update existing sponsor
        const { data, error } = await supabase
          .from('sponsors')
          .update({
            name: newSponsor.name,
            website_url: newSponsor.website_url,
            description: newSponsor.description,
            ...(logoUrl ? { logo_url: logoUrl } : {})
          })
          .eq('id', editSponsorId)
          .select();

        if (error) throw error;
        
        setSponsors(sponsors.map(s => s.id === editSponsorId ? (data ? data[0] : s) : s));
        toast.success('Sponsor updated successfully!');
      } else {
        // Add new sponsor
        const { data, error } = await supabase
          .from('sponsors')
          .insert([{
            name: newSponsor.name,
            website_url: newSponsor.website_url,
            logo_url: logoUrl,
            description: newSponsor.description
          }])
          .select();

        if (error) throw error;
        
        setSponsors([...(data || []), ...sponsors]);
        toast.success('Sponsor added successfully!');
      }
      
      // Reset form
      resetForm();
    } catch (error: unknown) {
      console.error('Error saving sponsor:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(editSponsorId 
        ? `Error updating sponsor: ${errorMessage}` 
        : `Error adding sponsor: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmRemoveSponsor(sponsorId: number) {
    setSponsorToDelete(sponsorId);
    setShowConfirm(true);
  }

  async function handleRemoveSponsor() {
    if (!sponsorToDelete) return;
    
    setIsSubmitting(true);
    try {
      // Get the logo URL to delete from storage later
      const sponsorToRemove = sponsors.find(s => s.id === sponsorToDelete);
      const logoUrl = sponsorToRemove?.logo_url;
      
      // Delete from database
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', sponsorToDelete);

      if (error) throw error;

      // Try to delete the logo from storage if it's stored in our bucket
      if (logoUrl && logoUrl.includes('supabase.co/storage')) {
        const logoPath = logoUrl.split('/').pop();
        if (logoPath) {
          await supabase.storage
            .from('sponsor-logos')
            .remove([logoPath]);
        }
      }

      setSponsors(sponsors.filter(sponsor => sponsor.id !== sponsorToDelete));
      toast.success('Sponsor removed successfully!');
    } catch (error: unknown) {
      console.error('Error removing sponsor:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while removing sponsor';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
      setSponsorToDelete(null);
    }
  }

  function handleEditSponsor(sponsor: Sponsor) {
    setEditSponsorId(sponsor.id);
    setNewSponsor({
      name: sponsor.name,
      website_url: sponsor.website_url,
      description: sponsor.description
    });
    setLogoPreview(sponsor.logo_url);
    setLogoFile(null);
  }

  function handleCancelEdit() {
    resetForm();
  }

  function resetForm() {
    setEditSponsorId(null);
    setNewSponsor({
      name: '',
      website_url: '',
      description: ''
    });
    setLogoFile(null);
    setLogoPreview(null);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Add/Edit Sponsor Form */}
      <form onSubmit={handleAddSponsor} className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-[#1a3049] mb-4">
          {editSponsorId ? 'Edit Sponsor' : 'Add New Sponsor'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Sponsor Name</label>
            <input
              type="text"
              id="name"
              value={newSponsor.name}
              onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website URL</label>
            <input
              type="url"
              id="website"
              value={newSponsor.website_url}
              onChange={(e) => setNewSponsor({ ...newSponsor, website_url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              value={newSponsor.description}
              onChange={(e) => setNewSponsor({ ...newSponsor, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700">Logo Image</label>
            <div className="mt-1 flex items-center space-x-4">
              <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                <span>Upload file</span>
                <input 
                  id="logo" 
                  name="logo" 
                  type="file" 
                  accept=".jpg,.jpeg,.png" 
                  className="sr-only" 
                  onChange={handleLogoChange}
                />
              </label>
              <span className="text-sm text-gray-500">
                {logoFile ? logoFile.name : editSponsorId && !logoFile ? 'Keep current logo' : 'JPEG or PNG only'}
              </span>
            </div>
            
            {/* Logo Preview */}
            {logoPreview && (
              <div className="mt-3 p-2 border border-gray-200 rounded-md inline-block bg-white">
                <div className="relative h-24 w-40">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex gap-2 justify-end">
          {editSponsorId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-[#1a3049] text-white px-4 py-2 rounded-md hover:bg-[#1a3049]/90 transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                {editSponsorId ? 'Updating...' : 'Adding...'}
              </span>
            ) : (
              editSponsorId ? 'Update Sponsor' : 'Add Sponsor'
            )}
          </button>
        </div>
      </form>

      {/* Sponsors List */}
      {sponsors.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-md">
          <p className="text-gray-500">No sponsors found. Add your first sponsor above.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {isSubmitting && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049]"></div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sponsors.map((sponsor) => (
                  <tr key={sponsor.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-12 w-24 relative">
                        <Image
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sponsor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a 
                        href={sponsor.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {sponsor.website_url}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{sponsor.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditSponsor(sponsor)}
                        className="text-blue-600 hover:text-blue-900 mr-4 cursor-pointer"
                        disabled={isSubmitting}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmRemoveSponsor(sponsor.id)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white bg-opacity-95 rounded-lg max-w-md w-full shadow-xl transform transition-all">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Confirm Removal</h3>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="text-gray-400 hover:text-gray-500 cursor-pointer"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">Are you sure you want to remove this sponsor? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveSponsor}
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing
                    </span>
                  ) : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 