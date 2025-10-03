import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  
  MapPin,
  Video,
  Phone,
  Users,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Interview {
  id: string;
  candidateId: string;
  type: "phone" | "video" | "in-person" | "technical" | "final";
  title: string;
  date: Date;
  duration: number; // in minutes
  location?: string;
  meetingLink?: string;
  interviewers: string[];
  notes?: string;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
}

interface InterviewSchedulerProps {
  candidateId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
  onScheduled: (interview: Interview) => void;
  existingInterviews?: Interview[];
}

export default function InterviewScheduler({
  candidateId,
  candidateName,
  isOpen,
  onClose,
  onScheduled,
  existingInterviews = [],
}: InterviewSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [interviewType, setInterviewType] =
    useState<Interview["type"]>("phone");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [interviewers, setInterviewers] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const interviewTypes = [
    { value: "phone", label: "Phone Interview", icon: Phone },
    { value: "video", label: "Video Interview", icon: Video },
    { value: "in-person", label: "In-Person Interview", icon: MapPin },
    { value: "technical", label: "Technical Interview", icon: Users },
    { value: "final", label: "Final Interview", icon: Users },
  ];

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ];

  const addInterviewer = () => {
    setInterviewers([...interviewers, ""]);
  };

  const removeInterviewer = (index: number) => {
    setInterviewers(interviewers.filter((_, i) => i !== index));
  };

  const updateInterviewer = (index: number, value: string) => {
    const updated = [...interviewers];
    updated[index] = value;
    setInterviewers(updated);
  };

  const handleSubmit = async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      !title ||
      interviewers.filter((i) => i.trim()).length === 0
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const [hours, minutes] = selectedTime.split(":").map(Number);
      const interviewDate = new Date(selectedDate);
      interviewDate.setHours(hours, minutes, 0, 0);

      const interview: Interview = {
        id: crypto.randomUUID(),
        candidateId,
        type: interviewType,
        title,
        date: interviewDate,
        duration,
        location: interviewType === "in-person" ? location : undefined,
        meetingLink: interviewType === "video" ? meetingLink : undefined,
        interviewers: interviewers.filter((i) => i.trim()),
        notes: notes || undefined,
        status: "scheduled",
      };

      onScheduled(interview);

      toast({
        title: "Interview Scheduled",
        description: `${title} scheduled for ${format(
          interviewDate,
          "PPP"
        )} at ${selectedTime}`,
      });

      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setInterviewType("phone");
    setTitle("");
    setDuration(60);
    setLocation("");
    setMeetingLink("");
    setInterviewers([""]);
    setNotes("");
    onClose();
  };

  const getTypeIcon = (type: Interview["type"]) => {
    const typeConfig = interviewTypes.find((t) => t.value === type);
    if (!typeConfig) return Phone;
    return typeConfig.icon;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleClose}>
      <DialogContent className=" sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            Schedule Interview - {candidateName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Interviews */}
          {existingInterviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Existing Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {existingInterviews.slice(-3).map((interview) => {
                    const TypeIcon = getTypeIcon(interview.type);
                    return (
                      <div
                        key={interview.id}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            {interview.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs text-green-500">
                            {interview.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(interview.date, "MMM d, h:mm a")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date & Time Selection */}
            <div className="space-y-4">
              <div className="space-y-2 w-full">
                <Label>Interview Type</Label>
                <Select
                  value={interviewType}
                  onValueChange={(value) =>
                    setInterviewType(value as Interview["type"])
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem
                          key={type.value}
                          value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Interview Title</Label>
                <Input
                  placeholder="e.g., Technical Interview - Frontend"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 ">
                <div className="space-y-2 ">
                  <Label>Time</Label>
                  <Select
                    value={selectedTime}
                    onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem
                          key={time}
                          value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Select
                    value={duration.toString()}
                    onValueChange={(value) => setDuration(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Interview Details */}
            <div className="space-y-4">
              {/* Location/Meeting Link */}
              {interviewType === "in-person" && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Office address or meeting room"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}

              {interviewType === "video" && (
                <div className="space-y-2">
                  <Label>Meeting Link</Label>
                  <Input
                    placeholder="Zoom, Teams, or Google Meet link"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>
              )}

              {/* Interviewers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Interviewers</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addInterviewer}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {interviewers.map((interviewer, index) => (
                    <div
                      key={index}
                      className="flex gap-2">
                      <Input
                        placeholder="Interviewer name or email"
                        value={interviewer}
                        onChange={(e) =>
                          updateInterviewer(index, e.target.value)
                        }
                      />
                      {interviewers.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeInterviewer(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Special instructions, topics to cover, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
