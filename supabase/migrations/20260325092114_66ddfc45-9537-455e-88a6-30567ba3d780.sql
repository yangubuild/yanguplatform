
-- 1. Extend app_role enum with new agency roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'creator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'influencer';

-- 2. Learning Tracks
CREATE TABLE public.learning_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  role_target text[] NOT NULL DEFAULT '{}',
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read active tracks" ON public.learning_tracks FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage tracks" ON public.learning_tracks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Learning Courses
CREATE TABLE public.learning_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  estimated_minutes int,
  is_required boolean NOT NULL DEFAULT false,
  is_tot_eligible boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read active courses" ON public.learning_courses FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage courses" ON public.learning_courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Learning Lessons
CREATE TABLE public.learning_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  lesson_type text NOT NULL,
  content_url text,
  content_body text,
  duration_minutes int,
  is_required boolean NOT NULL DEFAULT true,
  passing_score numeric(5,2),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_lesson_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.lesson_type NOT IN ('video','text','pdf','quiz','checklist','assignment') THEN
    RAISE EXCEPTION 'Invalid lesson_type: %', NEW.lesson_type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_lesson_type BEFORE INSERT OR UPDATE ON public.learning_lessons FOR EACH ROW EXECUTE FUNCTION public.validate_lesson_type();

ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read active lessons" ON public.learning_lessons FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage lessons" ON public.learning_lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Learning Resources
CREATE TABLE public.learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  resource_type text NOT NULL,
  resource_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_resource_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.resource_type NOT IN ('pdf','link','image','doc','template') THEN
    RAISE EXCEPTION 'Invalid resource_type: %', NEW.resource_type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_resource_type BEFORE INSERT OR UPDATE ON public.learning_resources FOR EACH ROW EXECUTE FUNCTION public.validate_resource_type();

ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read resources" ON public.learning_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage resources" ON public.learning_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. Quiz Questions
CREATE TABLE public.learning_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_question_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.question_type NOT IN ('single_choice','multi_choice','true_false','short_text') THEN
    RAISE EXCEPTION 'Invalid question_type: %', NEW.question_type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_question_type BEFORE INSERT OR UPDATE ON public.learning_quiz_questions FOR EACH ROW EXECUTE FUNCTION public.validate_question_type();

ALTER TABLE public.learning_quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read quiz questions" ON public.learning_quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quiz questions" ON public.learning_quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 7. Quiz Options
CREATE TABLE public.learning_quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.learning_quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.learning_quiz_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read quiz options" ON public.learning_quiz_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quiz options" ON public.learning_quiz_options FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 8. Enrollments
CREATE TABLE public.learning_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id uuid REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_reason text,
  enrollment_status text NOT NULL DEFAULT 'active',
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_enrollment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.enrollment_status NOT IN ('active','completed','paused','revoked') THEN
    RAISE EXCEPTION 'Invalid enrollment_status: %', NEW.enrollment_status;
  END IF;
  IF NOT ((NEW.track_id IS NOT NULL AND NEW.course_id IS NULL) OR (NEW.track_id IS NULL AND NEW.course_id IS NOT NULL)) THEN
    RAISE EXCEPTION 'Enrollment must reference either track_id or course_id, not both or neither';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_enrollment BEFORE INSERT OR UPDATE ON public.learning_enrollments FOR EACH ROW EXECUTE FUNCTION public.validate_enrollment();

ALTER TABLE public.learning_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own enrollments" ON public.learning_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage enrollments" ON public.learning_enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agency admins can manage enrollments" ON public.learning_enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'agency_admin'));

-- 9. Lesson Progress
CREATE TABLE public.learning_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started',
  percent_complete numeric(5,2) NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_position_seconds int,
  last_viewed_at timestamptz,
  UNIQUE(user_id, lesson_id)
);

CREATE OR REPLACE FUNCTION public.validate_lesson_progress_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('not_started','in_progress','completed','failed') THEN
    RAISE EXCEPTION 'Invalid progress status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_lesson_progress_status BEFORE INSERT OR UPDATE ON public.learning_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.validate_lesson_progress_status();

ALTER TABLE public.learning_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own progress" ON public.learning_lesson_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own progress" ON public.learning_lesson_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own progress" ON public.learning_lesson_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all progress" ON public.learning_lesson_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agency admins can read team progress" ON public.learning_lesson_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agency_admin'));

-- 10. Quiz Attempts
CREATE TABLE public.learning_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  score numeric(5,2),
  passed boolean,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own quiz attempts" ON public.learning_quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own quiz attempts" ON public.learning_quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can read all quiz attempts" ON public.learning_quiz_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 11. Course Completions
CREATE TABLE public.learning_course_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  final_score numeric(5,2),
  certificate_issued boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.learning_course_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own course completions" ON public.learning_course_completions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage course completions" ON public.learning_course_completions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agency admins can read team completions" ON public.learning_course_completions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agency_admin'));

-- 12. Track Completions
CREATE TABLE public.learning_track_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id uuid NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

ALTER TABLE public.learning_track_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own track completions" ON public.learning_track_completions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage track completions" ON public.learning_track_completions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 13. Certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  certificate_type text NOT NULL,
  track_id uuid REFERENCES public.learning_tracks(id),
  course_id uuid REFERENCES public.learning_courses(id),
  certificate_code text UNIQUE NOT NULL,
  title text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION public.validate_certificate() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.certificate_type NOT IN ('course','track','tot') THEN
    RAISE EXCEPTION 'Invalid certificate_type: %', NEW.certificate_type;
  END IF;
  IF NEW.status NOT IN ('active','revoked','expired') THEN
    RAISE EXCEPTION 'Invalid certificate status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_certificate BEFORE INSERT OR UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.validate_certificate();

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own certificates" ON public.certificates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agency admins can read team certificates" ON public.certificates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agency_admin'));

-- 14. Learning Role Defaults
CREATE TABLE public.learning_role_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  track_id uuid REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  is_required boolean NOT NULL DEFAULT true,
  UNIQUE(role, track_id, course_id)
);

CREATE OR REPLACE FUNCTION public.validate_role_default() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT ((NEW.track_id IS NOT NULL AND NEW.course_id IS NULL) OR (NEW.track_id IS NULL AND NEW.course_id IS NOT NULL)) THEN
    RAISE EXCEPTION 'Must reference either track_id or course_id, not both or neither';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_role_default BEFORE INSERT OR UPDATE ON public.learning_role_defaults FOR EACH ROW EXECUTE FUNCTION public.validate_role_default();

ALTER TABLE public.learning_role_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read role defaults" ON public.learning_role_defaults FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage role defaults" ON public.learning_role_defaults FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 15. Indexes for performance
CREATE INDEX idx_learning_courses_track ON public.learning_courses(track_id);
CREATE INDEX idx_learning_lessons_course ON public.learning_lessons(course_id);
CREATE INDEX idx_learning_enrollments_user ON public.learning_enrollments(user_id);
CREATE INDEX idx_learning_lesson_progress_user ON public.learning_lesson_progress(user_id);
CREATE INDEX idx_learning_course_completions_user ON public.learning_course_completions(user_id);
CREATE INDEX idx_learning_track_completions_user ON public.learning_track_completions(user_id);
CREATE INDEX idx_certificates_user ON public.certificates(user_id);
CREATE INDEX idx_learning_quiz_attempts_user ON public.learning_quiz_attempts(user_id);
