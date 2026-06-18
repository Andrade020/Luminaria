-- Users (mirrors auth.users with extra fields)
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Projects
create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  owner_id     uuid not null references public.users(id) on delete cascade,
  invite_hash  text not null unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Folders (nested via parent_folder_id)
create table public.folders (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  parent_folder_id uuid references public.folders(id) on delete cascade,
  name             text not null,
  order_index      integer not null default 0,
  created_at       timestamptz not null default now()
);

-- Loom videos
create table public.looms (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references public.projects(id) on delete cascade,
  folder_id               uuid references public.folders(id) on delete set null,
  loom_url                text not null,
  loom_embed_id           text not null,
  title                   text not null,
  description             text,
  uploaded_by_id          uuid references public.users(id) on delete set null,
  uploaded_by_guest_name  text,
  created_at              timestamptz not null default now()
);

-- Comments (supports threads via parent_comment_id)
create table public.comments (
  id                  uuid primary key default gen_random_uuid(),
  loom_id             uuid not null references public.looms(id) on delete cascade,
  user_id             uuid references public.users(id) on delete set null,
  guest_name          text,
  guest_session_token text,
  content             text not null,
  parent_comment_id   uuid references public.comments(id) on delete cascade,
  created_at          timestamptz not null default now(),
  constraint author_present check (user_id is not null or guest_name is not null)
);

-- Project members
create table public.project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null default 'viewer' check (role in ('owner','member','viewer')),
  created_at  timestamptz not null default now(),
  unique (project_id, user_id)
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users(id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS policies
alter table public.users         enable row level security;
alter table public.projects      enable row level security;
alter table public.folders       enable row level security;
alter table public.looms         enable row level security;
alter table public.comments      enable row level security;
alter table public.project_members enable row level security;

-- Users: anyone can read, only own row to update
create policy "users_select" on public.users for select using (true);
create policy "users_update" on public.users for update using (auth.uid() = id);

-- Projects: visible to owner or members; guests access via invite_hash in app logic
create policy "projects_select" on public.projects for select
  using (
    owner_id = auth.uid()
    or exists (select 1 from public.project_members where project_id = id and user_id = auth.uid())
  );
create policy "projects_insert" on public.projects for insert with check (owner_id = auth.uid());
create policy "projects_update" on public.projects for update using (owner_id = auth.uid());

-- Guest read access to projects via invite_hash (done in app, bypass RLS for select by allowing anon)
create policy "projects_select_anon" on public.projects for select to anon using (true);

-- Folders
create policy "folders_select" on public.folders for select using (true);
create policy "folders_insert" on public.folders for insert
  with check (
    exists (select 1 from public.projects p
      where p.id = project_id
      and (p.owner_id = auth.uid()
        or exists (select 1 from public.project_members pm where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role in ('owner','member'))))
  );
create policy "folders_delete" on public.folders for delete
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Looms
create policy "looms_select" on public.looms for select using (true);
create policy "looms_insert" on public.looms for insert with check (true);
create policy "looms_delete" on public.looms for delete
  using (
    uploaded_by_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Comments (anyone authenticated or guest can read/write)
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (true);
create policy "comments_delete" on public.comments for delete
  using (user_id = auth.uid());

-- Project members
create policy "members_select" on public.project_members for select using (true);
create policy "members_insert" on public.project_members for insert with check (true);
create policy "members_delete" on public.project_members for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );
