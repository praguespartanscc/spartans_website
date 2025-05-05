import { supabase } from '@/lib/supabase';
import type { Match } from '@/types/supabase';

export async function getUpcomingMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .gte('date', new Date().toISOString().split('T')[0]) // Get matches from today onwards
    .order('date', { ascending: true })
    .limit(6);
    
  if (error) {
    console.error('Error fetching upcoming matches:', error);
    return [];
  }
  
  return data || [];
}

export async function getMatchById(id: number): Promise<Match | null> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error(`Error fetching match with id ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function getAllMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: true });
    
  if (error) {
    console.error('Error fetching all matches:', error);
    return [];
  }
  
  return data || [];
} 