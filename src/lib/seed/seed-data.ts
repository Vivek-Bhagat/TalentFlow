import { faker } from "@faker-js/faker";
import { db } from "../../config/database";
import type {
  Job,
  Candidate,
  Assessment,
  AssessmentSection,
  Question,
} from "@/types";

const jobTitles = [
  "Senior Frontend Developer",
  "Backend Engineer",
  "Full Stack Developer",
  "Product Manager",
  "UI/UX Designer",
  "Data Scientist",
  "DevOps Engineer",
  "Software Architect",
  "QA Engineer",
  "Mobile Developer",
  "Security Engineer",
  "Marketing Manager",
  "Sales Representative",
  "Customer Success Manager",
  "HR Generalist",
  "Finance Analyst",
  "Operations Manager",
  "Technical Writer",
  "Business Analyst",
  "Project Manager",
  "Scrum Master",
  "React Developer",
  "Node.js Developer",
  "Python Developer",
  "Java Developer",
];

const departments = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "DevOps",
  "Marketing",
  "Sales",
  "Customer Success",
  "Human Resources",
  "Finance",
  "Operations",
];

const skills = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Java",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Git",
  "Agile",
  "Scrum",
  "Leadership",
  "Communication",
  "Problem Solving",
  "Figma",
  "Adobe Creative Suite",
  "User Research",
  "Prototyping",
  "Machine Learning",
  "Data Analysis",
  "SQL",
  "Tableau",
  "Power BI",
  "Marketing Analytics",
  "SEO",
  "Content Marketing",
  "Social Media",
  "Salesforce",
  "HubSpot",
  "Excel",
  "Financial Modeling",
];

const stages = [
  "applied",
  "screen",
  "technical",
  "offer",
  "hired",
  "rejected",
] as const;

