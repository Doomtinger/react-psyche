/**
 * AI Reflection extension contract.
 *
 * The current version defines only the boundary. No network request is made.
 * A future provider may call a server-side model, but it MUST only ever receive
 * records the user explicitly selected, and its output MUST stay separate from
 * the user's original content.
 */
export interface ReflectionRequest {
  recordIds: string[];
  question?: string;
}

export interface ReflectionObservation {
  text: string;
  sourceRecordIds: string[];
}

export interface ReflectionResult {
  summary: string;
  observations: ReflectionObservation[];
  questions: string[];
}

export interface ReflectionProvider {
  reflect(request: ReflectionRequest): Promise<ReflectionResult>;
}
