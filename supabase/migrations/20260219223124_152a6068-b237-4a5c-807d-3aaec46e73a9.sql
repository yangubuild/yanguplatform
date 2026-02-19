-- 1) Storage: allow owner to DELETE their own files in ada-uploads
DROP POLICY IF EXISTS "Users delete own ada files" ON storage.objects;
CREATE POLICY "Users delete own ada files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ada-uploads'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 2) Storage: allow admin to manage all ada-uploads files
DROP POLICY IF EXISTS "Admins manage ada-uploads" ON storage.objects;
CREATE POLICY "Admins manage ada-uploads"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'ada-uploads'
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'ada-uploads'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3) ada_media: allow users to DELETE their own rows
DROP POLICY IF EXISTS "Users can delete own media" ON public.ada_media;
CREATE POLICY "Users can delete own media"
ON public.ada_media FOR DELETE
TO authenticated
USING (auth.uid() = user_id);