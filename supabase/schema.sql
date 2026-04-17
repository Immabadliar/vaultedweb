create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create unique index if not exists users_username_unique_idx on public.users (lower(username));

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text not null,
  caption text,
  location text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_created_at_idx on public.comments (created_at asc);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists likes_post_id_idx on public.likes (post_id);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  type text not null check (type in ('police', 'security', 'alarm', 'safe')),
  latitude double precision not null,
  longitude double precision not null,
  note text,
  source text not null check (source in ('user', 'scanner')),
  created_at timestamptz not null default now()
);

create index if not exists alerts_created_at_idx on public.alerts (created_at desc);
create index if not exists alerts_source_idx on public.alerts (source);

alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.alerts enable row level security;

-- USERS
create policy "users are publicly readable"
  on public.users for select
  using (true);

create policy "users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- POSTS
create policy "posts are publicly readable"
  on public.posts for select
  using (true);

create policy "authenticated can create own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- COMMENTS
create policy "comments are publicly readable"
  on public.comments for select
  using (true);

create policy "authenticated can create own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "users can update own comments"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- LIKES
create policy "likes are publicly readable"
  on public.likes for select
  using (true);

create policy "authenticated can create own likes"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "users can delete own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ALERTS
create policy "alerts are publicly readable"
  on public.alerts for select
  using (true);

create policy "authenticated can report alerts"
  on public.alerts for insert
  with check (auth.uid() = user_id and source = 'user');

create policy "users can delete own alerts"
  on public.alerts for delete
  using (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- Storage policies
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "posts public read"
  on storage.objects for select
  using (bucket_id = 'posts');

create policy "posts owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "posts owner update"
  on storage.objects for update
  using (
    bucket_id = 'posts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.alerts;
