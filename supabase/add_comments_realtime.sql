-- Enable live comment updates across open feed cards

alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.comment_images;
