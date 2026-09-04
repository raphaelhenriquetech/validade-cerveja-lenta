REVOKE EXECUTE ON FUNCTION public.set_company_id_from_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_company_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_company_access(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;