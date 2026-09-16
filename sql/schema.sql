-- ============================================================
-- POKEMON CODE GENESIS — schéma Supabase
-- À exécuter tel quel dans l'éditeur SQL du projet.
-- Idempotent : réexécutable sans risque.
-- ============================================================

-- ------------------------------------------------------------
-- 1. SAUVEGARDES
-- Une ligne par joueur. `payload` contient l'état complet du jeu.
-- Les colonnes en clair à côté servent aux classements : elles évitent
-- de lire le JSON entier pour trier, et permettent de n'exposer que
-- ces champs-là publiquement.
-- ------------------------------------------------------------
create table if not exists public.saves (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  rev         integer     not null default 0,
  payload     jsonb       not null default '{}'::jsonb,
  name        text        not null default 'Archiviste',
  level       integer     not null default 1,
  integrity   numeric(5,2) not null default 0,
  dex_count   integer     not null default 0,
  shinies     integer     not null default 0,
  best_streak integer     not null default 0,
  best_ante   integer     not null default 0,
  cards       integer     not null default 0,
  guardians   integer     not null default 0,
  tested      boolean     not null default false,
  updated_at  timestamptz not null default now(),

  -- garde-fous : une révision ne recule pas, les compteurs restent plausibles
  constraint saves_rev_positive     check (rev >= 0),
  constraint saves_level_range      check (level between 1 and 500),
  constraint saves_integrity_range  check (integrity between 0 and 100),
  constraint saves_dex_range        check (dex_count between 0 and 386),
  constraint saves_guardians_range  check (guardians between 0 and 9),
  constraint saves_payload_size     check (pg_column_size(payload) < 1048576)
);

create index if not exists saves_integrity_idx   on public.saves (integrity desc);
create index if not exists saves_dex_idx         on public.saves (dex_count desc);
create index if not exists saves_level_idx       on public.saves (level desc);
create index if not exists saves_shinies_idx     on public.saves (shinies desc);
create index if not exists saves_streak_idx      on public.saves (best_streak desc);
create index if not exists saves_ante_idx        on public.saves (best_ante desc);
create index if not exists saves_guardians_idx   on public.saves (guardians desc);

-- horodatage automatique
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before update on public.saves
  for each row execute function public.touch_updated_at();

-- la révision ne peut que monter : protège d'un client qui renverrait un état ancien
create or replace function public.saves_rev_guard()
returns trigger language plpgsql as $$
begin
  if new.rev < old.rev then
    raise exception 'revision % inferieure a la revision enregistree %', new.rev, old.rev
      using errcode = '22023';
  end if;
  return new;
end $$;

drop trigger if exists saves_rev_check on public.saves;
create trigger saves_rev_check before update on public.saves
  for each row execute function public.saves_rev_guard();

alter table public.saves enable row level security;

drop policy if exists saves_select_own on public.saves;
create policy saves_select_own on public.saves
  for select using (auth.uid() = user_id);

drop policy if exists saves_insert_own on public.saves;
create policy saves_insert_own on public.saves
  for insert with check (auth.uid() = user_id);

drop policy if exists saves_update_own on public.saves;
create policy saves_update_own on public.saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. CLASSEMENT
-- Vue publique : n'expose que les colonnes de vitrine, jamais `payload`.
-- security_invoker = off (défaut) : la vue lit avec les droits de son
-- propriétaire, ce qui contourne volontairement la RLS de `saves` —
-- c'est le seul chemin de lecture publique, et il est limité à ces colonnes.
-- ------------------------------------------------------------
create or replace view public.leaderboard as
  select user_id, name, level, integrity, dex_count, shinies,
         best_streak, best_ante, cards, guardians, tested, updated_at
  from public.saves
  where updated_at > now() - interval '120 days';

-- La vue lit volontairement avec les droits de son proprietaire : c'est le seul
-- chemin de lecture publique, et il est limite aux colonnes ci-dessus. Le linter
-- Supabase signalera « security definer view » : c'est le comportement voulu.
alter view public.leaderboard set (security_invoker = off);

grant select on public.leaderboard to anon, authenticated;

-- Aucun acces direct a la table : meme avec la cle publique, un client ne peut
-- pas contourner la vue pour lire le payload d'autrui.
revoke all on public.saves from anon;

