export interface LeadClassificationResult {
  temperature: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
}
