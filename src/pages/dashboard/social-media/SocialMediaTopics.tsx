import { MessageCircle } from "lucide-react";

export default function SocialMediaTopics() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-lg font-semibold text-foreground mb-6">Topics</h1>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
          <MessageCircle className="w-10 h-10 text-accent/60" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-2">Content topics</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Organize your content strategy by topic categories and themes.
        </p>
      </div>
    </div>
  );
}
