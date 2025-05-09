'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const supabase = createClientComponentClient();

  const fetchSponsors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSponsors(data || []);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    async function checkAdminAndFetch() {
      await supabase.auth.refreshSession();
      const { data: { user } } = await supabase.auth.getUser();
      const admin = !!user?.user_metadata?.isAdmin;
      setIsAdmin(admin);
      fetchSponsors();
    }
    checkAdminAndFetch();
  }, [supabase.auth, fetchSponsors]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      console.log('File selected:', file ? true : false);
      
      if (!file) {
        console.warn('No file selected');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        console.warn('Invalid file type:', file.type);
        toast.error('Only JPEG and PNG files are allowed');
        e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        console.warn('File too large:', file.size);
        toast.error('File size must be less than 5MB');
        e.target.value = '';
        return;
      }

      console.log('Setting logo file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      setLogoFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling logo change:', error);
      toast.error('Failed to process the selected file');
    }
  }

  async function uploadLogo(file: File): Promise<string> {
    try {
      if (!file) {
        throw new Error("File is null or undefined");
      }
      
      console.log("File details:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;
      
      // Upload with options
      const { data, error } = await supabase.storage
        .from('sponsor-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (error) {
        console.error('Upload error details:', error);
        throw error;
      }
      
      console.log('Upload success, data:', data);

      // Create the public URL directly using the supabase URL and bucket info
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const bucketName = 'sponsor-logos';
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
      
      console.log('Generated public URL:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Upload function error:', error);
      throw error;
    }
  }

  async function handleAddSponsor(e: React.FormEvent) {
    e.preventDefault();
    
    if (!logoFile && !editSponsorId) {
      toast.error('Please upload a logo image');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use isAdmin state instead of isUserAdmin function
      if (!isAdmin) {
        toast.error('You need admin privileges to add or edit sponsors');
        setIsSubmitting(false);
        return;
      }
      
      let logoUrl = '';
      
      // If adding a new sponsor or updating logo
      if (logoFile) {
        console.log('Uploading logo file...');
        logoUrl = await uploadLogo(logoFile);
        console.log('Logo uploaded, URL:', logoUrl);
      } else if (editSponsorId) {
        // If editing but not changing logo, keep existing URL
        logoUrl = sponsors.find(s => s.id === editSponsorId)?.logo_url || '';
        console.log('Using existing logo URL:', logoUrl);
      }
      
      if (editSponsorId) {
        console.log('Updating sponsor with ID:', editSponsorId);
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

        if (error) {
          console.error('Update error details:', error);
          throw error;
        }
        
        setSponsors(sponsors.map(s => s.id === editSponsorId ? (data ? data[0] : s) : s));
        toast.success('Sponsor updated successfully!');
      } else {
        console.log('Adding new sponsor with data:', {
          name: newSponsor.name,
          website_url: newSponsor.website_url,
          logo_url: logoUrl ? 'Set' : 'Not set'
        });
        
        // Instead of inserting directly through the client, consider using a server endpoint
        // that has admin access via service role
        
        // Try client-side insert first
        const { data, error } = await supabase
          .from('sponsors')
          .insert([{
            name: newSponsor.name,
            website_url: newSponsor.website_url,
            logo_url: logoUrl,
            description: newSponsor.description
          }])
          .select();

        if (error) {
          console.error('Insert error details:', error);
          
          // If it's an RLS error, try a workaround using a server endpoint
          if (error.code === '42501' || error.message.includes('security policy')) {
            try {
              // You'd need to create this API endpoint to use the service role
              const response = await fetch('/api/admin/sponsors', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: newSponsor.name,
                  website_url: newSponsor.website_url,
                  logo_url: logoUrl,
                  description: newSponsor.description
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
              }
              
              const result = await response.json();
              console.log('Added sponsor via API:', result);
              
              // Refresh sponsors list
              await fetchSponsors();
              toast.success('Sponsor added successfully!');
              resetForm();
              return;
            } catch (apiError) {
              console.error('API error:', apiError);
              if (apiError instanceof Error && apiError.message.includes('Server configuration error')) {
                toast.error('Server configuration issue. Please contact the administrator to set up the SUPABASE_SERVICE_ROLE_KEY.');
              } else {
                toast.error('You do not have permission to add sponsors. Please contact an administrator.');
              }
              return;
            }
          }
          
          throw error;
        }
        
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

  if (isAdmin === null) {
    // Still checking admin status
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049]"></div>
      </div>
    );
  }

  if (!isAdmin) {
    // Not an admin
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <p className="text-red-600 font-semibold text-lg">
          You need admin privileges to manage sponsors.
        </p>
      </div>
    );
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