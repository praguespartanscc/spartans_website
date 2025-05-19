import { supabase } from '@/lib/supabase';
import type { Practice } from '@/types/supabase';

/**
 * Fetches upcoming practice sessions from the database
 * @returns An array of practice sessions
 */
export async function getUpcomingPractices(): Promise<Practice[]> {
  try {
    // Get today's date in YYYY-MM-DD format, but set time to beginning of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('Fetching practices on or after:', todayStr);
    
    const { data, error } = await supabase
      .from('practices')
      .select('*')
      .gte('date', todayStr) // Get practices on or after today
      .order('date', { ascending: true })
      .limit(3);
    
    if (error) {
      console.error('Error fetching upcoming practices:', error);
      throw new Error(error.message);
    }
    
    console.log('Fetched practices:', data);
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