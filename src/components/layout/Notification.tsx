import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  BellDotIcon,
  CheckCheck,
  Trash2,
  TrendingUp,
  FileText,
  Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";

interface StoredNotification {
  id: string;
  title: string;
  description?: string;
  type: "stage_change" | "assessment_created";
  timestamp: number;
  read: boolean;
  candidateId?: string;
  assessmentId?: string;
  metadata?: {
    candidateName?: string;
    fromStage?: string;
    toStage?: string;
    assessmentTitle?: string;
  };
}

const STORAGE_KEY = "talentflow_notifications";
const CHECK_INTERVAL = 10000; // Check every 10 seconds

const getTimeAgo = (timestamp: number): string => {
  const timeDiff = Date.now() - timestamp;
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
};

const stageLabels: Record<string, string> = {
  applied: "Applied",
  screen: "Screening",
  technical: "Technical",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export function NotificationBellWithDialog() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [lastChecked, setLastChecked] = useState<{
    candidates: Map<string, { stage: string; updatedAt: number }>;
    assessments: Set<string>;
  }>({ candidates: new Map(), assessments: new Set() });
  const { toast } = useToast();

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    }

    // Initial data fetch
    checkForUpdates();
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Periodic check for updates
  useEffect(() => {
    const interval = setInterval(checkForUpdates, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [lastChecked]);

  const checkForUpdates = async () => {
    try {
      const [candidatesRes, assessmentsRes] = await Promise.all([
        apiClient.getCandidates({ pageSize: 1000 }),
        apiClient.getAssessments(),
      ]);

      const candidates = candidatesRes.candidates;
      const assessments = assessmentsRes.assessments;
      const newNotifications: StoredNotification[] = [];

      // Check for stage changes
      candidates.forEach((candidate) => {
        const lastKnown = lastChecked.candidates.get(candidate.id);
        const currentUpdatedAt = new Date(candidate.updatedAt).getTime();

        if (lastKnown) {
          // Check if stage changed
          if (
            lastKnown.stage !== candidate.stage &&
            currentUpdatedAt > lastKnown.updatedAt
          ) {
            newNotifications.push({
              id: `stage-${candidate.id}-${Date.now()}`,
              title: `${candidate.name} moved to ${
                stageLabels[candidate.stage]
              }`,
              description: `Stage changed from ${
                stageLabels[lastKnown.stage]
              } to ${stageLabels[candidate.stage]}`,
              type: "stage_change",
              timestamp: currentUpdatedAt,
              read: false,
              candidateId: candidate.id,
              metadata: {
                candidateName: candidate.name,
                fromStage: lastKnown.stage,
                toStage: candidate.stage,
              },
            });
          }
        }
      });

      // Check for new assessments
      assessments.forEach((assessment) => {
        if (!lastChecked.assessments.has(assessment.id)) {
          const createdAt = new Date(assessment.createdAt).getTime();
          // Only notify if created in the last 24 hours
          if (Date.now() - createdAt < 24 * 60 * 60 * 1000) {
            newNotifications.push({
              id: `assessment-${assessment.id}-${Date.now()}`,
              title: `New assessment created: ${assessment.title}`,
              description: assessment.description || undefined,
              type: "assessment_created",
              timestamp: createdAt,
              read: false,
              assessmentId: assessment.id,
              metadata: {
                assessmentTitle: assessment.title,
              },
            });
          }
        }
      });

      // Update last checked state
      const newCandidatesMap = new Map(
        candidates.map((c) => [
          c.id,
          { stage: c.stage, updatedAt: new Date(c.updatedAt).getTime() },
        ])
      );
      const newAssessmentsSet = new Set(assessments.map((a) => a.id));

      setLastChecked({
        candidates: newCandidatesMap,
        assessments: newAssessmentsSet,
      });

      // Add new notifications and show toast
      if (newNotifications.length > 0) {
        setNotifications((prev) => [...newNotifications, ...prev]);

        // Show toast for the first new notification
        toast({
          title: newNotifications[0].title,
          description: newNotifications[0].description,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const getNotificationIcon = (type: StoredNotification["type"]) => {
    switch (type) {
      case "stage_change":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "assessment_created":
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <Circle className="h-4 w-4 text-blue-500" />;
    }
  };
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            aria-label="Show notifications">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 3,
              }}>
              <BellDotIcon className="h-4 w-4" />
            </motion.div>
            {unreadCount > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center border-2 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}>
                <span className="text-[8px] text-white font-bold">
                  {unreadCount}
                </span>
              </motion.div>
            )}
          </Button>
        </motion.div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 p-0"
        sideOffset={8}>
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellDotIcon className="h-4 w-4 text-purple-500" />
              <span className="font-semibold text-foreground">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({unreadCount} unread)
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllAsRead}>
                  <CheckCheck className="h-3 w-3 mr-1" />
                  
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={clearAllNotifications}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <BellDotIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1">
                You'll be notified when candidates change stages or assessments
                are created
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`border-b border-border last:border-b-0 ${
                    !notification.read ? "bg-accent/30" : ""
                  }`}>
                  <div className="px-4 py-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            !notification.read
                              ? "font-semibold text-foreground"
                              : "text-foreground"
                          }`}>
                          {notification.title}
                        </p>
                        {notification.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {getTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
