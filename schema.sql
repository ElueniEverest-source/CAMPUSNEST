create extension if not exists "pgcrypto";

alter table if exists users drop column if exists password;
alter table if exists users drop constraint if exists users_role_check;
alter table if exists users add constraint users_role_check check (role in ('student', 'landlord', 'agent', 'admin'));

create table if not exists profiles (id uuid primary key references auth.users(id) on delete cascade, name text not null, email text not null unique, phone text, university text, role text not null check (role in ('student', 'landlord', 'agent', 'admin')), created_at timestamptz not null default now());

alter table properties drop constraint if exists properties_owner_id_fkey;
alter table properties add constraint properties_owner_id_fkey foreign key (owner_id) references profiles(id) on delete cascade;
alter table favorites drop constraint if exists favorites_user_id_fkey;
alter table favorites add constraint favorites_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;
create unique index if not exists favorites_user_property_unique on favorites(user_id, property_id);
alter table properties add column if not exists description text;
alter table properties add column if not exists price_period text not null default 'year';
alter table properties add column if not exists university text;
alter table properties add column if not exists location text;
alter table properties add column if not exists bathrooms int not null default 1;
alter table properties add column if not exists availability text not null default 'available';
alter table properties add column if not exists rejection_reason text;
create index if not exists properties_owner_id_idx on properties(owner_id);
create index if not exists properties_public_status_idx on properties(approval_status, created_at desc);
create index if not exists properties_search_filters_idx on properties(approval_status, university, location, property_type, bedrooms, availability, price);
alter table properties enable row level security;
drop policy if exists "Public can view approved properties" on properties;
drop policy if exists "Owners can view own properties" on properties;
drop policy if exists "Owners can create properties" on properties;
drop policy if exists "Owners can update own properties" on properties;
drop policy if exists "Owners can delete own properties" on properties;
create policy "Public can view approved properties" on properties for select using (approval_status = 'approved');
create policy "Owners can view own properties" on properties for select using (auth.uid() = owner_id);
create policy "Owners can create properties" on properties for insert with check (auth.uid() = owner_id);
create policy "Owners can update own properties" on properties for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Owners can delete own properties" on properties for delete using (auth.uid() = owner_id);
create or replace function prevent_property_moderation_bypass() returns trigger language plpgsql security definer as $$
declare actor_role text;
begin
	if auth.uid() is null then return new;
	select role into actor_role from profiles where id = auth.uid();
	if coalesce(actor_role, '') <> 'admin' and (old.approval_status is distinct from new.approval_status or old.verification_status is distinct from new.verification_status or old.rejection_reason is distinct from new.rejection_reason) then
		raise exception 'Only admins can moderate properties';
	end if;
	return new;
end;
$$;
drop trigger if exists property_moderation_protection on properties;
create trigger property_moderation_protection before update on properties for each row execute function prevent_property_moderation_bypass();

create table if not exists messages (
	id uuid primary key default gen_random_uuid(),
	sender_id uuid not null references profiles(id) on delete cascade,
	receiver_id uuid not null references profiles(id) on delete cascade,
	property_id uuid not null references properties(id) on delete cascade,
	message text not null check (length(trim(message)) between 1 and 2000),
	read_at timestamptz,
	created_at timestamptz not null default now()
);
create index if not exists messages_participants_idx on messages(sender_id, receiver_id, created_at desc);
create index if not exists messages_property_idx on messages(property_id, created_at desc);
alter table messages enable row level security;
drop policy if exists "Participants can read messages" on messages;
drop policy if exists "Users can send messages" on messages;
drop policy if exists "Receivers can mark messages read" on messages;
create policy "Participants can read messages" on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on messages for insert with check (auth.uid() = sender_id);
create policy "Receivers can mark messages read" on messages for update using (auth.uid() = receiver_id) with check (auth.uid() = receiver_id);

create table if not exists property_reports (
	id uuid primary key default gen_random_uuid(),
	property_id uuid not null references properties(id) on delete cascade,
	reporter_id uuid not null references profiles(id) on delete cascade,
	reason text not null check (length(trim(reason)) between 1 and 200),
	description text not null check (length(trim(description)) between 1 and 2000),
	status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
	reviewed_by uuid references profiles(id) on delete set null,
	reviewed_at timestamptz,
	created_at timestamptz not null default now()
);
create index if not exists property_reports_status_idx on property_reports(status, created_at desc);
create index if not exists property_reports_property_idx on property_reports(property_id);
alter table property_reports enable row level security;
drop policy if exists "Users can create property reports" on property_reports;
drop policy if exists "Users can view own property reports" on property_reports;
create policy "Users can create property reports" on property_reports for insert with check (auth.uid() = reporter_id);
create policy "Users can view own property reports" on property_reports for select using (auth.uid() = reporter_id);

alter table favorites enable row level security;
drop policy if exists "Users can view own favorites" on favorites;
drop policy if exists "Students can create own favorites" on favorites;
drop policy if exists "Students can delete own favorites" on favorites;
create policy "Users can view own favorites" on favorites for select using (auth.uid() = user_id);
create policy "Students can create own favorites" on favorites for insert with check (auth.uid() = user_id and exists (select 1 from profiles where id = auth.uid() and role = 'student'));
create policy "Students can delete own favorites" on favorites for delete using (auth.uid() = user_id and exists (select 1 from profiles where id = auth.uid() and role = 'student'));

create table if not exists property_images (
	id uuid primary key default gen_random_uuid(),
	property_id uuid not null references properties(id) on delete cascade,
	owner_id uuid not null references profiles(id) on delete cascade,
	storage_path text not null unique,
	public_url text not null,
	sort_order int not null default 0,
	created_at timestamptz not null default now()
);
create index if not exists property_images_property_id_idx on property_images(property_id, sort_order);
alter table property_images enable row level security;
drop policy if exists "Public can view approved property images" on property_images;
drop policy if exists "Owners can manage property images" on property_images;
create policy "Public can view approved property images" on property_images for select using (exists (select 1 from properties where properties.id = property_images.property_id and properties.approval_status = 'approved'));
create policy "Owners can manage property images" on property_images for all using (auth.uid() = owner_id and exists (select 1 from properties where properties.id = property_images.property_id and properties.owner_id = auth.uid())) with check (auth.uid() = owner_id and exists (select 1 from properties where properties.id = property_images.property_id and properties.owner_id = auth.uid()));

insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true) on conflict (id) do nothing;
drop policy if exists "Public can read property images" on storage.objects;
drop policy if exists "Owners can upload property images" on storage.objects;
drop policy if exists "Owners can delete property images" on storage.objects;
create policy "Public can read property images" on storage.objects for select using (bucket_id = 'property-images');
create policy "Owners can upload property images" on storage.objects for insert with check (bucket_id = 'property-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Owners can delete property images" on storage.objects for delete using (bucket_id = 'property-images' and auth.uid()::text = (storage.foldername(name))[1]);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can create own normal profile" on profiles for insert with check (auth.uid() = id and role in ('student', 'landlord', 'agent'));
create policy "Users can update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function prevent_profile_role_change() returns trigger language plpgsql security definer as $$
begin
	if old.role <> new.role and auth.uid() = old.id then
		raise exception 'Role changes are not allowed';
	end if;
	return new;
end;
$$;
drop trigger if exists profile_role_protection on profiles;
create trigger profile_role_protection before update on profiles for each row execute function prevent_profile_role_change();

-- Create the first admin only from a trusted server or SQL editor; see README.md.