export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
  message?: string;
  data?: unknown;
}
