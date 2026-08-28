CREATE POLICY "Developers read own build artifacts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'app-builds'
  AND (storage.foldername(name))[1] = public.current_developer_id()::text
);

CREATE POLICY "Admins read all build artifacts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'app-builds' AND public.has_role(auth.uid(), 'admin'));