export async function seedDatabase() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await Promise.all([
    db.jobs.clear(),
    db.candidates.clear(),
    db.notes.clear(),
    db.assessments.clear(),
    db.assessmentResponses.clear(),
  ]);

  // Seed jobs
  const jobs: Job[] = [];
  for (let i = 0; i < 25; i++) {
    const title = faker.helpers.arrayElement(jobTitles);
    const department = faker.helpers.arrayElement(departments);
    const job: Job = {
      id: `job-${String(i + 1).padStart(4, "0")}`,
      title,
      slug: `${title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}-${faker.string.alphanumeric(6)}`,
      department,
      location:
        faker.location.city() +
        ", " +
        faker.location.state({ abbreviated: true }),
      type: faker.helpers.arrayElement(["full-time", "part-time", "contract"]),
      status: faker.helpers.arrayElement([
        "active",
        "active",
        "active",
        "archived",
      ]), // 75% active
      description: faker.lorem.paragraphs(3),
      requirements: faker.helpers.arrayElements(skills, { min: 3, max: 8 }),
      salary: {
        min: faker.number.int({ min: 60000, max: 120000 }),
        max: faker.number.int({ min: 120000, max: 200000 }),
        currency: "USD",
      },
      tags: faker.helpers.arrayElements(
        ["remote", "hybrid", "senior", "junior", "urgent", "new team"],
        { min: 1, max: 3 }
      ),
      order: i, // Display order (changes when reordered)
      createdAt: faker.date.recent({ days: 90 }),
      updatedAt: faker.date.recent({ days: 30 }),
      applicationCount: faker.number.int({ min: 0, max: 150 }),
    };
    jobs.push(job);
  }
  await db.jobs.bulkAdd(jobs);

  // Seed candidates
  const candidates: Candidate[] = [];
  for (let i = 0; i < 1000; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const randomJob = faker.helpers.arrayElement(jobs);

    const candidate: Candidate = {
      id: faker.string.uuid(),
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }),
      phone: faker.phone.number(),
      location:
        faker.location.city() +
        ", " +
        faker.location.state({ abbreviated: true }),
      position: faker.helpers.arrayElement(jobTitles),
      jobId: randomJob.id,
      stage: faker.helpers.arrayElement(stages),
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      appliedAt: faker.date.recent({ days: 60 }),
      updatedAt: faker.date.recent({ days: 10 }),
      skills: faker.helpers.arrayElements(skills, { min: 3, max: 12 }),
      experience: `${faker.number.int({ min: 1, max: 15 })} years`,
      notes: [],
    };
    candidates.push(candidate);
  }
  await db.candidates.bulkAdd(candidates);

  // Helper function to create job-specific questions
  const createJobSpecificQuestions = (job: Job): AssessmentSection[] => {
    const sections: AssessmentSection[] = [];
    const isEngineering = job.department === "Engineering";
    const isDesign = job.department === "Design";
    const isProduct = job.department === "Product";
    const isMarketing = job.department === "Marketing";
    const isSales = job.department === "Sales";

    // Section 1: Experience & Background
    const backgroundQuestions: Question[] = [];

    const experienceQ = {
      id: faker.string.uuid(),
      type: "single-choice" as const,
      text: `What is your experience level with ${
        job.requirements[0] || "this field"
      }?`,
      description: "This helps us understand your background",
      required: true,
      order: 0,
      options: [
        "Beginner (< 1 year)",
        "Intermediate (1-3 years)",
        "Advanced (3-5 years)",
        "Expert (5+ years)",
      ],
    };
    backgroundQuestions.push(experienceQ);

    // Conditional question based on experience
    const detailExperienceQ = {
      id: faker.string.uuid(),
      type: "long-text" as const,
      text: "Please describe your most significant project or achievement in this role.",
      description: "Share details about impact, challenges, and outcomes",
      required: true,
      order: 1,
      validation: { minLength: 100, maxLength: 1000 },
      conditional: {
        dependsOn: experienceQ.id,
        showWhen: "Expert (5+ years)",
      },
    };
    backgroundQuestions.push(detailExperienceQ);

    if (isEngineering) {
      backgroundQuestions.push({
        id: faker.string.uuid(),
        type: "multi-choice" as const,
        text: "Which technologies from our stack have you worked with?",
        description: "Select all that apply",
        required: true,
        order: 2,
        options: job.requirements.slice(0, 8),
      });

      const codingQ = {
        id: faker.string.uuid(),
        type: "single-choice" as const,
        text: "Do you have experience with system design and architecture?",
        required: true,
        order: 3,
        options: ["Yes", "No", "Some exposure"],
      };
      backgroundQuestions.push(codingQ);

      // Conditional question
      backgroundQuestions.push({
        id: faker.string.uuid(),
        type: "long-text" as const,
        text: "Describe a complex system you designed and the trade-offs you considered.",
        required: false,
        order: 4,
        validation: { minLength: 150, maxLength: 800 },
        conditional: {
          dependsOn: codingQ.id,
          showWhen: "Yes",
        },
      });
    } else if (isDesign) {
      backgroundQuestions.push({
        id: faker.string.uuid(),
        type: "multi-choice" as const,
        text: "Which design tools are you proficient with?",
        required: true,
        order: 2,
        options: [
          "Figma",
          "Sketch",
          "Adobe XD",
          "Photoshop",
          "Illustrator",
          "InVision",
          "Principle",
        ],
      });

      backgroundQuestions.push({
        id: faker.string.uuid(),
        type: "file-upload" as const,
        text: "Please upload your portfolio (PDF, max 10MB)",
        description: "Share 3-5 of your best projects",
        required: false,
        order: 3,
      });
    } else if (isProduct) {
      backgroundQuestions.push({
        id: faker.string.uuid(),
        type: "multi-choice" as const,
        text: "Which product management methodologies have you used?",
        required: true,
        order: 2,
        options: [
          "Agile/Scrum",
          "Lean",
          "Design Thinking",
          "OKRs",
          "RICE Prioritization",
          "Jobs-to-be-Done",
        ],
      });
    }

    sections.push({
      id: faker.string.uuid(),
      title: "Experience & Background",
      description: `Tell us about your experience in ${job.title}`,
      questions: backgroundQuestions,
      order: 0,
    });

    // Section 2: Technical/Domain Skills
    const skillsQuestions: Question[] = [];

    if (isEngineering) {
      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "long-text" as const,
        text: "Describe a challenging bug you debugged. What was your approach?",
        required: true,
        order: 0,
        validation: { minLength: 100, maxLength: 800 },
      });

      const testingQ = {
        id: faker.string.uuid(),
        type: "single-choice" as const,
        text: "How do you approach testing your code?",
        required: true,
        order: 1,
        options: [
          "Unit tests only",
          "Integration tests only",
          "Both unit and integration",
          "E2E tests",
          "Manual testing",
        ],
      };
      skillsQuestions.push(testingQ);

      // Conditional question
      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "short-text" as const,
        text: "What testing frameworks do you use?",
        required: false,
        order: 2,
        validation: { maxLength: 200 },
        conditional: {
          dependsOn: testingQ.id,
          showWhen: "Both unit and integration",
        },
      });

      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "numeric" as const,
        text: "How many years of experience do you have with version control (Git)?",
        required: true,
        order: 3,
        validation: { min: 0, max: 20 },
      });
    } else if (isDesign) {
      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "long-text" as const,
        text: "Walk us through your design process from research to final delivery.",
        required: true,
        order: 0,
        validation: { minLength: 150, maxLength: 1000 },
      });

      const researchQ = {
        id: faker.string.uuid(),
        type: "single-choice" as const,
        text: "Do you conduct user research?",
        required: true,
        order: 1,
        options: [
          "Yes, regularly",
          "Yes, occasionally",
          "No, but interested",
          "No",
        ],
      };
      skillsQuestions.push(researchQ);

      // Conditional question
      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "multi-choice" as const,
        text: "Which user research methods have you used?",
        required: false,
        order: 2,
        options: [
          "User interviews",
          "Surveys",
          "Usability testing",
          "A/B testing",
          "Card sorting",
          "Heuristic evaluation",
        ],
        conditional: {
          dependsOn: researchQ.id,
          showWhen: "Yes, regularly",
        },
      });
    } else if (isProduct) {
      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "long-text" as const,
        text: "Describe how you prioritize features when you have conflicting stakeholder requests.",
        required: true,
        order: 0,
        validation: { minLength: 100, maxLength: 800 },
      });

      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "single-choice" as const,
        text: "How do you measure product success?",
        required: true,
        order: 1,
        options: [
          "User metrics (DAU/MAU)",
          "Revenue/Growth",
          "Customer satisfaction",
          "Feature adoption",
          "All of the above",
        ],
      });
    } else if (isMarketing) {
      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "multi-choice" as const,
        text: "Which marketing channels have you managed?",
        required: true,
        order: 0,
        options: [
          "Social Media",
          "Email Marketing",
          "Content Marketing",
          "SEO",
          "PPC/Paid Ads",
          "Events",
          "Partnerships",
        ],
      });

      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "long-text" as const,
        text: "Describe a successful marketing campaign you led and its results.",
        required: true,
        order: 1,
        validation: { minLength: 100, maxLength: 800 },
      });
    } else if (isSales) {
      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "numeric" as const,
        text: "What was your quota attainment percentage in your last role?",
        description: "Enter a number between 0-200",
        required: true,
        order: 0,
        validation: { min: 0, max: 200 },
      });

      skillsQuestions.push({
        id: faker.string.uuid(),
        type: "long-text" as const,
        text: "Describe your approach to closing a complex B2B deal.",
        required: true,
        order: 1,
        validation: { minLength: 100, maxLength: 800 },
      });
    }

    skillsQuestions.push({
      id: faker.string.uuid(),
      type: "numeric" as const,
      text: "On a scale of 1-10, rate your proficiency in this role.",
      required: true,
      order: skillsQuestions.length,
      validation: { min: 1, max: 10 },
    });

    sections.push({
      id: faker.string.uuid(),
      title: isEngineering
        ? "Technical Skills"
        : isDesign
        ? "Design Skills"
        : `${job.department} Skills`,
      description: "Deep dive into your domain expertise",
      questions: skillsQuestions,
      order: 1,
    });

    // Section 3: Problem Solving & Scenarios
    const scenarioQuestions: Question[] = [];

    if (isEngineering) {
      scenarioQuestions.push({
        id: faker.string.uuid(),
        type: "long-text" as const,
        text: "You notice a production bug affecting 10% of users. Walk through your incident response process.",
        required: true,
        order: 0,
        validation: { minLength: 150, maxLength: 1000 },
      });

      const codeReviewQ = {
        id: faker.string.uuid(),
        type: "single-choice" as const,
        text: "How do you handle disagreements during code reviews?",
        required: true,
        order: 1,
        options: [
          "Discuss synchronously",
          "Provide detailed comments",
          "Escalate to tech lead",
          "Compromise",
          "Defer to author",
        ],
      };
      scenarioQuestions.push(codeReviewQ);

      scenarioQuestions.push({
        id: faker.string.uuid(),
        type: "short-text" as const,
        text: "What's your approach to technical debt?",
        required: true,
        order: 2,
        validation: { minLength: 50, maxLength: 300 },
      });
    } else if (isDesign) {
      scenarioQuestions.push({
        id: faker.string.uuid(),
        type: "long-text" as const,
        text: "A stakeholder disagrees with your design direction. How do you handle this?",
        required: true,
        order: 0,
        validation: { minLength: 100, maxLength: 800 },
      });

      scenarioQuestions.push({
        id: faker.string.uuid(),
        type: "single-choice" as const,
        text: "When faced with tight deadlines, how do you maintain design quality?",
        required: true,
        order: 1,
        options: [
          "Focus on MVP features",
          "Reduce research time",
          "Reuse design patterns",
          "Negotiate timeline",
          "All strategies as needed",
        ],
      });
    } else {
      scenarioQuestions.push({
        id: faker.string.uuid(),
        type: "long-text" as const,
        text: "Describe a situation where you had to make a difficult decision with incomplete information.",
        required: true,
        order: 0,
        validation: { minLength: 100, maxLength: 800 },
      });
    }

    const teamworkQ = {
      id: faker.string.uuid(),
      type: "single-choice" as const,
      text: "How would you describe your work style?",
      required: true,
      order: scenarioQuestions.length,
      options: [
        "Independent contributor",
        "Collaborative team player",
        "Mix of both",
        "Prefer leading",
        "Prefer supporting",
      ],
    };
    scenarioQuestions.push(teamworkQ);

    sections.push({
      id: faker.string.uuid(),
      title: "Problem Solving & Scenarios",
      description: "How you handle real-world challenges",
      questions: scenarioQuestions,
      order: 2,
    });

    // Section 4: Cultural Fit & Logistics
    const cultureQuestions: Question[] = [];

    const workStyleQ = {
      id: faker.string.uuid(),
      type: "single-choice" as const,
      text: "What work arrangement do you prefer?",
      required: true,
      order: 0,
      options: ["Fully Remote", "In-office", "Hybrid (2-3 days)", "Flexible"],
    };
    cultureQuestions.push(workStyleQ);

    // Conditional based on work style
    cultureQuestions.push({
      id: faker.string.uuid(),
      type: "short-text" as const,
      text: "What city/region are you based in?",
      required: false,
      order: 1,
      validation: { maxLength: 100 },
      conditional: {
        dependsOn: workStyleQ.id,
        showWhen: "In-office",
      },
    });

    cultureQuestions.push({
      id: faker.string.uuid(),
      type: "long-text" as const,
      text: `Why are you interested in the ${job.title} position at our company?`,
      required: true,
      order: 2,
      validation: { minLength: 100, maxLength: 800 },
    });

    cultureQuestions.push({
      id: faker.string.uuid(),
      type: "single-choice" as const,
      text: "When could you start if offered the position?",
      required: true,
      order: 3,
      options: [
        "Immediately",
        "2 weeks notice",
        "1 month notice",
        "2+ months",
        "Flexible",
      ],
    });

    const salaryQ = {
      id: faker.string.uuid(),
      type: "single-choice" as const,
      text: "Is the salary range acceptable to you?",
      description: `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} ${
        job.salary.currency
      }`,
      required: true,
      order: 4,
      options: ["Yes", "No", "Need to discuss"],
    };
    cultureQuestions.push(salaryQ);

    // Conditional question
    cultureQuestions.push({
      id: faker.string.uuid(),
      type: "short-text" as const,
      text: "What are your salary expectations?",
      required: false,
      order: 5,
      validation: { maxLength: 100 },
      conditional: {
        dependsOn: salaryQ.id,
        showWhen: "Need to discuss",
      },
    });

    cultureQuestions.push({
      id: faker.string.uuid(),
      type: "long-text" as const,
      text: "Do you have any questions for us?",
      required: false,
      order: 6,
      validation: { maxLength: 500 },
    });

    sections.push({
      id: faker.string.uuid(),
      title: "Cultural Fit & Logistics",
      description: "Understanding your preferences and expectations",
      questions: cultureQuestions,
      order: 3,
    });

    return sections;
  };

  // Seed assessments
  const assessments: Assessment[] = [];
  const activeJobs = jobs.filter((j) => j.status === "active");

  // Create assessments for first 15 active jobs (or all if less than 15)
  for (const job of activeJobs.slice(0, Math.min(15, activeJobs.length))) {
    const sections = createJobSpecificQuestions(job);

    const assessment: Assessment = {
      id: faker.string.uuid(),
      jobId: job.id,
      title: `${job.title} Assessment`,
      description: `Comprehensive assessment for the ${job.title} position in ${job.department}. This assessment covers your background, technical/domain skills, problem-solving abilities, and cultural fit. Expected completion time: 45-60 minutes.`,
      sections,
      timeLimit: faker.number.int({ min: 45, max: 75 }), // 45-75 minutes
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: faker.date.recent({ days: 7 }),
      isPublished: faker.datatype.boolean(0.85), // 85% published
    };

    assessments.push(assessment);
  }

  await db.assessments.bulkAdd(assessments);

  console.log(
    `✅ Seeded database with ${jobs.length} jobs, ${candidates.length} candidates, and ${assessments.length} assessments`
  );
}
