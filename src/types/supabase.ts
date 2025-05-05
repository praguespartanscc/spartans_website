export type Match = {
  id: number;
  team1: string;
  team2: string;
  date: string;
  time: string;
  venue: string;
  type: string;
  image_url: string;
  created_at: string;
};

export type Player = {
  id: number;
  name: string;
  position: string;
  bio: string;
  image_url: string;
  created_at: string;
};

export type Sponsor = {
  id: number;
  name: string;
  logo_url: string;
  website_url: string;
  description: string;
  created_at: string;
};

export type Team = {
  id: number;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
};

export type TeamImage = {
  id: number;
  title: string;
  image_url: string;
  alt_text: string;
  created_at: string;
};

export type Practice = {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  created_at: string;
}; 