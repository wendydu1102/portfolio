import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// 1. Initial setup
const allProjects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// State variables
let query = '';
let selectedIndex = -1;

// 2. Select DOM elements for chart, legend, and search
const searchInput = document.querySelector('.search-bar');
const svg = d3.select("#projects-pie-plot");
const legend = d3.select(".legend");

// 3. Main filtering and rendering function (with extra credit fix)
function applyFiltersAndRender() {
    // Filter by search query first
    const filteredBySearch = allProjects.filter(p => {
        if (!query) return true;
        return Object.values(p).join('\n').toLowerCase().includes(query.toLowerCase());
    });
    
    // Update the pie chart based on the search results
    renderPieChart(filteredBySearch);

    // Then, filter by selected year (if any) from the pie chart's current data
    const rolledData = d3.rollups(filteredBySearch, v => v.length, d => d.year).sort(([a], [b]) => b - a);
    const chartData = rolledData.map(([year, count]) => ({ value: count, label: year }));

    let finalFilteredProjects = filteredBySearch;
    if (selectedIndex !== -1 && chartData[selectedIndex]) {
        const selectedYear = chartData[selectedIndex].label;
        finalFilteredProjects = filteredBySearch.filter(p => p.year === selectedYear);
    }
    
    // Render the final list of projects
    renderProjects(finalFilteredProjects, projectsContainer, 'h2');
}

// 4. Pie Chart Rendering function
function renderPieChart(projectsData) {
    // Clear previous chart and legend
    svg.selectAll('*').remove();
    legend.selectAll('*').remove();
    
    if (projectsData.length === 0) {
        return; // Don't draw a chart if there's no data
    }
    
    // Data processing for pie chart
    const rolledData = d3.rollups(projectsData, v => v.length, d => d.year).sort(([a], [b]) => b - a);
    const data = rolledData.map(([year, count]) => ({ value: count, label: year }));
    
    // D3 setup
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    const sliceGenerator = d3.pie().value(d => d.value).sort(null); 
    const arcData = sliceGenerator(data);
    const colors = d3.scaleOrdinal(d3.schemeTableau10);
    
    // Draw slices
    svg.selectAll('path')
        .data(arcData)
        .join('path')
        .attr('d', arcGenerator)
        .attr('fill', (d, i) => colors(i))
        .attr('class', (d, i) => i === selectedIndex ? 'selected' : null)
        .on('click', (event, d) => {
            const i = arcData.indexOf(d);
            selectedIndex = selectedIndex === i ? -1 : i;
            applyFiltersAndRender();
        });

    // Draw legend
    legend.selectAll('li')
        .data(data)
        .join('li')
        .attr('style', (d, i) => `--color: ${colors(i)}`)
        .attr('class', (d, i) => i === selectedIndex ? 'selected legend-item' : 'legend-item')
        .html((d, i) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on('click', (event, d) => {
            const i = data.indexOf(d);
            selectedIndex = selectedIndex === i ? -1 : i;
            applyFiltersAndRender();
        });
}

// 5. Event Listeners
searchInput.addEventListener('input', event => {
    query = event.target.value;
    selectedIndex = -1; // Reset year selection when search query changes
    applyFiltersAndRender();
});

// 6. Initial Render
applyFiltersAndRender();