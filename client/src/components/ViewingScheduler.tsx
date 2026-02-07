import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface ViewingSchedulerProps {
  propertyId: number;
  propertyTitle: string;
}

export default function ViewingScheduler({ propertyId, propertyTitle }: ViewingSchedulerProps) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: user?.name || "",
    visitorEmail: user?.email || "",
    visitorPhone: "",
    viewingDate: "",
    viewingTime: "10:00",
    duration: 30,
    notes: "",
  });

  const createViewingMutation = trpc.viewings.create.useMutation({
    onSuccess: () => {
      toast.success("Viewing scheduled successfully!");
      setOpen(false);
      setFormData({
        visitorName: user?.name || "",
        visitorEmail: user?.email || "",
        visitorPhone: "",
        viewingDate: "",
        viewingTime: "10:00",
        duration: 30,
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to schedule viewing");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.visitorName || !formData.visitorEmail || !formData.viewingDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const viewingDate = new Date(formData.viewingDate);
    if (viewingDate < new Date()) {
      toast.error("Please select a future date");
      return;
    }

    createViewingMutation.mutate({
      propertyId,
      visitorName: formData.visitorName,
      visitorEmail: formData.visitorEmail,
      visitorPhone: formData.visitorPhone,
      viewingDate,
      viewingTime: formData.viewingTime,
      duration: formData.duration,
      notes: formData.notes,
    });
  };

  if (!isAuthenticated) {
    return (
      <Button disabled className="w-full">
        Sign in to Schedule Viewing
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        <Calendar className="mr-2 h-4 w-4" />
        Schedule Viewing
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Property Viewing</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Property: {propertyTitle}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.visitorName}
                onChange={(e) =>
                  setFormData({ ...formData, visitorName: e.target.value })
                }
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.visitorEmail}
                onChange={(e) =>
                  setFormData({ ...formData, visitorEmail: e.target.value })
                }
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.visitorPhone}
                onChange={(e) =>
                  setFormData({ ...formData, visitorPhone: e.target.value })
                }
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Viewing Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.viewingDate}
                  onChange={(e) =>
                    setFormData({ ...formData, viewingDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Viewing Time *</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.viewingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, viewingTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any special requests or questions?"
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createViewingMutation.isPending}
              >
                {createViewingMutation.isPending ? "Scheduling..." : "Schedule Viewing"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
