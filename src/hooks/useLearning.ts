import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ───────────────────────────────────────────────────

export interface LearningTrack {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  role_target: string[];
  is_required: boolean;
  sort_order: number;
  courses?: LearningCourse[];
}

export interface LearningCourse {
  id: string;
  track_id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  estimated_minutes: number | null;
  is_required: boolean;
  is_tot_eligible: boolean;
  sort_order: number;
  lessons?: LearningLesson[];
}

export interface LearningLesson {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  lesson_type: string;
  content_url: string | null;
  content_body: string | null;
  duration_minutes: number | null;
  is_required: boolean;
  sort_order: number;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: string;
  percent_complete: number;
  started_at: string | null;
  completed_at: string | null;
  last_position_seconds: number | null;
}

export interface CourseCompletion {
  id: string;
  user_id: string;
  course_id: string;
  completed_at: string;
  final_score: number | null;
  certificate_issued: boolean;
}

export interface Certificate {
  id: string;
  user_id: string;
  certificate_type: string;
  track_id: string | null;
  course_id: string | null;
  certificate_code: string;
  title: string;
  issued_at: string;
  expires_at: string | null;
  status: string;
  metadata: Record<string, unknown>;
}

export interface Enrollment {
  id: string;
  user_id: string;
  track_id: string | null;
  course_id: string | null;
  enrollment_status: string;
  due_at: string | null;
  created_at: string;
}

// ─── Hooks ───────────────────────────────────────────────────

export function useLearningTracks() {
  return useQuery({
    queryKey: ["learning-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_tracks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as LearningTrack[];
    },
  });
}

export function useLearningTrackWithCourses(trackSlug: string | undefined) {
  return useQuery({
    queryKey: ["learning-track", trackSlug],
    enabled: !!trackSlug,
    queryFn: async () => {
      const { data: track, error: tErr } = await supabase
        .from("learning_tracks")
        .select("*")
        .eq("slug", trackSlug!)
        .eq("is_active", true)
        .single();
      if (tErr) throw tErr;

      const { data: courses, error: cErr } = await supabase
        .from("learning_courses")
        .select("*")
        .eq("track_id", track.id)
        .eq("is_active", true)
        .order("sort_order");
      if (cErr) throw cErr;

      return { ...track, courses: courses ?? [] } as LearningTrack;
    },
  });
}

export function useLearningCourseWithLessons(courseSlug: string | undefined) {
  return useQuery({
    queryKey: ["learning-course", courseSlug],
    enabled: !!courseSlug,
    queryFn: async () => {
      const { data: course, error: cErr } = await supabase
        .from("learning_courses")
        .select("*")
        .eq("slug", courseSlug!)
        .eq("is_active", true)
        .single();
      if (cErr) throw cErr;

      const { data: lessons, error: lErr } = await supabase
        .from("learning_lessons")
        .select("*")
        .eq("course_id", course.id)
        .eq("is_active", true)
        .order("sort_order");
      if (lErr) throw lErr;

      return { ...course, lessons: lessons ?? [] } as LearningCourse;
    },
  });
}

export function useMyEnrollments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["learning-enrollments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_enrollments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("enrollment_status", "active");
      if (error) throw error;
      return (data ?? []) as Enrollment[];
    },
  });
}

export function useMyLessonProgress(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson-progress", user?.id, courseId],
    enabled: !!user?.id && !!courseId,
    queryFn: async () => {
      // Get lesson IDs for this course
      const { data: lessons } = await supabase
        .from("learning_lessons")
        .select("id")
        .eq("course_id", courseId!);
      const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);
      if (lessonIds.length === 0) return [];

      const { data, error } = await supabase
        .from("learning_lesson_progress")
        .select("*")
        .eq("user_id", user!.id)
        .in("lesson_id", lessonIds);
      if (error) throw error;
      return (data ?? []) as LessonProgress[];
    },
  });
}

export function useMyCourseCompletions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["course-completions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_course_completions")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as CourseCompletion[];
    },
  });
}

export function useMyCertificates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["certificates", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", user!.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Certificate[];
    },
  });
}

export function useMarkLessonProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      lessonId,
      status,
      percentComplete,
      lastPositionSeconds,
    }: {
      lessonId: string;
      status: string;
      percentComplete: number;
      lastPositionSeconds?: number;
    }) => {
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        user_id: user!.id,
        lesson_id: lessonId,
        status,
        percent_complete: percentComplete,
        last_viewed_at: now,
      };
      if (status === "in_progress" || status === "completed") {
        payload.started_at = now;
      }
      if (status === "completed") {
        payload.completed_at = now;
        payload.percent_complete = 100;
      }
      if (lastPositionSeconds !== undefined) {
        payload.last_position_seconds = lastPositionSeconds;
      }

      const { error } = await supabase
        .from("learning_lesson_progress")
        .upsert(payload as never, { onConflict: "user_id,lesson_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
    },
  });
}
