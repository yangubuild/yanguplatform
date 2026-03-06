
-- Create visionaire product requests table
CREATE TABLE public.visionaire_product_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'idea',
  votes_count integer NOT NULL DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visionaire_product_requests ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active requests"
  ON public.visionaire_product_requests FOR SELECT
  USING (is_active = true);

-- Authenticated users can insert
CREATE POLICY "Auth users can create requests"
  ON public.visionaire_product_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create votes table
CREATE TABLE public.visionaire_request_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.visionaire_product_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, user_id)
);

ALTER TABLE public.visionaire_request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON public.visionaire_request_votes FOR SELECT
  USING (true);

CREATE POLICY "Auth users can vote"
  ON public.visionaire_request_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes"
  ON public.visionaire_request_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update votes_count
CREATE OR REPLACE FUNCTION public.update_request_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.visionaire_product_requests SET votes_count = votes_count + 1, updated_at = now() WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.visionaire_product_requests SET votes_count = votes_count - 1, updated_at = now() WHERE id = OLD.request_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_votes_count
  AFTER INSERT OR DELETE ON public.visionaire_request_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_request_votes_count();

-- Seed with data from the source screenshot
INSERT INTO public.visionaire_product_requests (title, description, status, votes_count) VALUES
('Complete Guide and Ebook to Vitamins, Minerals & Healing Herbs', 'A practical guide explaining what vitamins, minerals, and herbs do, who needs them, and how to take them safely for real health benefits. without confusion or medical jargon.', 'idea', 45),
('using advantage+ in meta ad campaigns', 'how to structure campaigns in advantage+', 'idea', 20),
('How to Grow on Substack', 'A full suite of products to support writers with understanding and thriving on Substack.', 'idea', 21),
('Neuromarketing Made Simple', 'Think advertising don''t affect you? Discover how smart neuromarketing secretly shapes buying decisions. Learn practical, proven tactics you can use to ethically boost your sales and revenue today.', 'idea', 24),
('The Complete Guide to Prompt Engineering', 'Master the art of crafting effective prompts for AI models. Includes templates, frameworks, and real-world examples.', 'planned', 38),
('Digital Product Launch Playbook', 'Step-by-step system for launching digital products that sell. Covers pre-launch, launch day, and post-launch strategies.', 'planned', 32),
('SEO Mastery for Content Creators', 'Everything content creators need to know about SEO in 2026. From keyword research to technical optimization.', 'planned', 28),
('The Ultimate Notion Template Pack', 'A comprehensive collection of Notion templates for business planning, content management, and project tracking.', 'completed', 67),
('Email Marketing Automation Blueprint', 'Complete guide to setting up automated email sequences that convert subscribers into customers.', 'completed', 54),
('Social Media Analytics Dashboard', 'Track and analyze your social media performance across all platforms with actionable insights.', 'completed', 41);
