export interface UserData {
  uid: string;
  name: string;
  leetcodeUser: string;
  teamId: string | null;
  individualPoints: number;
  individualStreak: number;
  isCompletedToday: boolean;
  isBenched: boolean;
  poisonApps: string[];
  favoriteApp: string | null;
  hasSkipDay: boolean;
  assignedProblemSlug?: string;
  lastActive: number; // Timestamp
}

export interface TeamData {
  id: string;
  teamName: string;
  groupPoints: number;
  groupStreak: number;
  currentProgress: number;
  membersArray: string[];
  lastBonusDate?: string;
  leaderboardRank?: number;
}

export interface Vote {
  voterUid: string;
  targetUid: string;
  timestamp: number;
}
