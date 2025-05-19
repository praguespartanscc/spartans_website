'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    location: '',
    specification: 'batsman', // Default value
    experience: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Submitting your application...');

    try {
      // Handle case when Supabase is not configured (development/preview)
      if (!isSupabaseConfigured) {
        console.log('Form submission (Supabase not configured):', formData);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success('Thank you for your interest! Your application has been received (demo mode).');
        
        setFormData({
          name: '',
          email: '',
          age: '',
          location: '',
          specification: 'batsman',
          experience: ''
        });
        
        toast.dismiss(loadingToast);
        return;
      }

      // Submit to Supabase
      const { error } = await supabase
        .from('team_applications')
        .insert([formData]);

      if (error) throw error;

      // Reset form on success
      setFormData({
        name: '',
        email: '',
        age: '',
        location: '',
        specification: 'batsman',
        experience: ''
      });
      
      toast.success('Thank you for your interest! Your application has been received.');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 sm:py-16 bg-gray-50 min-h-screen overflow-x-hidden">
      <Toaster position="top-center" />
      <div className="container mx-auto px-2 sm:px-4">
        <div className="max-w-full sm:max-w-3xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl font-bold text-[#1a3049] mb-3">Join Our Team</h1>
            <p className="text-gray-600 mx-auto text-base sm:text-lg">
              Interested in playing cricket with Prague Spartans? Fill out the form below and we&apos;ll get back to you.
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4 sm:p-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3049]"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3049]"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="age" className="block text-gray-700 font-medium mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="10"
                  max="80"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3049]"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="location" className="block text-gray-700 font-medium mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3049]"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="specification" className="block text-gray-700 font-medium mb-2">
                  Player Specification <span className="text-red-500">*</span>
                </label>
                <select
                  id="specification"
                  name="specification"
                  value={formData.specification}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3049]"
                  required
                  disabled={isSubmitting}
                >
                  <option value="batsman">Batsman</option>
                  <option value="bowler">Bowler</option>
                  <option value="allrounder">All-rounder</option>
                  <option value="wicketkeeper">Wicket Keeper</option>
                  <option value="wicketkeeper_batsman">Wicket Keeper / Batsman</option>
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="experience" className="block text-gray-700 font-medium mb-2">
                  Cricket Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us about your cricket experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3049]"
                  required
                  disabled={isSubmitting}
                ></textarea>
              </div>

              <div className="text-center sm:text-right">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#1a3049] cursor-pointer hover:bg-[#2a4059] text-white font-bold py-3 px-6 sm:px-8 rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center sm:justify-start">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 