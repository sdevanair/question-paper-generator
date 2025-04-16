import React, { useState } from 'react';
import type { CustomSubject, Syllabus } from '../types';

interface SubjectManagerProps {
  initialSubjects: CustomSubject[];
  onSave: (subjects: CustomSubject[]) => void;
  onCancel: () => void;
}

export function SubjectManager({ initialSubjects, onSave, onCancel }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<CustomSubject[]>(initialSubjects);
  const [currentSubject, setCurrentSubject] = useState<CustomSubject | null>(null);

  const handleSubjectNameChange = (subjectId: string, newName: string) => {
    const updatedSubjects = subjects.map(subject => 
      subject.id === subjectId ? { ...subject, name: newName } : subject
    );
    setSubjects(updatedSubjects);
    
    if (currentSubject?.id === subjectId) {
      setCurrentSubject({ ...currentSubject, name: newName });
    }
  };

  const addNewSubject = () => {
    const newSubject: CustomSubject = {
      id: Date.now().toString(),
      name: 'New Subject',
      syllabus: [{
        id: Date.now().toString() + '-topic',
        topic: 'New Topic',
        subtopics: ['New Subtopic']
      }]
    };
    setSubjects([...subjects, newSubject]);
    setCurrentSubject(newSubject);
  };

  const addTopic = (subjectId: string) => {
    const newTopic: Syllabus = {
      id: Date.now().toString(),
      topic: 'New Topic',
      subtopics: ['New Subtopic']
    };

    const updatedSubjects = subjects.map(subject => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          syllabus: [...subject.syllabus, newTopic]
        };
      }
      return subject;
    });
    setSubjects(updatedSubjects);
    
    if (currentSubject?.id === subjectId) {
      setCurrentSubject({
        ...currentSubject,
        syllabus: [...currentSubject.syllabus, newTopic]
      });
    }
  };

  const handleTopicChange = (subjectId: string, topicId: string, newValue: string) => {
    const updatedSubjects = subjects.map(subject => {
      if (subject.id === subjectId) {
        const updatedSyllabus = subject.syllabus.map(topic => {
          if (topic.id === topicId) {
            return { ...topic, topic: newValue };
          }
          return topic;
        });
        return { ...subject, syllabus: updatedSyllabus };
      }
      return subject;
    });
    setSubjects(updatedSubjects);
    
    if (currentSubject?.id === subjectId) {
      setCurrentSubject({
        ...currentSubject,
        syllabus: currentSubject.syllabus.map(topic => 
          topic.id === topicId ? { ...topic, topic: newValue } : topic
        )
      });
    }
  };

  const handleSubtopicChange = (
    subjectId: string, 
    topicId: string, 
    subtopicIndex: number, 
    newValue: string
  ) => {
    const updatedSubjects = subjects.map(subject => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          syllabus: subject.syllabus.map(topic => {
            if (topic.id === topicId) {
              const newSubtopics = [...topic.subtopics];
              newSubtopics[subtopicIndex] = newValue;
              return { ...topic, subtopics: newSubtopics };
            }
            return topic;
          })
        };
      }
      return subject;
    });
    setSubjects(updatedSubjects);
    
    if (currentSubject?.id === subjectId) {
      setCurrentSubject({
        ...currentSubject,
        syllabus: currentSubject.syllabus.map(topic => {
          if (topic.id === topicId) {
            const newSubtopics = [...topic.subtopics];
            newSubtopics[subtopicIndex] = newValue;
            return { ...topic, subtopics: newSubtopics };
          }
          return topic;
        })
      });
    }
  };

  const removeTopic = (subjectId: string, topicId: string) => {
    const updatedSubjects = subjects.map(subject => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          syllabus: subject.syllabus.filter(topic => topic.id !== topicId)
        };
      }
      return subject;
    });
    setSubjects(updatedSubjects);
    
    if (currentSubject?.id === subjectId) {
      setCurrentSubject({
        ...currentSubject,
        syllabus: currentSubject.syllabus.filter(topic => topic.id !== topicId)
      });
    }
  };

  const addSubtopic = (subjectId: string, topicId: string) => {
    const updatedSubjects = subjects.map(subject => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          syllabus: subject.syllabus.map(topic => {
            if (topic.id === topicId) {
              return {
                ...topic,
                subtopics: [...topic.subtopics, 'New Subtopic']
              };
            }
            return topic;
          })
        };
      }
      return subject;
    });
    setSubjects(updatedSubjects);
    
    if (currentSubject?.id === subjectId) {
      setCurrentSubject({
        ...currentSubject,
        syllabus: currentSubject.syllabus.map(topic => {
          if (topic.id === topicId) {
            return {
              ...topic,
              subtopics: [...topic.subtopics, 'New Subtopic']
            };
          }
          return topic;
        })
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Subject Manager</h2>
        <button
          onClick={addNewSubject}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Add New Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject List */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Subjects</h3>
          <div className="space-y-4">
            {subjects.map(subject => (
              <div key={subject.id} className="border rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <input
                    type="text"
                    value={subject.name}
                    onChange={(e) => handleSubjectNameChange(subject.id, e.target.value)}
                    className="font-medium p-2 border rounded"
                    placeholder="Enter subject name"
                  />
                  <button
                    onClick={() => setCurrentSubject(subject)}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Edit Syllabus
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {subject.syllabus.length} topics
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Syllabus Editor */}
        {currentSubject && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              Syllabus for {currentSubject.name}
            </h3>
            <div className="space-y-4">
              {currentSubject.syllabus.map(topic => (
                <div key={topic.id} className="border rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <input
                      type="text"
                      value={topic.topic}
                      onChange={(e) => handleTopicChange(currentSubject.id, topic.id, e.target.value)}
                      className="font-medium p-2 border rounded flex-1"
                      placeholder="Enter topic name"
                    />
                    <button
                      onClick={() => removeTopic(currentSubject.id, topic.id)}
                      className="ml-2 text-red-500 hover:text-red-600 px-2 py-1"
                    >
                      Remove Topic
                    </button>
                  </div>
                  <div className="space-y-2">
                    {topic.subtopics.map((subtopic, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={subtopic}
                          onChange={(e) => handleSubtopicChange(
                            currentSubject.id,
                            topic.id,
                            index,
                            e.target.value
                          )}
                          className="flex-1 p-2 border rounded"
                          placeholder="Enter subtopic"
                        />
                        <button
                          onClick={() => {
                            const updatedSubtopics = topic.subtopics.filter((_, i) => i !== index);
                            handleSubtopicChange(
                              currentSubject.id,
                              topic.id,
                              index,
                              updatedSubtopics[index] || ''
                            );
                          }}
                          className="text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addSubtopic(currentSubject.id, topic.id)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm"
                    >
                      + Add Subtopic
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addTopic(currentSubject.id)}
                className="w-full p-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-500 hover:text-indigo-500"
              >
                + Add Topic
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(subjects)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
