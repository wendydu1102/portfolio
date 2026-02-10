import { fetchJSON, renderProjects } from './global.js';

// --- Render Latest Projects ---
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 4);
const projectsContainer = document.querySelector('.projects');

if (latestProjects && projectsContainer) {
    renderProjects(latestProjects, projectsContainer, 'h2');
}