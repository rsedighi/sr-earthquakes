export type ForumCategory = 'earthquake' | 'general' | 'neighborhood' | 'preparedness' | 'science';

export interface ForumThread {
  _id?: string;
  title: string;
  slug: string;
  category: ForumCategory;
  author: string;
  authorLocation?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  postCount: number;
  viewCount: number;
  lastPostAt: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
  earthquakeId?: string;
  earthquakeData?: {
    magnitude: number;
    place: string;
    time: string;
    depth?: number;
  };
  tags?: string[];
}

export interface ForumThreadWithId extends Omit<ForumThread, '_id'> {
  _id: string;
}

export interface ForumPost {
  _id?: string;
  threadId: string;
  parentPostId?: string;
  author: string;
  authorLocation?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  feltIt?: boolean;
  intensity?: number;
  isOriginalPost: boolean;
}

export interface ForumPostWithId extends Omit<ForumPost, '_id'> {
  _id: string;
}
