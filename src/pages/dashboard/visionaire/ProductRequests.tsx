import { useState } from "react";
import { Lightbulb, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ProductRequests() {
  const [request, setRequest] = useState("");
  const [submitted, setSubmitted] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!request.trim()) return toast.error("Enter a product request");
    setSubmitted((prev) => [request, ...prev]);
    setRequest("");
    toast.success("Request submitted! We'll review it shortly.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Product Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Request specific digital products or resources</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-lg">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">What digital product would you like to see in the library?</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="e.g. Canva templates for fitness coaches"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button variant="accent" onClick={handleSubmit}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {submitted.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Your Requests</h2>
          {submitted.map((req, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 text-sm text-foreground">{req}</div>
          ))}
        </div>
      )}
    </div>
  );
}
