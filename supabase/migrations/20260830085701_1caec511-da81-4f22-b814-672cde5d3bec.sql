GRANT EXECUTE ON FUNCTION public.agent_resolve_customer(uuid,text,text,text,text,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.agent_normalize_phone(text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.agent_normalize_email(text) TO service_role, authenticated;