export interface ClauseMetadata {
  clauseNumber: string;
  title?: string;
  page?: number;
  startIndex: number;
  endIndex: number;
}

export interface Clause {
  id: string;
  text: string;
  metadata: ClauseMetadata;
}

export interface Contract {
  id: string;
  originalFilename: string;
  text: string;
  clauses: Clause[];
  uploadedAt: number;
  sessionId: string;
} 