import { DEFAULT_PLAN_CONSTRAINTS } from "./graphUtils.js";

export const PROJECT_SETTINGS_SCHEMA_VERSION = 1;

export const DEFAULT_PROJECT_SETTINGS = {
  general: {
    tags: [],
    lifecycleState: "active",
    businessPurpose: "",
    starterWorkflowName: "Untitled Workflow",
    nodeNamingStyle: "standard",
  },
  models: {
    defaultProvider: "groq",
    defaultModel: "llama-3.1-8b-instant",
    temperature: 0.7,
    maxTokens: 2048,
    systemPromptPrefix: "",
  },
  execution: {
    builderTarget: "langgraph",
    maxAgentSteps: DEFAULT_PLAN_CONSTRAINTS.maxAgentSteps,
    handoffPolicy: DEFAULT_PLAN_CONSTRAINTS.handoffPolicy,
    requireFinalSynthesis: DEFAULT_PLAN_CONSTRAINTS.requireFinalSynthesis,
    allowParallelBranches: DEFAULT_PLAN_CONSTRAINTS.allowParallelBranches,
    timeoutSeconds: 60,
    retryOnError: false,
    retryCount: 2,
    errorHandlingMode: "stop",
    streamOutput: true,
  },
  artifacts: {
    outputFormat: "markdown",
    showIntermediateSteps: true,
    includeTimestamps: false,
    maxOutputLength: 0,
    artifactPrefix: "",
    copyOnComplete: false,
  },
  collaboration: {
    defaultReviewer: "Reviewer",
    requireReviewBeforeDelete: false,
    projectInstructions: "",
    sharedConventions: "",
  },
  appearance: {
    showMinimap: true,
    showGridLines: false,
    nodeSize: "normal",
    sidebarDensity: "comfortable",
  },
};

function mergeSection(defaultSection, incomingSection) {
  return { ...defaultSection, ...(incomingSection || {}) };
}

export function normalizeProjectSettings(settings = {}, workflow = null) {
  const workflowConstraints = workflow?.planConstraints || {};
  const workflowBuilderTarget = workflow?.builderTarget || DEFAULT_PROJECT_SETTINGS.execution.builderTarget;

  return {
    schemaVersion: settings.schemaVersion || PROJECT_SETTINGS_SCHEMA_VERSION,
    general: mergeSection(DEFAULT_PROJECT_SETTINGS.general, settings.general),
    models: mergeSection(DEFAULT_PROJECT_SETTINGS.models, settings.models),
    execution: mergeSection(
      {
        ...DEFAULT_PROJECT_SETTINGS.execution,
        builderTarget: workflowBuilderTarget,
        maxAgentSteps: workflowConstraints.maxAgentSteps ?? DEFAULT_PROJECT_SETTINGS.execution.maxAgentSteps,
        handoffPolicy: workflowConstraints.handoffPolicy ?? DEFAULT_PROJECT_SETTINGS.execution.handoffPolicy,
        requireFinalSynthesis:
          workflowConstraints.requireFinalSynthesis ?? DEFAULT_PROJECT_SETTINGS.execution.requireFinalSynthesis,
        allowParallelBranches:
          workflowConstraints.allowParallelBranches ?? DEFAULT_PROJECT_SETTINGS.execution.allowParallelBranches,
      },
      settings.execution
    ),
    artifacts: mergeSection(DEFAULT_PROJECT_SETTINGS.artifacts, settings.artifacts),
    collaboration: mergeSection(DEFAULT_PROJECT_SETTINGS.collaboration, settings.collaboration),
    appearance: mergeSection(DEFAULT_PROJECT_SETTINGS.appearance, settings.appearance),
  };
}

export function normalizeProjectRecord(project) {
  const primaryWorkflow = project?.workflows?.[0] || project?.workflow || null;
  return {
    ...project,
    settings: normalizeProjectSettings(project?.settings, primaryWorkflow),
  };
}

export function projectExecutionDefaults(project) {
  const execution = normalizeProjectSettings(project?.settings, project?.workflows?.[0]).execution;
  return {
    builderTarget: execution.builderTarget,
    planConstraints: {
      maxAgentSteps: execution.maxAgentSteps,
      handoffPolicy: execution.handoffPolicy,
      requireFinalSynthesis: execution.requireFinalSynthesis,
      allowParallelBranches: execution.allowParallelBranches,
    },
  };
}

export function applyExecutionSettingsToWorkflow(workflow, execution) {
  return {
    ...workflow,
    builderTarget: execution.builderTarget,
    planConstraints: {
      ...(workflow.planConstraints || {}),
      maxAgentSteps: execution.maxAgentSteps,
      handoffPolicy: execution.handoffPolicy,
      requireFinalSynthesis: execution.requireFinalSynthesis,
      allowParallelBranches: execution.allowParallelBranches,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function applyNodeDefaultsToWorkflow(workflow, settings) {
  const provider = settings.models.defaultProvider;
  const model = settings.models.defaultModel;
  const outputFormat = settings.artifacts.outputFormat;

  return {
    ...workflow,
    nodes: (workflow.nodes || []).map((node) => {
      if (node.type === "agent" || node.type === "orchestrator") {
        return {
          ...node,
          provider,
          model,
          outputFormat,
        };
      }
      if (node.type === "output") {
        return {
          ...node,
          outputFormat,
        };
      }
      return node;
    }),
    updatedAt: new Date().toISOString(),
  };
}
