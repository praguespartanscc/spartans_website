// Row shapes for the club's Supabase tables. Columns added by
// supabase/migrations/001 are optional so the site keeps working before it runs.

export type MatchResult = 'will be played' | 'win' | 'loss' | 'draw';

export type Match = {
  id: number;
  team1: string;
  team2: string;
  date: string;
  time: string | null;
  venue: string | null;
  type: string | null; // friendly | league | tournament
  result: MatchResult | string;
  division: string | null; // division1 | division2 | division3
  url: string | null; // CricHeroes scorecard link
  image_url?: string | null;
  stream_url?: string | null; // YouTube live stream or replay
  summary?: string | null; // e.g. "Won by 23 runs"
  created_at?: string;
};

export type Player = {
  id: string;
  name: string;
  player_type: string | null; // batsman | bowler | allrounder | wicketkeeper
  role: string | null; // player | captain | vice-captain
  team: string | null; // Vanguards | Mobilizers | Strikers
  photo_url?: string | null;
  bio?: string | null;
  batting_style?: string | null;
  bowling_style?: string | null;
  jersey_number?: number | null;
  joined_year?: number | null;
  cricheroes_url?: string | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string | null;
};

// Admin-only details, kept out of the public players table.
export type PlayerPrivate = {
  player_id: string;
  email: string | null;
  age: number | null;
};

export type Practice = {
  id: number;
  date: string;
  time: string | null;
  venue: string | null;
  type: string | null; // regular | batting | bowling | fielding
  notes?: string | null;
  first_team?: string | null;
  second_team?: string | null;
  title?: string | null;
  description?: string | null;
  created_at?: string;
};

export type Sponsor = {
  id: number;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  tier?: string | null; // principal | gold | partner
  sort_order?: number | null;
  created_at?: string;
};

export type CommitteeMember = {
  id: number;
  name: string;
  position: string;
  photo_url?: string | null;
  bio?: string | null;
  contact_email?: string | null;
  sort_order?: number | null;
  created_at?: string;
};

export type TeamApplication = {
  id: number;
  name: string;
  email: string;
  age: number | null;
  location: string | null;
  specification: string | null;
  experience: string | null;
  status: 'pending' | 'accepted' | 'rejected' | null;
  created_at: string;
};
