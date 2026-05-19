import axios from "axios";
import { userHeaders } from "../utils/authHeaders.js";

const api = axios.create({ baseURL: "/api" });

function message(error) {
  const d = error.response?.data;
  return d?.message || error.message || "Unknown error";
}

export async function fetchProjects(userId) {
  try {
    const { data } = await api.get("/projects", { headers: userHeaders(userId) });
    return data.projects;
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function upsertProject(project, userId) {
  try {
    const { data } = await api.post("/projects", { project }, { headers: userHeaders(userId) });
    return data.project;
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function removeProject(id, userId) {
  try {
    await api.delete(`/projects/${id}`, { headers: userHeaders(userId) });
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function syncUser(user) {
  try {
    await api.post("/users/sync", user);
  } catch (error) {
    throw new Error(message(error));
  }
}
