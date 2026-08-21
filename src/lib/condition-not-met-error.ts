export class ConditionNotMetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConditionNotMetError";
  }
}