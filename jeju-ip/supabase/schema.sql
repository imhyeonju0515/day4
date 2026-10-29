-- Supabase > SQL Editor 에 붙여 넣고 Run 하세요. (회원만 쓸 수 있는 "즐겨찾기" 기능용)
create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  image_id bigint not null,
  image_url text not null,
  tags text,
  category text,
  created_at timestamptz not null default now(),
  unique (user_id, image_id)
);

alter table public.favorites enable row level security;

create policy "내 즐겨찾기만 보기" on public.favorites
  for select using (auth.uid() = user_id);
create policy "내 즐겨찾기만 추가" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "내 즐겨찾기만 삭제" on public.favorites
  for delete using (auth.uid() = user_id);
