const mongoose=require("mongoose");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const Job = require("./models/Job");

dotenv.config();

mongoose
.connect(process.env.MONGODB_URI)
.then(()=>{console.log("MongoDB Connected Succesfully!");})
.catch((error)=>{console.log("MongoDB connection error:", error.message);   
});

console.log("SERVER FILE:", __filename);
console.log("WORKING DIRECTORY:", process.cwd());
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const app = express();

app.use(cors());
app.use(express.json());

console.log("THIS IS MY CURRENT SERVER.JS");
const PORT = process.env.PORT || 5000;

app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
  });
});

console.log("BEFORE JOBS ROUTE");


app.get("/api/jobs", async (req, res) => {
  console.log("REAL MONGODB JOBS ROUTE HIT");

  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});


app.post("/api/jobs", async (req, res) => {
  try {
    const newJob = new Job({
      company: req.body.company,
      role: req.body.role,
      status: req.body.status,
      jobUrl: req.body.jobUrl,
      appliedDate: req.body.appliedDate,
      updatedDate: req.body.updatedDate,
    });

    const savedJob = await newJob.save();

    res.status(201).json(savedJob);
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).json({ message: "Failed to save job" });
  }
});







app.put("/api/jobs/:id", async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      {
        company: req.body.company,
        role: req.body.role,
        status: req.body.status,
        jobUrl: req.body.jobUrl,
        appliedDate: req.body.appliedDate,
        updatedDate: req.body.updatedDate,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedJob) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);

    res.status(500).json({
      message: "Failed to update job",
    });
  }
  
});


app.delete("/api/jobs/:id", async (req, res) => {
  try {
    const deletedJob = await Job.findByIdAndDelete(
      req.params.id
    );

    if (!deletedJob) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.json({
      message: "Job deleted successfully",
      deletedJob: deletedJob,
    });
  } catch (error) {
    console.error("Error deleting job:", error);

    res.status(500).json({
      message: "Failed to delete job",
    });
  }
});







app.get("/api/jobs-debug", (req, res) => {
  console.log("JOBS DEBUG ROUTE HIT");
  res.json({ message: "Jobs debug route is working!" });
});





app.post("/api/match", async (req, res) => {
   
  console.log("MATCH API CALLED");
  console.log("REQUEST BODY:", req.body);

  const { resumeText, jobDescription } = req.body;

  try {
    const response = await openai.responses.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",

      input: `
You are a resume and job matching assistant.

Analyze the candidate's resume against the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return your answer using exactly these four sections:

[SCORE]
Give only the match score out of 100.

[MATCHING_SKILLS]
List the skills from the job description that are clearly demonstrated in the resume.

[MISSING_SKILLS]
List the important skills from the job description that are not clearly demonstrated in the resume.

[EXPLANATION]
Give a short explanation of why the resume matches or does not match the job description.

Do not add any other sections.
`,
    });

    console.log("AI Response:", response.output_text);
    if (response.status !== "completed" || !response.output_text?.trim()) {
  console.error("Match AI request failed:", response.error);

  return res.status(502).json({
    error: response.error?.message || "The AI returned an empty response. Please try again.",
  });
}
    console.log("FULL AI RESPONSE:", JSON.stringify(response, null, 2));

    const aiText = response.output_text;

    const scoreSection = aiText.split("[SCORE]")[1] || "";

    const numberFound = scoreSection.match(/\d+/);

    const score = numberFound ? Number(numberFound[0]) : null;

    console.log("SCORE SECTION:", scoreSection);
    console.log("NUMBER FOUND:", numberFound);
    console.log("AI SCORE:", score);

    res.json({
      result: aiText,
      score: score,
    });
  } catch (error) {
    console.error("OpenRouter Error:", error);
    console.error("Error message:", error.message);

    res.status(500).json({
      error: error.message,
    });
  }
});



app.get("/api/cover-letter", (req, res) => {
  res.json({
    message: "Cover letter route exists!",
  });
});










app.post("/api/cover-letter", async (req, res) => {
  console.log("COVER LETTER API CALLED");

  const { resumeText, jobDescription } = req.body;

  try {
   const coverLetterModel = "nvidia/nemotron-3-ultra-550b-a55b:free";

console.log("ACTUAL COVER LETTER MODEL:", coverLetterModel);

const response = await openai.responses.create({
  model: coverLetterModel,
      input: `
You are a professional career assistant.

Write a tailored cover letter based on the candidate's resume and the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Requirements:
- Write a professional and concise cover letter.
- Highlight skills and experience from the resume that are relevant to the job.
- Do not invent experience, skills, achievements, or qualifications.
- Do not use placeholders such as [Company Name] or [Your Name].
- Keep the cover letter around 250-350 words.
- Return only the cover letter.
`,
    });

    const coverLetter = response.output_text;

    console.log("COVER LETTER GENERATED");

    res.json({
      coverLetter: coverLetter,
    });
  } catch (error) {
   console.log("Cover Letter Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});










app.get("/api/job-requirements-test", (req, res) => {
  res.json({
    message: "Job requirements route is loaded!",
  });
});

app.post("/api/job-requirements", async (req, res) => {
    
  console.log("JOB REQUIREMENTS API CALLED");

  const { jobDescription } = req.body;

  try {
    const response = await openai.responses.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",

      input: `
You are a professional job requirements extraction assistant.

Analyze the following job description and extract the important requirements.

Job Description:
${jobDescription}

Return your answer using exactly these six sections:

[REQUIRED_SKILLS]
List the skills that are clearly required for the job.

[PREFERRED_SKILLS]
List skills that are preferred or mentioned as an advantage.

[TECHNOLOGIES]
List the technologies, frameworks, programming languages, tools, or platforms mentioned.

[EXPERIENCE]
Describe the required or preferred experience level.

[EDUCATION]
Describe the required or preferred educational qualifications.

[OTHER_REQUIREMENTS]
List other important requirements such as APIs, Git, communication skills, location, certifications, or other job-specific requirements.

Do not add any other sections.
`,
    });

    console.log("JOB REQUIREMENTS GENERATED");

    res.json({
      result: response.output_text,
    });
  } catch (error) {
    console.log("Job Requirements Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});






console.log("REGISTERING INTERVIEW PREP TEST ROUTE");
app.get("/api/interview-prep-test", (req, res) => {
  res.json({
    message: "Interview prep route is loaded!",
  });
});


app.post("/api/interview-prep", async (req, res) => {
  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({
      error: "Resume text and job description are required.",
    });
  }

  try {
    const response = await openai.responses.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",
      input: `
You are an expert technical interviewer and interview coach.

Use the candidate's resume and the job description to prepare
a personalized interview practice guide.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Create these sections:

[TECHNICAL_QUESTIONS]
Give 5 relevant technical questions with concise suggested answers.

[PROJECT_QUESTIONS]
Give 3 questions about the candidate's projects and suggested answers
grounded in the resume. Do not invent projects or experience.

[HR_QUESTIONS]
Give 3 common HR questions with concise, professional sample answers
tailored to the candidate.

[QUESTIONS_TO_PRACTICE]
Give 3 additional job-specific questions the candidate should practice.

Use clear numbering and readable formatting.
Do not claim the candidate has skills or experience not supported by the resume.
`,
    });

    res.json({
      result: response.output_text,
    });
  } catch (error) {
    console.error("Interview Prep Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});











const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("SERVER LISTENING:", server.address());
});

server.on("error", (error) => {
  console.error("SERVER LISTEN ERROR:", error);
});