-- ------------------------------------------------------------
-- 3. ÉCHANGES DE CARTES
-- Un code à usage unique porte une carte. L'émetteur doit réellement
-- posséder un exemplaire supplémentaire : la vérification se fait côté
-- serveur, sur le payload sauvegardé.
-- ------------------------------------------------------------
create table if not exists public.trades (
  code        text primary key,
  from_user   uuid not null references auth.users(id) on delete cascade,
  card_key    text not null,
  species     integer not null check (species between 1 and 386),
  series      text    not null check (series in ('art','g5','g3','g2','g1','mn')),
  claimed_by  uuid references auth.users(id) on delete set null,
  claimed_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists trades_from_idx on public.trades (from_user, created_at desc);

-- migration depuis la version precedente, ou une carte etait identifiee par la
-- seule espece et un niveau de qualite numerique
alter table public.trades add column if not exists card_key text;
alter table public.trades add column if not exists series   text;
update public.trades
   set series   = coalesce(series, (array['art','g5','g3','g2'])[least(4, greatest(1, coalesce(quality,0) + 1))]),
       card_key = coalesce(card_key,
                    (array['art','g5','g3','g2'])[least(4, greatest(1, coalesce(quality,0) + 1))]
                    || ':' || species::text)
 where card_key is null
   and exists (select 1 from information_schema.columns
               where table_name = 'trades' and column_name = 'quality');
alter table public.trades drop column if exists quality;

alter table public.trades enable row level security;

drop policy if exists trades_select_own on public.trades;
create policy trades_select_own on public.trades
  for select using (auth.uid() = from_user or auth.uid() = claimed_by);

-- genere un code lisible, sans caracteres ambigus
create or replace function public.gen_trade_code()
returns text language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i integer;
begin
  for i in 1..8 loop
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return out;
end $$;

-- ------------------------------------------------------------
-- Proposer une carte.
-- L'identifiant est la cle complete du client, « serie:espece », par exemple
-- « g3:150 ». Le serveur verifie dans la sauvegarde que l'emetteur possede
-- reellement un exemplaire supplementaire de CETTE illustration, puis le
-- decremente : sans cela, un client modifie pourrait dupliquer a l'infini.
-- ------------------------------------------------------------
create or replace function public.offer_card(p_key text)
returns table (code text)
language plpgsql security definer set search_path = public as $$
declare
  v_user    uuid := auth.uid();
  v_series  text;
  v_species integer;
  v_dup     integer;
  v_code    text;
  v_try     integer := 0;
begin
  if v_user is null then
    raise exception 'authentification requise' using errcode = '28000';
  end if;

  v_series  := split_part(p_key, ':', 1);
  v_species := nullif(split_part(p_key, ':', 2), '')::integer;

  if v_series not in ('art','g5','g3','g2','g1','mn')
     or v_species is null or v_species < 1 or v_species > 386 then
    raise exception 'carte invalide : %', p_key using errcode = '22023';
  end if;

  select coalesce((payload -> 'cards' -> p_key ->> 'dup')::int, 0)
    into v_dup
    from public.saves where user_id = v_user;

  if v_dup is null or v_dup < 1 then
    raise exception 'aucun exemplaire supplementaire de cette illustration'
      using errcode = '22023';
  end if;

  if (select count(*) from public.trades
      where from_user = v_user and claimed_by is null) >= 10 then
    raise exception 'trop de propositions en attente' using errcode = '22023';
  end if;

  loop
    v_code := public.gen_trade_code();
    exit when not exists (select 1 from public.trades t where t.code = v_code);
    v_try := v_try + 1;
    if v_try > 12 then
      raise exception 'impossible de generer un code' using errcode = '22023';
    end if;
  end loop;

  insert into public.trades (code, from_user, card_key, species, series)
  values (v_code, v_user, p_key, v_species, v_series);

  update public.saves
     set payload = jsonb_set(payload, array['cards', p_key, 'dup'],
                             to_jsonb(greatest(v_dup - 1, 0)), true)
   where user_id = v_user;

  return query select v_code;
end $$;

-- reclamer une carte : atomique, une seule fois, jamais par son emetteur
create or replace function public.claim_card(p_code text)
returns table (card_key text, species integer, series text)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_row  public.trades%rowtype;
begin
  if v_user is null then
    raise exception 'authentification requise' using errcode = '28000';
  end if;

  update public.trades t
     set claimed_by = v_user, claimed_at = now()
   where t.code = upper(trim(p_code))
     and t.claimed_by is null
     and t.from_user <> v_user
  returning t.* into v_row;

  if v_row.code is null then
    raise exception 'code inconnu, deja utilise, ou emis par vous-meme'
      using errcode = '22023';
  end if;

  return query select v_row.card_key, v_row.species, v_row.series;
end $$;

revoke all on function public.offer_card(text) from public;
revoke all on function public.claim_card(text) from public;
grant execute on function public.offer_card(text) to authenticated;
grant execute on function public.claim_card(text) to authenticated;

-- ------------------------------------------------------------
-- 4. ENTRETIEN
-- Les propositions non réclamées expirent au bout de 90 jours.
-- À planifier avec pg_cron si l'extension est disponible.
-- ------------------------------------------------------------
create or replace function public.purge_old_trades()
returns void language sql security definer set search_path = public as $$
  delete from public.trades
   where claimed_by is null and created_at < now() - interval '90 days';
$$;

-- ============================================================
-- CONFIGURATION RESTANTE, DANS L'INTERFACE SUPABASE
-- ============================================================
-- 1. Authentication > Providers > Email : activer, désactiver « Confirm email »
--    si vous voulez une première connexion immédiate.
-- 2. Authentication > Email Templates > Magic Link : le gabarit doit contenir
--    {{ .Token }}. Sans cela, Supabase n'envoie qu'un lien et le code à six
--    chiffres attendu par le jeu n'existe pas.
-- 3. Authentication > URL Configuration : ajouter l'origine où le jeu est
--    hébergé (GitHub Pages, domaine propre…) dans les URL autorisées.
-- 4. Settings > API : copier « Project URL » et la clé « anon public »,
--    puis les saisir dans le jeu (Profil > En ligne > Compte).
-- ============================================================
