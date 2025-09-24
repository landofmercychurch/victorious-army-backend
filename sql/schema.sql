-- sql/schema.sql
-- Enable extension (if allowed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (linked to supabase auth.users.id)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE,
  profile_picture text,
  is_admin boolean DEFAULT FALSE,
  created_at timestamp without time zone DEFAULT now()
);

-- Daily verses
CREATE TABLE IF NOT EXISTS daily_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  text text NOT NULL,
  created_at timestamp without time zone DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_at timestamp without time zone NOT NULL,
  location text,
  created_at timestamp without time zone DEFAULT now()
);

-- Memorials
CREATE TABLE IF NOT EXISTS memorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  images jsonb, -- array of {url, public_id}
  created_at timestamp without time zone DEFAULT now()
);

-- Sermons
CREATE TABLE IF NOT EXISTS sermons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text,
  created_at timestamp without time zone DEFAULT now()
);

-- Picture posts
CREATE TABLE IF NOT EXISTS picture_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caption text,
  image_url text,
  created_at timestamp without time zone DEFAULT now()
);

-- Ebooks
CREATE TABLE IF NOT EXISTS ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  author text,
  pdf_url text,
  created_at timestamp without time zone DEFAULT now()
);

-- Posts (generic posts if you need)
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  community_id uuid,
  title text,
  content text,
  image_url text,
  created_at timestamp without time zone DEFAULT now()
);

-- Comments (guest or admin)
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid,
  sermon_id uuid,
  name text,     -- guest name
  content text NOT NULL,
  is_guest boolean DEFAULT TRUE,
  created_at timestamp without time zone DEFAULT now()
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid,
  sermon_id uuid,
  created_at timestamp without time zone DEFAULT now()
);