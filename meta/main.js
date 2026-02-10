import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

// Global variables to hold data and scales
let commits, data, xScale, yScale, timeScale;

// Main function to orchestrate everything
async function main() {
  data = await loadData();
  if (!data) return;

  commits = processCommits(data);

  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, 100]);

  // Initial render with all data
  renderOrUpdateCommitInfo(data, commits);
  renderScatterPlot(commits); 
  updateFileDisplay([]); // Start with empty files viz

  // Setup scrollytelling
  setupScrollytelling(commits);
}

// Load and parse CSV data
async function loadData() {
  try {
    const csvData = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: +row.line,
      depth: +row.depth,
      length: +row.length,
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    
    if (csvData.length === 0) throw new Error("CSV file is empty.");
    return csvData;
  } catch (error) {
    console.error("Error loading or parsing CSV data:", error);
    d3.select("main").html(`
        <h1>Error</h1>
        <p>Could not load code analysis data (loc.csv).</p>
        <p>Please ensure you have run: <code>npx elocuent -d . -o meta/loc.csv --spaces 2</code></p>
    `);
    return null;
  }
}

// Process raw data into commits, sorted by date
function processCommits(rawData) {
  const grouped = d3.groups(rawData, (d) => d.commit).map(([commitId, lines]) => {
    let first = lines[0];
    let { author, date, time, timezone, datetime } = first;
    let ret = {
      id: commitId,
      url: 'https://github.com/wendydu1102/DSC106_Portfolio/commit/' + commitId,
      author, date, time, timezone, datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
      lines: lines, // Attach lines directly
    };
    return ret;
  });
  
  // Sort commits chronologically for scrollytelling
  return grouped.sort((a, b) => a.datetime - b.datetime);
}

// Render or update summary statistics
function renderOrUpdateCommitInfo(filteredData, filteredCommits) {
    const statsContainer = d3.select('#stats');
    let dl = statsContainer.select('dl');
    if (dl.empty()) {
        dl = statsContainer.append('dl').attr('class', 'stats');
    }

    const stats = [
        { label: 'Commits', value: filteredCommits.length },
        { label: 'Files', value: d3.group(filteredData, d => d.file).size },
        { label: 'Total LOC', value: filteredData.length },
        { label: 'Max Depth', value: d3.max(filteredData, d => d.depth) || 0 },
        { label: 'Longest Line', value: d3.max(filteredData, d => d.length) || 0 },
    ];

    dl.selectAll('div.stat-item')
        .data(stats, d => d.label)
        .join(
            enter => {
                const div = enter.append('div').attr('class', 'stat-item');
                div.append('dt').text(d => d.label);
                div.append('dd').text(d => d.value);
                return div;
            },
            update => {
                update.select('dd').text(d => d.value);
                return update;
            }
        )
        .style('display', 'contents'); // Make div a "ghost" container for grid layout
}


// Initial render of the scatter plot structure
function renderScatterPlot(allCommits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const usableArea = {
    top: margin.top, right: width - margin.right, bottom: height - margin.bottom,
    left: margin.left, width: width - margin.left - margin.right, height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime().domain(d3.extent(allCommits, d => d.datetime)).range([usableArea.left, usableArea.right]).nice();
  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  svg.append('g').attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).ticks(12).tickFormat('').tickSize(-usableArea.width));

  svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${usableArea.bottom})`).call(d3.axisBottom(xScale));
  svg.append('g').attr('class', 'y-axis').attr('transform', `translate(${usableArea.left}, 0)`).call(d3.axisLeft(yScale).ticks(12).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

  svg.append('g').attr('class', 'dots');
  
  updateScatterPlot([]); // Initially render with no points
}


// Update the scatter plot with new data
function updateScatterPlot(filteredCommits) {
  const svg = d3.select('#chart').select('svg');
  const dots = svg.select('g.dots');

  const [minLines, maxLines] = d3.extent(filteredCommits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([3, 25]);

  const sortedCommits = d3.sort(filteredCommits, d => -d.totalLines);

  dots.selectAll('circle')
    .data(sortedCommits, d => d.id) // Key function for object constancy
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1).raise();
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', event => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}


// Update the unit visualization for files
function updateFileDisplay(filteredCommits) {
  const lines = filteredCommits.flatMap(d => d.lines);
  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const filesContainer = d3.select('#files')
    .selectAll('div')
    .data(files, d => d.name)
    .join(enter =>
      enter.append('div').call(div => {
        div.append('dt');
        div.append('dd');
      })
    );

  filesContainer.select('dt').html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
  
  filesContainer.select('dd')
    .selectAll('div.loc')
    .data(d => d.lines, d => d.commit + d.line) // Unique key for each line
    .join('div')
    .attr('class', 'loc')
    .style('--color', d => colors(d.type));
}

// Setup and configure scrollytelling
function setupScrollytelling(allCommits) {
  d3.select('#scatter-story')
    .selectAll('.step')
    .data(allCommits)
    .join('div')
    .attr('class', 'step')
    .html((d, i) => `
      <h3>Commit #${i + 1}</h3>
      <p>On ${d.datetime.toLocaleString('en', { dateStyle: 'full', timeStyle: 'short' })},
      I made <a href="${d.url}" target="_blank">${i > 0 ? 'another commit' : 'my first commit'}</a>.
      I edited ${d.totalLines} lines across ${d3.rollup(d.lines, D => D.length, d => d.file).length} file(s).</p>
    `);
  
  const scroller = scrollama();
  scroller.setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
    offset: 0.5,
    debug: false,
  }).onStepEnter(onStepEnter);
}

// Handle scrollytelling step changes
function onStepEnter(response) {
  const currentCommit = response.element.__data__;
  const filteredCommits = commits.filter(d => d.datetime <= currentCommit.datetime);
  const filteredData = filteredCommits.flatMap(d => d.lines);

  updateScatterPlot(filteredCommits);
  renderOrUpdateCommitInfo(filteredData, filteredCommits);
  updateFileDisplay(filteredCommits);
}


// --- Tooltip Functions ---
function renderTooltipContent(commit) {
  if (!commit) return;
  d3.select('#commit-link').attr('href', commit.url).text(commit.id.substring(0, 7));
  d3.select('#commit-date').text(commit.datetime?.toLocaleDateString('en', { dateStyle: 'full' }));
  d3.select('#commit-time').text(commit.datetime?.toLocaleTimeString('en'));
  d3.select('#commit-author').text(commit.author);
  d3.select('#commit-lines').text(commit.totalLines);
}

function updateTooltipVisibility(isVisible) {
  d3.select('#commit-tooltip').attr('hidden', isVisible ? null : true);
}

function updateTooltipPosition(event) {
  d3.select('#commit-tooltip').style('left', `${event.clientX + 15}px`).style('top', `${event.clientY + 15}px`);
}

// --- Run main function ---
main();