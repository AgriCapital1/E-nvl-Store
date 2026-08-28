-- 1) Revoke EXECUTE on privileged / internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.assert_no_negative_balance() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_app_limit() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_app_rating() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.complete_withdrawal(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fail_withdrawal(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_sale(uuid, integer, integer, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_transaction(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.settle_transaction(uuid) FROM anon, authenticated, PUBLIC;

-- 2) User-facing functions: signed-in only, no anonymous execute
REVOKE EXECUTE ON FUNCTION public.become_developer(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.change_plan(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(integer, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_developer_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.developer_balances(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.developer_usage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- 3) Restrict developer review updates to the reply columns only
CREATE OR REPLACE FUNCTION public.enforce_review_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  -- admins and the review author keep full control
  if public.has_role(auth.uid(), 'admin') or old.user_id = auth.uid() then
    return new;
  end if;

  -- developer of the app: may only set the reply fields
  if exists (
    select 1 from public.store_apps sa
    where sa.id = old.store_app_id
      and sa.developer_id = public.current_developer_id()
  ) then
    if new.store_app_id is distinct from old.store_app_id
       or new.user_id      is distinct from old.user_id
       or new.author_name  is distinct from old.author_name
       or new.rating       is distinct from old.rating
       or new.comment      is distinct from old.comment
       or new.language     is distinct from old.language
       or new.status       is distinct from old.status
       or new.helpful_count is distinct from old.helpful_count
       or new.created_at   is distinct from old.created_at then
      raise exception 'DEVELOPER_MAY_ONLY_EDIT_REPLY';
    end if;
    return new;
  end if;

  return new;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_review_update_scope() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS reviews_update_scope ON public.reviews;
CREATE TRIGGER reviews_update_scope
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_update_scope();