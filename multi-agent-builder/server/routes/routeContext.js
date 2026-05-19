import { getProjectById } from "../services/projectStore.js";

export function getRequestUserId(req) {
  const headerValue = req.headers["x-user-id"];
  return typeof headerValue === "string" && headerValue.trim() ? headerValue.trim() : null;
}

export async function loadOwnedProject(req, res, projectId = req.params.projectId) {
  const project = await getProjectById(projectId, getRequestUserId(req));
  if (!project) {
    res.status(404).json({ error: "Project not found." });
    return null;
  }
  return project;
}
