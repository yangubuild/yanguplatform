
CREATE OR REPLACE FUNCTION public.admin_get_publish_attempt_logs(p_limit integer DEFAULT 50)
RETURNS SETOF public.publish_attempt_logs
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT * FROM public.publish_attempt_logs
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$;
