REVOKE ALL ON FUNCTION public.record_sale(uuid, integer, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_transaction(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_transaction(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_withdrawal(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_withdrawal(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_pwa_build_status(uuid, text, smallint, text, bigint, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_sale(uuid, integer, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_transaction(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_transaction(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_withdrawal(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_withdrawal(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_pwa_build_status(uuid, text, smallint, text, bigint, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.assert_no_negative_balance() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_app_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_review_update_scope() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_withdrawal_notification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_app_rating() FROM PUBLIC, anon, authenticated;