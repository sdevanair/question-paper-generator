import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Question, QuestionPaperConfig, CustomSubject } from '../types';
import { loadSubjects } from '../utils/storage';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

async function improveQuestionWithAI(
  topic: string, 
  subtopics: string[],
  difficulty: string, 
  grade: number,
  questionType: string,
  marks: number // Added marks parameter
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Application-based question templates for different marks
    const applicationTemplates = {
      high: [ // For questions with marks >= 8
        "Create a real-world case study question about {topic} that requires analyzing and applying concepts of {subtopics}. The solution should demonstrate practical implementation and problem-solving skills.",
        "Design a complex scenario-based question where students need to apply their knowledge of {topic} and {subtopics} to solve a real industry/practical problem.",
        "Generate a comprehensive application-based question that integrates multiple concepts from {topic}, particularly {subtopics}, requiring detailed analysis and solution."
      ],
      medium: [ // For questions with marks 4-7
        "Create a practical situation where students need to apply {topic} concepts, focusing on {subtopics}.",
        "Design a problem-solving question that applies {topic} principles to a real-world scenario, covering {subtopics}.",
        "Generate a question that requires applying {topic} knowledge to solve a practical problem related to {subtopics}."
      ],
      low: [ // For questions with marks 1-3
        "Create a simple application-based question about {topic} focusing on {subtopics}.",
        "Design a basic practical question testing understanding of {topic} and {subtopics}.",
        "Generate a straightforward problem-solving question about {topic} related to {subtopics}."
      ]
    };

    // Select template based on marks
    let templates;
    if (marks >= 8) {
      templates = applicationTemplates.high;
    } else if (marks >= 4) {
      templates = applicationTemplates.medium;
    } else {
      templates = applicationTemplates.low;
    }

    const template = templates[Math.floor(Math.random() * templates.length)];

    // Enhanced prompt for application-based questions
    const prompt = `
      ${template.replace('{topic}', topic).replace('{subtopics}', subtopics.join(', '))}

      Question Requirements:
      1. Marks: ${marks} marks
      2. Difficulty Level: ${difficulty}
      3. Grade Level: ${grade}
      
      Question Structure Guidelines:
      1. Start with a realistic scenario or case study
      2. Include relevant data or information needed to solve the problem
      3. Break down the question into parts if it's a high-marks question
      4. Clearly indicate the marks distribution for each part
      5. Focus on application, analysis, and problem-solving skills
      
      The question should:
      - Be practical and industry-relevant
      - Require critical thinking and application of concepts
      - Include real-world constraints and considerations
      - Test deeper understanding rather than mere recall
      - Be appropriate for ${grade}th grade students
      - Match the ${difficulty} difficulty level
      
      For ${marks} marks question:
      - Include appropriate complexity level
      - Require detailed analysis and solution
      - Allow students to demonstrate comprehensive understanding
      - Include multiple aspects of the topic if marks are high
      
      Specific to ${topic}:
      - Include relevant technical terms
      - Focus on practical applications of ${subtopics.join(', ')}
      - Include calculations or analysis where appropriate
      - Reference real-world scenarios where these concepts are used

      Return the question in this format:
      [Question Title/Context]
      
      Scenario: [Detailed real-world scenario]
      
      Questions:
      a) [First part] [Marks]
      b) [Second part] [Marks]
      ...

      Note: Total marks should add up to ${marks}
    `;

    const result = await model.generateContent(prompt);
    const improvedQuestion = result.response.text().trim();
    return improvedQuestion;
  } catch (error) {
    console.error('AI Error:', error);
    return `Create a practical application of ${topic} focusing on ${subtopics.join(', ')}`;
  }
}

export async function generateQuestions(config: QuestionPaperConfig): Promise<Question[]> {
  try {
    const customSubjects = loadSubjects();
    const selectedSubject = customSubjects.find(s => s.name === config.subject);

    if (selectedSubject) {
      console.log('Generating questions for custom subject:', selectedSubject.name);
      
      const allQuestions: Question[] = [];
      
      if (config.pattern) {
        for (const section of config.pattern.sections) {
          for (const questionType of section.questionTypes) {
            const questionsNeeded = questionType.count;
            
            const availableTopics = [...selectedSubject.syllabus];
            for (let i = 0; i < questionsNeeded && availableTopics.length > 0; i++) {
              const randomIndex = Math.floor(Math.random() * availableTopics.length);
              const selectedTopic = availableTopics[randomIndex];
              
              const improvedQuestion = await improveQuestionWithAI(
                selectedTopic.topic,
                selectedTopic.subtopics,
                config.difficulty,
                config.grade,
                questionType.type,
                questionType.marksEach // Pass the marks
              );

              allQuestions.push({
                id: `${config.subject}-${allQuestions.length}`,
                text: improvedQuestion,
                marks: questionType.marksEach,
                topic: selectedTopic.topic,
                difficulty: config.difficulty,
                subtopics: selectedTopic.subtopics,
                type: questionType.type
              });

              availableTopics.splice(randomIndex, 1);
            }
          }
        }
      }

      return allQuestions;
    } 
    // For default subjects, use the existing logic
    else {
      // ... existing code for default subjects ...
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}