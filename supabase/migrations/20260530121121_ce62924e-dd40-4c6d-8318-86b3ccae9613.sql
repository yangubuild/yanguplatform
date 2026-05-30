
UPDATE storage.buckets
   SET file_size_limit = 20971520, -- 20 MB
       allowed_mime_types = ARRAY[
         'image/png','image/jpeg','image/webp','image/gif',
         'video/mp4','video/webm','video/quicktime'
       ]
 WHERE id IN ('post-media','social-library');
