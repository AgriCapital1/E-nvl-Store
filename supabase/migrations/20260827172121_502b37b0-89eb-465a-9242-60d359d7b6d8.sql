CREATE TABLE public.withdrawal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id uuid NOT NULL REFERENCES public.withdrawals(id) ON DELETE CASCADE,
  developer_id uuid NOT NULL REFERENCES public.developer_profiles(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'email',
  destination text,
  status text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  delivery_status text NOT NULL DEFAULT 'queued',
  delivery_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.withdrawal_notifications TO authenticated;
GRANT ALL ON public.withdrawal_notifications TO service_role;

ALTER TABLE public.withdrawal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers read own withdrawal notifications"
ON public.withdrawal_notifications FOR SELECT TO authenticated
USING (developer_id = public.current_developer_id());

CREATE POLICY "Admins read all withdrawal notifications"
ON public.withdrawal_notifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER withdrawal_notifications_updated
BEFORE UPDATE ON public.withdrawal_notifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.queue_withdrawal_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare _phone text; _subject text; _body text; _channel text; _dest text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;

  select phone into _phone from public.developer_profiles where id = new.developer_id;

  _subject := case new.status
    when 'pending'    then 'Demande de retrait reçue'
    when 'processing' then 'Retrait en cours de traitement'
    when 'completed'  then 'Retrait validé'
    when 'failed'     then 'Retrait échoué'
    when 'rejected'   then 'Retrait refusé'
    when 'cancelled'  then 'Retrait annulé'
    else 'Mise à jour de votre retrait' end;

  _body := format(
    'Votre retrait %s de %s FCFA (net %s FCFA) est désormais au statut : %s.%s',
    new.reference, new.amount_fcfa, new.net_amount_fcfa, new.status,
    coalesce(' Motif : ' || new.failure_reason, ''));

  if _phone is not null and length(_phone) >= 8 then
    _channel := 'whatsapp'; _dest := _phone;
  else
    _channel := 'email'; _dest := null;
  end if;

  insert into public.withdrawal_notifications
    (withdrawal_id, developer_id, channel, destination, status, subject, body)
  values (new.id, new.developer_id, _channel, _dest, new.status, _subject, _body);

  return null;
end;
$$;

REVOKE ALL ON FUNCTION public.queue_withdrawal_notification() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER withdrawals_notify_status
AFTER INSERT OR UPDATE OF status ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.queue_withdrawal_notification();