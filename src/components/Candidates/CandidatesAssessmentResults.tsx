import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  candidateId: string;
  submittedAt: Date;
  timeSpent: number; // in seconds
  totalQuestions: number;
  answeredQuestions: number;
  score: number; // 0-100
  maxScore: number;
  status: "completed" | "in-progress" | "not-started" | "expired";
  sections: AssessmentSectionResult[];
}

export interface AssessmentSectionResult {
  id: string;
  sectionTitle: string;
  questions: QuestionResult[];
  score: number;
  maxScore: number;
  timeSpent: number;
}

export interface QuestionResult {
  id: string;
  questionText: string;
  questionType:
    | "single-choice"
    | "multi-choice"
    | "short-text"
    | "long-text"
    | "numeric"
    | "file-upload";
  answer: any;
  correctAnswer?: any;
  isCorrect?: boolean;
  score: number;
  maxScore: number;
  timeSpent: number;
}

interface AssessmentResultsProps {
  results: AssessmentResult[];
  onViewDetails: (result: AssessmentResult) => void;
  onDownloadReport: (result: AssessmentResult) => void;
  className?: string;
}

export default function AssessmentResults({
  results,
  onViewDetails,
  onDownloadReport,
  className,
}: AssessmentResultsProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const getScoreColor = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getStatusBadge = (status: AssessmentResult["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="status-badge status-success">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="status-badge status-warning">
            <Clock className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case "not-started":
        return (
          <Badge className="status-badge status-pending">
            <AlertCircle className="mr-1 h-3 w-3" />
            Not Started
          </Badge>
        );
      case "expired":
        return (
          <Badge className="status-badge status-rejected">
            <XCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return <Badge className="status-badge">{status}</Badge>;
    }
  };

  const calculateOverallStats = () => {
    const completedResults = results.filter((r) => r.status === "completed");
    if (completedResults.length === 0) {
      return { averageScore: 0, totalTimeSpent: 0, completionRate: 0 };
    }

    const totalScore = completedResults.reduce((sum, r) => sum + r.score, 0);
    const totalMaxScore = completedResults.reduce(
      (sum, r) => sum + r.maxScore,
      0
    );
    const totalTimeSpent = completedResults.reduce(
      (sum, r) => sum + r.timeSpent,
      0
    );

    return {
      averageScore:
        totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0,
      totalTimeSpent,
      completionRate: Math.round(
        (completedResults.length / results.length) * 100
      ),
    };
  };

  const stats = calculateOverallStats();

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}>
        <Card className={className}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            </motion.div>
            <motion.h3
              className="text-lg font-medium text-foreground mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}>
              No Assessment Results
            </motion.h3>
            <motion.p
              className="text-muted-foreground text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}>
              Assessment results will appear here once the candidate completes
              them
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("space-y-6", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium  flex items-center gap-2 text-purple-500">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 100, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}>
                  <BarChart3 className="h-4 w-4 text-green-500" />
                </motion.div>
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className={cn(
                  "text-2xl font-bold",
                  getScoreColor(stats.averageScore, 100)
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 150 }}>
                {stats.averageScore}%
              </motion.div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                style={{ transformOrigin: "left" }}>
                <Progress
                  value={stats.averageScore}
                  className="mt-2 h-2"
                />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-500 flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 100, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}>
                  <Clock className="h-4 w-4" />
                </motion.div>
                Total Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold text-orange-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 150 }}>
                {formatTime(stats.totalTimeSpent)}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                across all assessments
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-500 flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}>
                  <CheckCircle className="h-4 w-4" />
                </motion.div>
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold text-green-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 150 }}>
                {stats.completionRate}%
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                {results.filter((r) => r.status === "completed").length} of{" "}
                {results.length} completed
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Assessment Results List */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}>
        <AnimatePresence mode="popLayout">
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}>
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {result.assessmentTitle}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <motion.span
                          className="flex items-center gap-1"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}>
                          <Clock className="h-4 w-4" />
                          {formatTime(result.timeSpent)}
                        </motion.span>
                        {result.submittedAt && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.0 + index * 0.1 }}>
                            Submitted{" "}
                            {format(
                              result.submittedAt,
                              "MMM d, yyyy 'at' h:mm a"
                            )}
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 100, scale: 1 }}
                      transition={{
                        delay: 1.0 + index * 0.1,
                        type: "spring",
                        stiffness: 200,
                      }}>
                      {getStatusBadge(result.status)}
                    </motion.div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {result.status === "completed" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.1 + index * 0.1, duration: 0.4 }}>
                      {/* Overall Score */}
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + index * 0.1 }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Overall Score
                          </span>
                          <motion.span
                            className={cn(
                              "font-bold",
                              getScoreColor(result.score, result.maxScore)
                            )}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 1.3 + index * 0.1,
                              type: "spring",
                              stiffness: 200,
                            }}>
                            {result.score}/{result.maxScore} (
                            {Math.round((result.score / result.maxScore) * 100)}
                            %)
                          </motion.span>
                        </div>
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{
                            delay: 1.4 + index * 0.1,
                            duration: 0.6,
                          }}
                          style={{ transformOrigin: "left" }}>
                          <Progress
                            value={(result.score / result.maxScore) * 100}
                            className="h-2"
                          />
                        </motion.div>
                      </motion.div>

                      {/* Section Breakdown */}
                      <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 + index * 0.1 }}>
                        <h4 className="text-sm font-medium">
                          Section Breakdown
                        </h4>
                        <div className="space-y-2">
                          {result.sections.map((section, sectionIndex) => (
                            <motion.div
                              key={section.id}
                              className="flex items-center justify-between text-sm"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: 1.6 + index * 0.1 + sectionIndex * 0.05,
                              }}>
                              <span className="text-muted-foreground">
                                {section.sectionTitle}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "font-medium",
                                    getScoreColor(
                                      section.score,
                                      section.maxScore
                                    )
                                  )}>
                                  {section.score}/{section.maxScore}
                                </span>
                                <motion.div
                                  className="w-16"
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{
                                    delay:
                                      1.7 + index * 0.1 + sectionIndex * 0.05,
                                    duration: 0.4,
                                  }}
                                  style={{ transformOrigin: "left" }}>
                                  <Progress
                                    value={
                                      (section.score / section.maxScore) * 100
                                    }
                                    className="h-1"
                                  />
                                </motion.div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Question Stats */}
                      <motion.div
                        className="grid grid-cols-2 gap-4 text-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.8 + index * 0.1 }}>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Questions Answered
                          </span>
                          <span className="font-medium">
                            {result.answeredQuestions}/{result.totalQuestions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Completion
                          </span>
                          <span className="font-medium">
                            {Math.round(
                              (result.answeredQuestions /
                                result.totalQuestions) *
                                100
                            )}
                            %
                          </span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {result.status === "in-progress" && (
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + index * 0.1 }}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {result.answeredQuestions}/{result.totalQuestions}{" "}
                          questions
                        </span>
                      </div>
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 1.3 + index * 0.1, duration: 0.6 }}
                        style={{ transformOrigin: "left" }}>
                        <Progress
                          value={
                            (result.answeredQuestions / result.totalQuestions) *
                            100
                          }
                          className="h-2"
                        />
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <motion.div
                    className="flex gap-2 pt-2 border-t border-border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.9 + index * 0.1 }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(result)}
                        disabled={result.status === "not-started"}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </motion.div>

                    {result.status === "completed" && (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDownloadReport(result)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download Report
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
