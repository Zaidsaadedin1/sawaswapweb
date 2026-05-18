alter table public.profiles
add column if not exists is_admin boolean not null default false;

alter table public.trade_offers
add column if not exists admin_review_status text not null default 'pending'
check (admin_review_status in ('pending', 'approved', 'cancelled'));

alter table public.trade_offers
add column if not exists admin_reviewed_at timestamp with time zone;

alter table public.trade_offers
add column if not exists admin_review_notes text;

comment on column public.trade_offers.admin_review_status is
'Admin moderation status. Only approved offers should be treated as public.';

comment on column public.profiles.is_admin is
'Marks which authenticated profile can access the admin dashboard.';
