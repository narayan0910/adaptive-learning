"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type MasteryLevel = "strong" | "developing" | "needsWork" | "notTested";

export interface Answer {
  questionId: string;
  conceptId: string;
  selectedIndex: number;
  correct: boolean;
}

export interface ConceptMastery {
  conceptId: string;
  level: MasteryLevel;
  correct: number;
  total: number;
}

interface AppContextType {
  studentName: string;
  setStudentName: (name: string) => void;
  answers: Answer[];
  setAnswers: (answers: Answer[]) => void;
  masteryMap: Record<string, ConceptMastery>;
  setMasteryMap: (map: Record<string, ConceptMastery>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [studentName, setStudentName] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [masteryMap, setMasteryMap] = useState<Record<string, ConceptMastery>>({});

  return (
    <AppContext.Provider
      value={{ studentName, setStudentName, answers, setAnswers, masteryMap, setMasteryMap }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
