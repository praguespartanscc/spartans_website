import { supabase } from '@/lib/supabase';
import type { Practice } from '@/types/supabase';

/**
 * Fetches upcoming practice sessions from the database
 * @returns An array of practice sessions
 */
export async function getUpcomingPractices(): Promise<Practice[]> {
  try {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    const { data, error } = await supabase
      .from('practices')
      .select('*')
      .gte('date', today) // Get practices on or after today
      .order('date', { ascending: true })
      .limit(3);
    
    if (error) {
      console.error('Error fetching upcoming practices:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to get upcoming practices:', error);
    throw error;
  }
}

/**
 * Fetches all practice sessions from the database
 * @returns An array of all practice sessions
 */
export async function getAllPractices(): Promise<Practice[]> {
  try {
    const { data, error } = await supabase
      .from('practices')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching all practices:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to get all practices:', error);
    throw error;
  }
} 