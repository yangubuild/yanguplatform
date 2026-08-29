import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomers } from "../data/customersHooks";
import { PageHeader } from "../components/PageHeader";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const { data: customers = [], isLoading, error, refetch } = useCustomers(search);
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="One identity per customer across calls, conversations, leads and appointments."
      />

      <div className="max-w-sm">
        <Input
          placeholder="Search by name, phone, email or company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <span>Could not load customers.</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && !error && customers.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No customers yet. Customers are created automatically when a call, conversation or lead
          arrives with a phone number or email.
        </div>
      )}

      {customers.length > 0 && (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last interaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/dashboard/agents/customers/${c.id}`)}
                >
                  <TableCell className="font-medium">{c.name ?? "Unnamed customer"}</TableCell>
                  <TableCell className="text-sm">{c.phoneE164 ?? c.phone ?? "—"}</TableCell>
                  <TableCell className="text-sm">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-sm">{c.company ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{c.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.lastInteractionAt ? new Date(c.lastInteractionAt).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
