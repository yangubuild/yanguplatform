
-- Fix search_path on all 9 non-SECURITY-DEFINER trigger/validation functions
-- These are trigger functions so we must preserve RETURNS trigger signature

CREATE OR REPLACE FUNCTION public.prevent_self_dm()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.sender_id = NEW.receiver_id THEN
    RAISE EXCEPTION 'Users cannot send messages to themselves';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_self_follow()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.follower_id = NEW.following_id THEN
    RAISE EXCEPTION 'Users cannot follow themselves';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_role_default()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NOT ((NEW.track_id IS NOT NULL AND NEW.course_id IS NULL) OR (NEW.track_id IS NULL AND NEW.course_id IS NOT NULL)) THEN
    RAISE EXCEPTION 'Must reference either track_id or course_id, not both or neither';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_certificate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.certificate_type NOT IN ('course_completion', 'track_completion', 'achievement') THEN
    RAISE EXCEPTION 'Invalid certificate_type: %', NEW.certificate_type;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('enrolled', 'in_progress', 'completed', 'dropped') THEN
    RAISE EXCEPTION 'Invalid enrollment status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_lesson_progress_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('not_started', 'in_progress', 'completed') THEN
    RAISE EXCEPTION 'Invalid lesson progress status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_lesson_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.lesson_type NOT IN ('video', 'text', 'quiz', 'assignment', 'interactive') THEN
    RAISE EXCEPTION 'Invalid lesson_type: %', NEW.lesson_type;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_question_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.question_type NOT IN ('multiple_choice', 'true_false', 'short_answer', 'essay') THEN
    RAISE EXCEPTION 'Invalid question_type: %', NEW.question_type;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_resource_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.resource_type NOT IN ('pdf', 'video', 'link', 'document', 'image') THEN
    RAISE EXCEPTION 'Invalid resource_type: %', NEW.resource_type;
  END IF;
  RETURN NEW;
END;
$function$;
