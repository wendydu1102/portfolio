console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// -- Dark mode switch (Added first so it appears at top) --
document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
			<option value="light">Light</option>
			<option value="dark">Dark</option>
		</select>
	</label>`,
);

const colorSchemeSelect = document.querySelector('.color-scheme select');

function setColorScheme(colorScheme) {
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    localStorage.colorScheme = colorScheme;
    if (colorSchemeSelect) {
        colorSchemeSelect.value = colorScheme;
    }
}

if ("colorScheme" in localStorage) {
    setColorScheme(localStorage.colorScheme);
}

colorSchemeSelect?.addEventListener('input', function (event) {
  setColorScheme(event.target.value);
});

// -- Automatic navigation menu --
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/DSC106_Portfolio/"; 

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'meta/', title: 'Meta' },
  { url: 'https://github.com/wendydu1102', title: 'GitHub' }
];

let nav = document.createElement('nav');
let ul = document.createElement('ul');
nav.append(ul);

// Find the theme switcher label to insert nav after it
const themeSwitcher = document.querySelector('.color-scheme');
if (themeSwitcher) {
    themeSwitcher.after(nav);
} else {
    document.body.prepend(nav);
}

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  
  url = !url.startsWith('http') ? BASE_PATH + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  
  // Highlight current page
  const currentPath = location.pathname.replace(BASE_PATH, '').replace('index.html', '');
  const linkPath = p.url;
  
  if (a.host === location.host && currentPath === linkPath) {
    a.classList.add('current');
  }

  if (a.host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  
  let li = document.createElement('li');
  li.append(a);
  ul.append(li);
}

// -- Fetch and Render helpers --
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching JSON:', error);
    return null;
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) return;
  containerElement.innerHTML = '';

  if (!projects || projects.length === 0) {
    containerElement.innerHTML = '<p>No projects found.</p>';
    return;
  }

  for (const project of projects) {
    const article = document.createElement('article');
    let imageUrl = project.image 
        ? (project.image.startsWith('http') ? project.image : BASE_PATH + project.image)
        : 'https://via.placeholder.com/400x225';
    
    const buttonHtml = project.url 
      ? `<a href="${project.url}" class="project-button" target="_blank">View Details</a>` 
      : '';

    article.innerHTML = `
        <${headingLevel}>${project.title}</${headingLevel}>
        <img src="${imageUrl}" alt="${project.title}">
        <div class="project-content">
            <p>${project.description}</p>
            <div class="project-footer">
                <span class="project-year">${project.year}</span>
                ${buttonHtml}
            </div>
        </div>
    `;
    containerElement.appendChild(article);
  }
}