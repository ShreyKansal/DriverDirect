import express from "express";
import { saveProject, getProjects, getProjectById, deleteProject } from "../services/projectStore.js";

const router = express.Router();

function userId(req) {
  return req.headers["x-user-id"] || null;
}

router.get("/", async (req, res, next) => {
  try {
    res.json({ projects: await getProjects(userId(req)) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body?.project) {
      return res.status(400).json({ status: "error", message: "Missing project." });
    }
    const project = await saveProject(req.body.project, userId(req));
    res.json({ status: "saved", project });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ status: "error", message: "Project not found." });
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await deleteProject(req.params.id, userId(req));
    res.json({ status: "deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
