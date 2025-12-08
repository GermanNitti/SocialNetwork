export interface PostAuthor {
  name?: string;
  username?: string;
  avatar?: string | null;
}

export interface PostSquad {
  name?: string;
}

export interface PostStats {
  likes?: number;
  comments?: number;
}

export interface Post {
  id: string | number;
  author?: PostAuthor;
  content?: string;
  createdAt?: string;
  relativeTime?: string;
  image?: string | null;
  hashtags?: string[];
  tags?: string[];
  stats?: PostStats;
  type?: "NORMAL" | "HELP" | string;
  squad?: PostSquad;
}
