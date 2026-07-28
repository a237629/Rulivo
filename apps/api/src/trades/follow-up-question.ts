export type MissingEvidenceKey =
  "MOVED_STOP" | "PLAN_DEVIATION" | "POSITION_INCREASE" | "LOSS_REENTRY" | "DAILY_TRADE_LIMIT";

export interface FollowUpQuestion {
  evidenceKey: MissingEvidenceKey;
  question: string;
  quickOptions: string[];
}

const QUESTIONS: Record<MissingEvidenceKey, Omit<FollowUpQuestion, "evidenceKey">> = {
  MOVED_STOP: {
    question: "Did you move the stop farther away from risk control during this trade?",
    quickOptions: ["NO", "YES", "NOT_SURE"]
  },
  PLAN_DEVIATION: {
    question: "Was this trade taken according to a defined playbook?",
    quickOptions: ["YES", "NO", "NO_PLAYBOOK"]
  },
  POSITION_INCREASE: {
    question: "How did you determine the position size for this trade?",
    quickOptions: ["PLAN_LIMIT", "INCREASED_SIZE", "NOT_SURE"]
  },
  LOSS_REENTRY: {
    question: "Was this entry influenced by the result of the previous losing trade?",
    quickOptions: ["NO", "YES", "NOT_SURE"]
  },
  DAILY_TRADE_LIMIT: {
    question: "Had you reached your planned daily trade limit before this entry?",
    quickOptions: ["NO", "YES", "NO_LIMIT"]
  }
};

const PRIORITY: MissingEvidenceKey[] = [
  "MOVED_STOP",
  "PLAN_DEVIATION",
  "POSITION_INCREASE",
  "LOSS_REENTRY",
  "DAILY_TRADE_LIMIT"
];

export function nextFollowUpQuestion(
  missing: readonly MissingEvidenceKey[],
  alreadyAsked: readonly string[]
): FollowUpQuestion | null {
  const key = PRIORITY.find(
    (candidate) => missing.includes(candidate) && !alreadyAsked.includes(candidate)
  );
  return key === undefined ? null : { evidenceKey: key, ...QUESTIONS[key] };
}

export const FOLLOW_UP_VERSION = "follow-up-v1";
