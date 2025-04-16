import type { CustomSubject } from '../types';

const STORAGE_KEY = 'custom_subjects';

export const saveSubjects = (subjects: CustomSubject[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
};

export const loadSubjects = (): CustomSubject[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};
