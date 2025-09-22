export interface Submission {
  week: string;
  date: string;
  tithe: number;
  offering: { general: number; special: number };
  welfare: number;
  missionaryFund: number;
  total: number;
  remarks: string;
}