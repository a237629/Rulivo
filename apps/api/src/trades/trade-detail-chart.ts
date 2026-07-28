export interface ExecutionChartInput {
  action: string;
  executedAt: Date;
  id: string;
  priceMinor: bigint;
  quantity: { toFixed(): string };
}

export function buildExecutionChart(executions: ExecutionChartInput[]) {
  const prices = executions.map((execution) => execution.priceMinor);
  return {
    kind: "EXECUTION_PRICE" as const,
    priceMaxMinor: prices.length === 0 ? null : prices.reduce((a, b) => (a > b ? a : b)).toString(),
    priceMinMinor: prices.length === 0 ? null : prices.reduce((a, b) => (a < b ? a : b)).toString(),
    points: executions.map((execution) => ({
      action: execution.action,
      executionId: execution.id,
      priceMinor: execution.priceMinor.toString(),
      quantity: execution.quantity.toFixed(),
      timestamp: execution.executedAt
    }))
  };
}
