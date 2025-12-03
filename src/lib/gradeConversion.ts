/**
 * 5점 척도를 4단계 등급으로 변환
 * 
 * 5점 척도: 1(전혀 그렇지 않다) ~ 5(매우 그렇다)
 * 4단계 등급: 
 *   - 우수 (4.2 이상)
 *   - 양호 (3.4 ~ 4.2 미만)
 *   - 보통 (2.6 ~ 3.4 미만)
 *   - 미흡 (2.6 미만)
 */

export type GradeLevel = "excellent" | "good" | "average" | "poor";

export interface GradeInfo {
  level: GradeLevel;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

export const gradeThresholds = {
  excellent: 4.2,
  good: 3.4,
  average: 2.6,
};

export const gradeInfoMap: Record<GradeLevel, GradeInfo> = {
  excellent: {
    level: "excellent",
    label: "우수",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    description: "목표 달성이 우수함",
  },
  good: {
    level: "good",
    label: "양호",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "목표에 근접함",
  },
  average: {
    level: "average",
    label: "보통",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    description: "개선 필요",
  },
  poor: {
    level: "poor",
    label: "미흡",
    color: "text-red-600",
    bgColor: "bg-red-100",
    description: "즉각적인 개선 필요",
  },
};

export function convertToGrade(averageScore: number): GradeInfo {
  if (averageScore >= gradeThresholds.excellent) {
    return gradeInfoMap.excellent;
  } else if (averageScore >= gradeThresholds.good) {
    return gradeInfoMap.good;
  } else if (averageScore >= gradeThresholds.average) {
    return gradeInfoMap.average;
  } else {
    return gradeInfoMap.poor;
  }
}

export function calculateAverageFromResponses(responses: string[]): number {
  const numericValues = responses
    .map((r) => parseInt(r))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 5);
  
  if (numericValues.length === 0) return 0;
  
  return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
}

export function getGradeDistribution(scores: number[]): Record<GradeLevel, number> {
  const distribution: Record<GradeLevel, number> = {
    excellent: 0,
    good: 0,
    average: 0,
    poor: 0,
  };

  scores.forEach((score) => {
    const grade = convertToGrade(score);
    distribution[grade.level]++;
  });

  return distribution;
}
