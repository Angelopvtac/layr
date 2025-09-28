-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- User profiles (synced with Clerk)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tags TEXT[],
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes (polymorphic)
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  likeable_type TEXT NOT NULL CHECK (likeable_type IN ('post', 'comment')),
  likeable_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, likeable_type, likeable_id)
);

-- Follows
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create indexes
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_tags ON public.posts USING gin(tags);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_likeable ON public.likes(likeable_type, likeable_id);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Full text search
CREATE INDEX idx_posts_search ON public.posts USING gin(to_tsvector('english', title || ' ' || content));

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles are public to read
CREATE POLICY "Profiles are public" ON public.profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- Posts are public to read
CREATE POLICY "Posts are public" ON public.posts
  FOR SELECT USING (status = 'published');

-- Users can create posts
CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (author_id = (SELECT id FROM public.profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Comments are public to read
CREATE POLICY "Comments are public" ON public.comments
  FOR SELECT USING (true);

-- Users can create comments
CREATE POLICY "Authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Likes policies
CREATE POLICY "Likes are public" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like" ON public.likes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unlike" ON public.likes
  FOR DELETE USING (user_id = (SELECT id FROM public.profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Follows policies
CREATE POLICY "Follows are public" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow" ON public.follows
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (follower_id = (SELECT id FROM public.profiles WHERE clerk_id = auth.jwt() ->> 'sub'));