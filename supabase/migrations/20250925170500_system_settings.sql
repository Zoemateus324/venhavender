-- System settings table and seed

create table if not exists public.system_settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value text not null default '',
  description text not null default '',
  category text not null default 'general',
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;

-- Policies: admins can manage all; authenticated can read public settings
create policy if not exists "Admins can manage settings" on public.system_settings
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy if not exists "Anyone can read public settings" on public.system_settings
  for select to anon, authenticated
  using (is_public);

-- Seed defaults if missing
insert into public.system_settings (key, value, description, category, is_public)
values
  ('site_name', 'Venha Vender', 'Nome do site', 'general', true),
  ('site_description', 'Plataforma de anúncios online', 'Descrição do site (texto longo)', 'general', true),
  ('primary_color', '#f97316', 'Cor primária do tema', 'general', true),
  ('contact_email', 'contato@venhavender.com', 'Email de contato principal', 'email', true),
  ('notifications_enabled', 'true', 'Ativar sistema de notificações', 'notifications', true),
  ('email_notifications_enabled', 'true', 'Ativar notificações por email', 'notifications', true),
  ('max_login_attempts', '5', 'Número máximo de tentativas de login', 'security', false),
  ('password_reset_expiry_hours', '24', 'Validade do link de redefinição de senha (horas)', 'security', false),
  ('payment_gateway', 'asaas', 'Gateway de pagamento padrão', 'payment', false),
  ('currency', 'BRL', 'Moeda padrão', 'payment', true),
  ('meta_title', 'Venha Vender - Anúncios Online', 'Título para SEO', 'seo', true),
  ('meta_description', 'Venha Vender é a plataforma ideal para comprar e vender online.', 'Descrição para SEO', 'seo', true),
  ('terms_url', '/terms', 'URL dos Termos de Uso', 'legal', true),
  ('privacy_url', '/privacy', 'URL da Política de Privacidade', 'legal', true)
on conflict (key) do nothing;


