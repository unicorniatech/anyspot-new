import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const CATEGORIES = ["Pilates", "Yoga", "HIIT", "Cycling", "Strength"];

// Format a Date to "YYYY-MM-DDTHH:mm" for datetime-local input
function toLocalInput(dateLike) {
  const d = dateLike ? new Date(dateLike) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  studio_id: "",
  title: "",
  instructor: "",
  category: "Pilates",
  description: "",
  duration_min: 50,
  credits: 3,
  capacity: 12,
  start_time: toLocalInput(new Date(Date.now() + 86400000)),
  image: "",
};

export default function ClassFormDialog({ open, onOpenChange, editing = null }) {
  const qc = useQueryClient();
  const { data: studios = [] } = useQuery({
    queryKey: ["partner-studios"],
    queryFn: api.partnerStudios,
  });

  const [form, setForm] = useState(() => {
    if (editing) {
      return {
        studio_id: editing.studio_id,
        title: editing.title,
        instructor: editing.instructor,
        category: editing.category,
        description: editing.description || "",
        duration_min: editing.duration_min,
        credits: editing.credits,
        capacity: editing.capacity,
        start_time: toLocalInput(editing.start_time),
        image: editing.image || "",
      };
    }
    return { ...emptyForm, studio_id: studios[0]?.id || "" };
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        duration_min: Number(form.duration_min),
        credits: Number(form.credits),
        capacity: Number(form.capacity),
      };
      if (!payload.instructor) delete payload.instructor;
      if (!payload.image) delete payload.image;
      if (editing) {
        return api.updateClass(editing.id, payload);
      }
      return api.createClass(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Class updated" : "Class created");
      qc.invalidateQueries({ queryKey: ["partner-classes"] });
      qc.invalidateQueries({ queryKey: ["partner-overview"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Failed to save"),
  });

  const setField = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-white" data-testid="class-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#0E0E52] flex items-center gap-2">
            <Sparkles size={18} className="text-[#FF8552]" />
            {editing ? "Edit class" : "Add a class"}
          </DialogTitle>
          <DialogDescription className="text-[#4A4A7A]">
            {editing ? "Update class details. Capacity changes adjust open spots." : "List a new session on AnySpot. Goes live instantly."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">Studio</Label>
              <Select value={form.studio_id} onValueChange={setField("studio_id")}>
                <SelectTrigger data-testid="form-studio" className="mt-1.5"><SelectValue placeholder="Pick a studio" /></SelectTrigger>
                <SelectContent>
                  {studios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">Category</Label>
              <Select value={form.category} onValueChange={setField("category")}>
                <SelectTrigger data-testid="form-category" className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">Class title</Label>
            <Input
              data-testid="form-title"
              className="mt-1.5"
              placeholder="e.g. Sunset Reformer"
              value={form.title}
              onChange={setField("title")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">Instructor</Label>
              <Input
                data-testid="form-instructor"
                className="mt-1.5"
                placeholder="Leaves blank → studio default"
                value={form.instructor}
                onChange={setField("instructor")}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">Start time</Label>
              <Input
                data-testid="form-start"
                type="datetime-local"
                className="mt-1.5"
                value={form.start_time}
                onChange={setField("start_time")}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">Duration (min)</Label>
              <Input data-testid="form-duration" type="number" min="15" max="180" className="mt-1.5" value={form.duration_min} onChange={setField("duration_min")} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">Credits</Label>
              <Input data-testid="form-credits" type="number" min="1" max="10" className="mt-1.5" value={form.credits} onChange={setField("credits")} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">Capacity</Label>
              <Input data-testid="form-capacity" type="number" min="1" max="100" className="mt-1.5" value={form.capacity} onChange={setField("capacity")} />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">Description</Label>
            <Textarea
              data-testid="form-description"
              className="mt-1.5"
              rows={3}
              placeholder="What can attendees expect?"
              value={form.description}
              onChange={setField("description")}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="form-cancel">Cancel</Button>
          <Button
            data-testid="form-save"
            disabled={save.isPending || !form.studio_id || !form.title}
            onClick={() => save.mutate()}
            className="bg-[#FF8552] hover:bg-[#E57545] text-white"
          >
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Publish class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
