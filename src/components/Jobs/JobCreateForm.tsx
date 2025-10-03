import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  X,
  Plus,
  Loader2,
  DollarSign,
  FileText,
  Users,
  BriefcaseBusiness,
  ArrowRightCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job, JobFormData, JobCreateFormProps } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";

export default function JobCreateForm({
  isOpen,
  onClose,
  onSuccess,
  editingJob,
}: JobCreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>(editingJob?.tags || []);

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    trigger,
    watch,
  } = useForm<JobFormData>({
    defaultValues: editingJob
      ? {
          title: editingJob.title,
          department: editingJob.department,
          location: editingJob.location,
          type: editingJob.type,
          description: editingJob.description,
          requirements: editingJob.requirements.join("\n"),
          salaryMin: editingJob.salary.min,
          salaryMax: editingJob.salary.max,
          currency: editingJob.salary.currency,
          tags: editingJob.tags,
        }
      : {
          title: "",
          department: "",
          location: "",
          type: "full-time",
          description: "",
          requirements: "",
          salaryMin: 5000,
          salaryMax: 100000,
          currency: "USD",
          tags: [],
        },
  });

  // Sync tags with form when editing job changes
  useEffect(() => {
    if (editingJob) {
      setTags(editingJob.tags || []);
      setValue("tags", editingJob.tags || []);
    } else {
      setTags([]);
      setValue("tags", []);
    }
  }, [editingJob, setValue]);

  const departments = [
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Customer Success",
    "Operations",
    "Human Resources",
    "Finance",
    "Analytics",
  ];

  const locations = [
    "Remote",
    "San Francisco, CA",
    "New York, NY",
    "Austin, TX",
    "Seattle, WA",
    "Denver, CO",
    "Boston, MA",
    "Chicago, IL",
    "Los Angeles, CA",
    "Miami, FL",
  ];

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setValue("tags", updatedTags);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    setValue("tags", updatedTags);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const onSubmit = async (data: JobFormData) => {
    try {
      setLoading(true);

      // For new jobs, get the next order number
      let orderNumber = editingJob?.order;
      if (!editingJob) {
        // Fetch all jobs to get the maximum order number
        const allJobs = await apiClient.getJobs({ pageSize: 10000 });
        const maxOrder = allJobs.jobs.reduce(
          (max, job) => Math.max(max, job.order),
          0
        );
        orderNumber = maxOrder + 1;
      }

      const jobData = {
        title: data.title,
        slug: generateSlug(data.title),
        department: data.department,
        location: data.location,
        type: data.type,
        status: "active" as const,
        description: data.description,
        requirements: data.requirements.split("\n").filter((req) => req.trim()),
        salary: {
          min: data.salaryMin,
          max: data.salaryMax,
          currency: data.currency,
        },
        tags: tags,
        order: orderNumber, // Sequential order number
      };

      let job: Job;
      if (editingJob) {
        job = await apiClient.updateJob(editingJob.id, jobData);
        toast({
          title: "Success",
          description: "Job updated successfully",
        });
      } else {
        job = await apiClient.createJob(jobData);
        toast({
          title: "Success",
          description: "Job created successfully",
        });
      }

      onSuccess(job);
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${
          editingJob ? "update" : "create"
        } job. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setTags(editingJob?.tags || []);
    setCurrentStep(1);
    setNewTag("");
    onClose();
  };

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof JobFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = [
          "title",
          "department",
          "location",
          "type",
          "salaryMin",
          "salaryMax",
          "currency",
        ];
        break;
      case 2:
        fieldsToValidate = ["description"];
        break;
      case 3:
        fieldsToValidate = ["requirements"];
        break;
    }

    const result = await trigger(fieldsToValidate);

    // Additional validation for salary range
    if (step === 1) {
      const salaryMin = watch("salaryMin");
      const salaryMax = watch("salaryMax");
      if (salaryMin && salaryMax && salaryMin >= salaryMax) {
        return false;
      }
    }

    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const getStepErrors = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          errors.title ||
          errors.department ||
          errors.location ||
          errors.type ||
          errors.salaryMin ||
          errors.salaryMax ||
          errors.currency
        );
      case 2:
        return !!errors.description;
      case 3:
        return !!errors.requirements;
      default:
        return false;
    }
  };

  const stepTitles = [
    "Basic Information",
    "Job Details",
    "Requirements & Skills",
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleClose}>
      <DialogContent className=" sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl  ">
            <BriefcaseBusiness className="h-5 w-5 sm:h-6 sm:w-6 " />
            {editingJob ? "Edit Job" : "Create New Job"}
          </DialogTitle>
          <hr />
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 px-2 sm:px-0">
            {stepTitles.map((title, index) => (
              <div
                key={index}
                className="flex items-center flex-1">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium shrink-0",
                    currentStep > index + 1
                      ? "bg-success text-white"
                      : currentStep === index + 1
                      ? "bg-primary text-primary-foreground"
                      : getStepErrors(index + 1)
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                  {index + 1}
                </div>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium hidden xs:block sm:block truncate">
                  {title}
                </span>
                {index < stepTitles.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 sm:mx-4 min-w-[10px]",
                      currentStep > index + 1 ? "bg-success" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-sm sm:text-base font-medium">
                    Job Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Senior Frontend Developer"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    {...register("title", {
                      required: "Job title is required",
                    })}
                  />
                  {errors.title && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="department"
                    className="text-sm sm:text-base font-medium">
                    Department
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("department", value, { shouldValidate: true })
                    }
                    defaultValue={editingJob?.department}>
                    <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept}
                          value={dept}
                          className="text-sm sm:text-base">
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("department", {
                      required: "Department is required",
                    })}
                  />
                  {errors.department && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.department.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid  lg:grid-cols-2 gap-4 w-full">
                <div className="space-y-2 w-full">
                  <Label
                    htmlFor="location"
                    className="text-sm sm:text-base font-medium">
                    Location
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("location", value, { shouldValidate: true })
                    }
                    defaultValue={editingJob?.location}>
                    <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem
                          key={loc}
                          value={loc}
                          className="text-sm sm:text-base">
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("location", {
                      required: "Location is required",
                    })}
                  />
                  {errors.location && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="type"
                    className="text-sm sm:text-base font-medium">
                    Employment Type
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("type", value as JobFormData["type"], {
                        shouldValidate: true,
                      })
                    }
                    defaultValue={editingJob?.type || "full-time"}>
                    <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="full-time"
                        className="text-sm sm:text-base">
                        Full-time
                      </SelectItem>
                      <SelectItem
                        value="part-time"
                        className="text-sm sm:text-base">
                        Part-time
                      </SelectItem>
                      <SelectItem
                        value="contract"
                        className="text-sm sm:text-base">
                        Contract
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("type", {
                      required: "Employment type is required",
                    })}
                  />
                  {errors.type && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.type.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="salaryMin"
                    className="text-sm sm:text-base font-medium">
                    Minimum Salary
                  </Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    placeholder="Enter Minimum Salary"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    {...register("salaryMin", {
                      required: "Minimum salary is required",
                      min: { value: 0, message: "Salary must be positive" },
                      validate: (value) => {
                        const maxSalary = watch("salaryMax");
                        if (maxSalary && value >= maxSalary) {
                          return "Minimum salary must be less than maximum salary";
                        }
                        return true;
                      },
                    })}
                  />
                  {errors.salaryMin && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.salaryMin.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="salaryMax"
                    className="text-sm sm:text-base font-medium">
                    Maximum Salary
                  </Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    placeholder="Enter Maximum Salary"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    {...register("salaryMax", {
                      required: "Maximum salary is required",
                      min: { value: 0, message: "Salary must be positive" },
                      validate: (value) => {
                        const minSalary = watch("salaryMin");
                        if (minSalary && value <= minSalary) {
                          return "Maximum salary must be greater than minimum salary";
                        }
                        return true;
                      },
                    })}
                  />
                  {errors.salaryMax && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.salaryMax.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="currency"
                    className="text-sm sm:text-base font-medium">
                    Currency
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("currency", value, { shouldValidate: true })
                    }
                    defaultValue={editingJob?.salary.currency || "USD"}>
                    <SelectTrigger className="h-11 sm:h-11 text-sm sm:text-base w-full ">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="USD"
                        className="text-sm sm:text-base">
                        USD
                      </SelectItem>
                      <SelectItem
                        value="EUR"
                        className="text-sm sm:text-base">
                        EUR
                      </SelectItem>
                      <SelectItem
                        value="GBP"
                        className="text-sm sm:text-base">
                        GBP
                      </SelectItem>
                      <SelectItem
                        value="CAD"
                        className="text-sm sm:text-base">
                        CAD
                      </SelectItem>
                      <SelectItem
                        value="INR"
                        className="text-sm sm:text-base">
                        INR
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("currency", {
                      required: "Currency is required",
                    })}
                  />
                  {errors.currency && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.currency.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Job Details */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Job Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                  rows={8}
                  className="min-h-[120px] sm:min-h-[200px] text-sm sm:text-base resize-none"
                  {...register("description", {
                    required: "Job description is required",
                    minLength: {
                      value: 50,
                      message:
                        "Job description must be at least 50 characters long",
                    },
                  })}
                />
                {errors.description && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Provide a detailed description of the role, key
                  responsibilities, and what makes this position attractive to
                  candidates.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Requirements & Skills */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="requirements"
                  className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Requirements
                </Label>
                <Textarea
                  id="requirements"
                  placeholder="List job requirements, one per line..."
                  rows={6}
                  className="min-h-[120px] sm:min-h-[150px] text-sm sm:text-base resize-none"
                  {...register("requirements", {
                    required: "Job requirements are required",
                    minLength: {
                      value: 20,
                      message:
                        "Requirements must be at least 20 characters long",
                    },
                    validate: (value) => {
                      const lines = value
                        .split("\n")
                        .filter((line) => line.trim());
                      if (lines.length < 2) {
                        return "Please provide at least 2 requirements";
                      }
                      return true;
                    },
                  })}
                />
                {errors.requirements && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {errors.requirements.message}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Enter each requirement on a new line (e.g., experience,
                  education, skills)
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Skills & Tags
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill or tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    size="sm"
                    className="h-10 sm:h-11 px-3 sm:px-4">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/30 rounded-lg">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1 text-xs sm:text-sm py-1 px-2">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Add relevant skills, technologies, or keywords that describe
                  this position
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-border">
            <div className="order-2 sm:order-1">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base">
                  Previous
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base">
                Cancel
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base hover:tracking-wide transition-all duration-300">
                  Next
                  <ArrowRightCircle className=" h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingJob ? "Update Job" : "Create Job"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
