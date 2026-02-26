import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface BookingEditorProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
  surfaceId?: string;
}

interface BookingSlot {
  label: string;
  time: string;
  note: string;
}

export function BookingEditor({ schema, update }: BookingEditorProps) {
  const slots = (Array.isArray(schema.slots) ? schema.slots : []) as BookingSlot[];

  const updateSlot = (index: number, patch: Partial<BookingSlot>) => {
    const next = [...slots];
    next[index] = {
      label: next[index]?.label || "",
      time: next[index]?.time || "",
      note: next[index]?.note || "",
      ...patch,
    };
    update({ slots: next });
  };

  const removeSlot = (index: number) => {
    update({ slots: slots.filter((_, i) => i !== index) });
  };

  const addSlot = () => {
    update({ slots: [...slots, { label: "", time: "", note: "" }] });
  };

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">Heading</Label>
        <Input
          value={(schema.heading as string) || ""}
          onChange={(e) => update({ heading: e.target.value })}
          className="text-sm"
          placeholder="Book an Appointment"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea
          value={(schema.description as string) || ""}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          className="text-sm"
          placeholder="Tell visitors how to book"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Booking Slots</Label>
        {slots.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No slots yet. Add the first slot below.</p>
        ) : (
          slots.map((slot, index) => (
            <div key={index} className="rounded-md border border-border p-2 space-y-2 bg-muted/20">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={slot.label || ""}
                  onChange={(e) => updateSlot(index, { label: e.target.value })}
                  className="text-sm"
                  placeholder="Slot label"
                />
                <Input
                  value={slot.time || ""}
                  onChange={(e) => updateSlot(index, { time: e.target.value })}
                  className="text-sm"
                  placeholder="e.g. Mon–Fri 9:00–17:00"
                />
              </div>
              <Input
                value={slot.note || ""}
                onChange={(e) => updateSlot(index, { note: e.target.value })}
                className="text-sm"
                placeholder="Optional note"
              />
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSlot(index)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))
        )}

        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addSlot}>
          <Plus className="h-3.5 w-3.5" /> Add Slot
        </Button>
      </div>
    </>
  );
}
