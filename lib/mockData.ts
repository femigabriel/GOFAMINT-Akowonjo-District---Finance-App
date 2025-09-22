// lib/mockData.ts
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

export const mockSubmissions: Submission[] = [
  {
    week: 'Week 1',
    date: '2025-09-07',
    tithe: 150000,
    offering: { general: 50000, special: 20000 },
    welfare: 10000,
    missionaryFund: 5000,
    total: 235000,
    remarks: 'First Sunday',
  },
  {
    week: 'Week 2',
    date: '2025-09-14',
    tithe: 170000,
    offering: { general: 60000, special: 25000 },
    welfare: 12000,
    missionaryFund: 7000,
    total: 274000,
    remarks: 'Youth Sunday',
  },
  // Add more weeks as needed
];