import { useMyCertificates } from "@/hooks/useLearning";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function AgencyCertificates() {
  const { data: certificates, isLoading } = useMyCertificates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const certs = certificates ?? [];

  const typeLabels: Record<string, string> = {
    course: "Course",
    track: "Track",
    tot: "Training of Trainers",
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    revoked: "bg-destructive/10 text-destructive border-destructive/20",
    expired: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
        <p className="text-muted-foreground mt-1">Your earned certifications and credentials</p>
      </div>

      {certs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Award className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No certificates yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Complete courses and learning tracks to earn certificates. They'll appear here.
            </p>
            <Link to="/learning" className="text-sm text-accent hover:underline mt-4">
              Go to Learning Center →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certs.map(cert => (
            <Card key={cert.id} className="relative overflow-hidden">
              {cert.certificate_type === "tot" && (
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-yellow-500/10 text-yellow-600 text-[10px] font-semibold rounded-bl-lg flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> TOT
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                    <Award className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm">{cert.title}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {typeLabels[cert.certificate_type] ?? cert.certificate_type} Certificate
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className={statusColors[cert.status] ?? ""}>
                    {cert.status}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground font-mono">
                  Code: {cert.certificate_code}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
