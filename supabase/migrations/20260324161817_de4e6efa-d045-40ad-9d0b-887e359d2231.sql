-- Add agency roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'foot_soldier';