import React, { useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { generateQuestions } from './services/questionGenerator';
import { TopicTrie, QuestionHeap, QuestionHashTable } from './utils/dataStructures';
import type { Question, QuestionPaperConfig, Subject, Grade, Difficulty, QuestionType, Section, CustomSubject } from './types';
import { loadEvaluator } from './utils/useQuestionEvaluator';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SubjectManager } from './components/SubjectManager';
import { saveSubjects, loadSubjects } from './utils/storage';

// Debug log to check API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('Gemini API key is missing! Please check your .env file.');
}

const genAI = new GoogleGenerativeAI(apiKey);

async function improveQuestionWithAI(basicQuestion: string, topic: string, difficulty: string, grade: number): Promise<string> {
  try {
    console.log('Starting AI improvement for topic:', topic);
    
    if (!apiKey) {
      console.error('Cannot call Gemini API - API key is missing');
      return basicQuestion;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
      Improve this ${difficulty} level question for grade ${grade}:
      Question: ${basicQuestion}
      Topic: ${topic}
      
      Please provide an improved version of the question that:
      1. Is more specific and clear
      2. Uses appropriate terminology for grade ${grade}
      3. Maintains ${difficulty} difficulty level
      4. Is relevant to the topic
      
      Return only the improved question text, no explanations.
    `;

    console.log('Calling Gemini API...');
    const result = await model.generateContent(prompt);
    const improvedQuestion = result.response.text().trim();
    console.log('Received improved question:', improvedQuestion);

    return improvedQuestion || basicQuestion;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return basicQuestion;
  }
}

function App() {
  const [config, setConfig] = useState<QuestionPaperConfig>({
    subject: 'Physics',
    grade: 11,
    difficulty: 'medium',
    totalMarks: 50,
    pattern: {
      sections: [
        {
          name: 'Section A',
          questionTypes: [
            { type: 'mcq', count: 5, marksEach: 1 },
          ]
        },
        {
          name: 'Section B',
          questionTypes: [
            { type: 'short', count: 5, marksEach: 3 },
          ]
        },
        {
          name: 'Section C',
          questionTypes: [
            { type: 'long', count: 2, marksEach: 5 },
          ]
        }
      ],
      totalMarks: 50
    }
  });

  // Add state for pattern editing
  const [isEditingPattern, setIsEditingPattern] = useState(false);

  // Function to update section
  const updateSection = (sectionIndex: number, updates: Partial<Section>) => {
    const newPattern = { ...config.pattern };
    newPattern.sections[sectionIndex] = {
      ...newPattern.sections[sectionIndex],
      ...updates
    };
    setConfig({ ...config, pattern: newPattern });
  };

  // Function to add new section
  const addSection = () => {
    const newPattern = { ...config.pattern };
    newPattern.sections.push({
      name: `Section ${String.fromCharCode(65 + newPattern.sections.length)}`,
      questionTypes: [{ type: 'short', count: 1, marksEach: 2 }]
    });
    setConfig({ ...config, pattern: newPattern });
  };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cppStats, setCppStats] = useState<{ total: number; avg: number; top: number } | null>(null);

  const [showSubjectManager, setShowSubjectManager] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>(loadSubjects());

  const handleSaveSubjects = (subjects: CustomSubject[]) => {
    setCustomSubjects(subjects);
    saveSubjects(subjects);
    setShowSubjectManager(false);
  };

  const handleGenerate = async () => {
    // Prevent multiple clicks
    if (loading) {
      console.log('Already generating questions...');
      return;
    }

    try {
      // Reset states
      setLoading(true);
      setError(null);
      setCppStats(null);
      setQuestions([]); // Clear previous questions

      // Generate basic questions
      const generatedQuestions = await generateQuestions(config);
      
      // Set questions immediately after generation
      setQuestions(generatedQuestions);

      // Optional: Process with C++ evaluator
      try {
        const evaluator = await loadEvaluator();
        const stats = {
          total: 0,
          avg: 0,
          top: 0
        };

        generatedQuestions.forEach((q) => {
          const diffNum = q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3;
          evaluator._add_question(q.marks, diffNum);
        });

        stats.total = evaluator._get_total_marks();
        stats.avg = evaluator._get_average_difficulty();
        stats.top = evaluator._get_top_question_marks();

        setCppStats(stats);
      } catch (evalError) {
        console.error('Evaluator error:', evalError);
        // Don't set error state for evaluator issues
      }

    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate questions. Please try again.');
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const content = `
      ${config.subject} Question Paper
      Grade: ${config.grade}
      Total Marks: ${config.totalMarks}
      Difficulty: ${config.difficulty}

      ${questions.map((q, i) => `
        Q${i + 1}. [${q.marks} marks]
        ${q.text}
        Topic: ${q.topic}
      `).join('\n\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `question-paper-${config.subject.toLowerCase()}-grade${config.grade}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Add pattern editor UI
  const renderPatternEditor = () => (
    <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Question Paper Pattern</h3>
        <button
          onClick={() => setIsEditingPattern(!isEditingPattern)}
          className="text-indigo-600 hover:text-indigo-700"
        >
          {isEditingPattern ? 'Save Pattern' : 'Edit Pattern'}
        </button>
      </div>

      {isEditingPattern ? (
        <div className="space-y-6">
          {config.pattern.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => updateSection(sectionIndex, { name: e.target.value })}
                  className="font-medium p-2 border rounded"
                />
                <button
                  onClick={() => {
                    const newSections = config.pattern.sections.filter((_, i) => i !== sectionIndex);
                    setConfig({
                      ...config,
                      pattern: { ...config.pattern, sections: newSections }
                    });
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove Section
                </button>
              </div>

              <div className="space-y-4">
                {section.questionTypes.map((qType, typeIndex) => (
                  <div key={typeIndex} className="flex gap-4 items-center">
                    <select
                      value={qType.type}
                      onChange={(e) => {
                        const newTypes = [...section.questionTypes];
                        newTypes[typeIndex] = { ...qType, type: e.target.value as QuestionType };
                        updateSection(sectionIndex, { questionTypes: newTypes });
                      }}
                      className="p-2 border rounded"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="short">Short Answer</option>
                      <option value="long">Long Answer</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <label>Count:</label>
                      <input
                        type="number"
                        value={qType.count}
                        onChange={(e) => {
                          const newTypes = [...section.questionTypes];
                          newTypes[typeIndex] = { ...qType, count: parseInt(e.target.value) };
                          updateSection(sectionIndex, { questionTypes: newTypes });
                        }}
                        className="w-20 p-2 border rounded"
                        min="1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label>Marks Each:</label>
                      <input
                        type="number"
                        value={qType.marksEach}
                        onChange={(e) => {
                          const newTypes = [...section.questionTypes];
                          newTypes[typeIndex] = { ...qType, marksEach: parseInt(e.target.value) };
                          updateSection(sectionIndex, { questionTypes: newTypes });
                        }}
                        className="w-20 p-2 border rounded"
                        min="1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={addSection}
            className="w-full p-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-500 hover:text-indigo-500"
          >
            + Add Section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {config.pattern.sections.map((section, index) => (
            <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium mb-2">{section.name}</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {section.questionTypes.map((qType, typeIndex) => (
                  <li key={typeIndex}>
                    {qType.count} x {qType.type.toUpperCase()} questions ({qType.marksEach} marks each)
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8 border border-indigo-100">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Question Paper Generator</h1>
          <p className="text-gray-600 mb-8">Generate customized question papers for high school subjects</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                value={config.subject}
                onChange={(e) => setConfig({ ...config, subject: e.target.value as Subject })}
              >
                {[
                  'Physics', 
                  'Chemistry', 
                  'Biology', 
                  'Mathematics',
                  ...customSubjects.map(subject => subject.name)
                ].map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade
              </label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                value={config.grade}
                onChange={(e) => setConfig({ ...config, grade: parseInt(e.target.value) as Grade })}
              >
                <option value={11}>11th Grade</option>
                <option value={12}>12th Grade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                value={config.difficulty}
                onChange={(e) => setConfig({ ...config, difficulty: e.target.value as Difficulty })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Marks
              </label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                value={config.totalMarks}
                onChange={(e) => setConfig({ ...config, totalMarks: parseInt(e.target.value) })}
              >
                <option value={25}>25 Marks</option>
                <option value={50}>50 Marks</option>
                <option value={75}>75 Marks</option>
                <option value={100}>100 Marks</option>
              </select>
            </div>
          </div>

          {/* Add pattern editor */}
          {renderPatternEditor()}

          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                loading 
                  ? 'bg-indigo-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating Questions...
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  Generate Question Paper
                </>
              )}
            </button>
            
            {loading && (
              <button
                onClick={() => setLoading(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Reset
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>

        {questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-8 border border-indigo-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Generated Question Paper</h2>
                <p className="text-gray-600">
                  {config.subject} • Grade {config.grade} • {config.totalMarks} Marks
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                Download Paper
              </button>
            </div>

            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-medium text-lg text-gray-900">Question {index + 1}</span>
                    <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      {question.marks} marks
                    </span>
                  </div>
                  <p className="text-gray-800 text-lg mb-3">{question.text}</p>
                  <div className="flex gap-4">
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      Topic: {question.topic}
                    </span>
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      Difficulty: {question.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {cppStats && (
              <div className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">C++ Evaluation Summary</h3>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  <li>Total Marks (from C++): {cppStats.total}</li>
                  <li>Average Difficulty Level: {cppStats.avg} (1 = easy, 2 = medium, 3 = hard)</li>
                  <li>Top Question Marks: {cppStats.top}</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowSubjectManager(true)}
          className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Manage Subjects & Syllabus
        </button>

        {showSubjectManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <SubjectManager
                initialSubjects={customSubjects}
                onSave={handleSaveSubjects}
                onCancel={() => setShowSubjectManager(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
