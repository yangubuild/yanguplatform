-- Prevent self-follows at the database level
DELETE FROM public.follows WHERE follower_id = following_id;

-- Add a validation trigger to prevent self-follows (CHECK constraints must be immutable)
CREATE OR REPLACE FUNCTION public.prevent_self_follow()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.follower_id = NEW.following_id THEN
    RAISE EXCEPTION 'Users cannot follow themselves';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_follow ON public.follows;
CREATE TRIGGER trg_prevent_self_follow
  BEFORE INSERT OR UPDATE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_follow();

-- Also prevent self-DMs
CREATE OR REPLACE FUNCTION public.prevent_self_dm()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sender_id = NEW.receiver_id THEN
    RAISE EXCEPTION 'Users cannot send messages to themselves';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_dm ON public.direct_messages;
CREATE TRIGGER trg_prevent_self_dm
  BEFORE INSERT OR UPDATE ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_dm();