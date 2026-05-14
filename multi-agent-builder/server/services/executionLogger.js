export function createStep(agent, input) {
  return {
    agentId: agent.id,
    agentName: agent.name,
    input,
    output: "",
    startedAt: new Date().toISOString(),
    completedAt: "",
    status: "running"
  };
}

export function completeStep(step, output) {
  return {
    ...step,
    output,
    completedAt: new Date().toISOString(),
    status: "completed"
  };
}

export function failStep(step, error) {
  return {
    ...step,
    output: "",
    completedAt: new Date().toISOString(),
    status: "failed",
    error: error.message
  };
}
