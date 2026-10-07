CREATE POLICY "Admins manage media" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));