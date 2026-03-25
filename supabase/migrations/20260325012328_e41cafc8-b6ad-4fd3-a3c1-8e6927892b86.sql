INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'agency_admin'::app_role
FROM auth.users u
WHERE u.email IN ('yanguabuild@gmail.com', 'kafeeroaz@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;