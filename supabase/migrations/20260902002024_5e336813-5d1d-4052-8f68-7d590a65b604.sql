create or replace function public.enforce_review_update_scope()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $func$
BEGIN
  -- Admins keep full control
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN new;
  END IF;

  -- Developer owning the reviewed app: may only write the reply fields
  IF old.user_id IS DISTINCT FROM auth.uid() THEN
    IF EXISTS (
      SELECT 1 FROM public.store_apps sa
      WHERE sa.id = old.store_app_id
        AND sa.developer_id = public.current_developer_id()
    ) THEN
      IF new.store_app_id IS DISTINCT FROM old.store_app_id
        OR new.user_id IS DISTINCT FROM old.user_id
        OR new.author_name IS DISTINCT FROM old.author_name
        OR new.rating IS DISTINCT FROM old.rating
        OR new.comment IS DISTINCT FROM old.comment
        OR new.status IS DISTINCT FROM old.status THEN
        RAISE EXCEPTION 'developers may only update reply fields';
      END IF;
      RETURN new;
    END IF;
    RAISE EXCEPTION 'not allowed to update this review';
  END IF;

  -- Author: may only change rating and comment
  IF new.rating IS NULL OR new.rating < 1 OR new.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF new.store_app_id IS DISTINCT FROM old.store_app_id
    OR new.user_id IS DISTINCT FROM old.user_id
    OR new.author_name IS DISTINCT FROM old.author_name
    OR new.status IS DISTINCT FROM old.status
    OR new.developer_reply IS DISTINCT FROM old.developer_reply
    OR new.developer_replied_at IS DISTINCT FROM old.developer_replied_at THEN
    RAISE EXCEPTION 'authors may only update rating and comment';
  END IF;
  RETURN new;
END;
$func$;