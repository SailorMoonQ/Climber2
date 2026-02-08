
export interface ExerciseRecord {
  id: string;
  userId: string;
  date: string;
  type: string;
  duration: number;
  distance: number;
  calories: number;
  averageSpeed: number;
  maxSpeed: number;
  heartRate: { avg: number; max: number };
  trainingTargets: { duration?: number; distance?: number; calories?: number; speed?: number };
  detailedData: { time: number; heartRate: number; speed: number }[];
}