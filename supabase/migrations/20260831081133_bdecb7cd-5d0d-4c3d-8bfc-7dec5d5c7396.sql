ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_comment_length_check
  CHECK (comment IS NULL OR char_length(comment) <= 2000);

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_author_name_length_check
  CHECK (author_name IS NULL OR char_length(author_name) <= 80);

CREATE OR REPLACE FUNCTION public.enforce_review_update_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- admins keep full control
  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  -- author: may only edit rating, comment and language
  if old.user_id = auth.uid() then
    if new.store_app_id      is distinct from old.store_app_id
       or new.user_id        is distinct from old.user_id
       or new.status         is distinct from old.status
       or new.helpful_count  is distinct from old.helpful_count
       or new.developer_reply is distinct from old.developer_reply
       or new.developer_replied_at is distinct from old.developer_replied_at
       or new.created_at     is distinct from old.created_at then
      raise exception 'AUTHOR_MAY_ONLY_EDIT_CONTENT';
    end if;
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
$function$;