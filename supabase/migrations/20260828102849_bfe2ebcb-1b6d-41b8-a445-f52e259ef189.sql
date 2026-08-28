REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_install(uuid, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_review_version(uuid, boolean, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.become_developer(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.change_plan(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_app_version(uuid, text, integer, text, bigint, text, text, uuid, jsonb, text) FROM anon, authenticated;