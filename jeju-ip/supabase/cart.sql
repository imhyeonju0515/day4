-- 제주 장터 + 장바구니
-- Supabase > SQL Editor 에 통째로 붙여 넣고 Run 하세요. (여러 번 실행해도 안전해요)

-- 1) 상품 테이블 (누구나 볼 수 있음, 수정은 대시보드에서만)
create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text    not null,
  emoji       text    not null default '🍊',
  description text,
  price       integer not null check (price >= 0),   -- 원 단위
  unit        text    not null default '1박스',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "누구나 상품 보기" on public.products;
create policy "누구나 상품 보기" on public.products
  for select using (active);

-- 2) 장바구니 테이블 (로그인한 사용자 본인 것만)
create table if not exists public.cart_items (
  id         bigint generated always as identity primary key,
  user_id    uuid    not null default auth.uid() references auth.users(id) on delete cascade,
  product_id bigint  not null references public.products(id) on delete cascade,
  quantity   integer not null default 1 check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)                        -- 같은 상품은 한 줄, 수량만 늘림
);

create index if not exists cart_items_user_idx on public.cart_items (user_id);

alter table public.cart_items enable row level security;

drop policy if exists "내 장바구니 보기" on public.cart_items;
create policy "내 장바구니 보기" on public.cart_items
  for select using (auth.uid() = user_id);

drop policy if exists "내 장바구니에 담기" on public.cart_items;
create policy "내 장바구니에 담기" on public.cart_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "내 장바구니 수량 수정" on public.cart_items;
create policy "내 장바구니 수량 수정" on public.cart_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "내 장바구니에서 빼기" on public.cart_items;
create policy "내 장바구니에서 빼기" on public.cart_items
  for delete using (auth.uid() = user_id);

-- 3) 샘플 상품 (테이블이 비어 있을 때만 넣음)
insert into public.products (name, emoji, description, price, unit)
select * from (values
  ('제주 감귤',       '🍊', '새콤달콤 제주 노지 감귤',          12900, '3kg 1박스'),
  ('한라봉',          '🍋', '향이 진하고 과즙 가득',            25900, '2kg 1박스'),
  ('천혜향',          '🍊', '껍질이 얇고 달콤한 귤',            29900, '2kg 1박스'),
  ('돌하르방 키링',   '🗿', '제주를 지키는 귀여운 돌하르방',     6900, '1개'),
  ('제주 말 인형',    '🐴', '오름을 달리는 조랑말 인형',        15900, '1개'),
  ('유채꿀',          '🍯', '봄 유채꽃에서 모은 꿀',            18900, '300g'),
  ('감귤 초콜릿',     '🍫', '귤 껍질이 톡톡 들어간 초콜릿',      9900, '1통'),
  ('해녀 소라 과자',  '🐚', '바삭고소한 제주 바다 간식',         7900, '2봉')
) as v(name, emoji, description, price, unit)
where not exists (select 1 from public.products);
