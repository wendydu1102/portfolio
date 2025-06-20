document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const navLinks = document.querySelectorAll('nav .nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    function updateActiveSection() {
        let sectionId = window.location.hash ? window.location.hash.substring(1) : 'home';
        if (!document.getElementById(sectionId)) { // Fallback to home if hash is invalid
            sectionId = 'home';
            window.location.hash = '#home'; // Correct the URL
        }

        contentSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active-section');
                section.classList.remove('hidden-section');
            } else {
                section.classList.add('hidden-section');
                section.classList.remove('active-section');
            }
        });

        navLinks.forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // e.preventDefault(); // Prevent default if not using hash-based navigation
            const sectionId = this.getAttribute('data-section');
            window.location.hash = sectionId; // This will trigger hashchange event or direct update
            // updateActiveSection(); // Call directly if not relying on hashchange for some reason
        });
    });

    window.addEventListener('hashchange', updateActiveSection);
    updateActiveSection(); // Initial call to set the correct section on page load


    // Art Gallery
    const artGallery = document.getElementById('art-gallery');
    const modal = document.getElementById('artModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const closeModalButton = document.querySelector('.modal-close-button');
    const currentYearSpan = document.getElementById('currentYear');

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    let artPieces = [];

    function generateTitleFromFilename(imagePath) {
        const filename = imagePath.split('/').pop();
        const baseFilename = filename.substring(0, filename.lastIndexOf('.'));
        return baseFilename
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async function loadArtData() {
        if (!artGallery) return; // Only load if the art gallery element exists

        try {
            const response = await fetch('art_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching art_data.json`);
            }
            const rawArtData = await response.json();

            artPieces = rawArtData.map(item => {
                const generatedTitle = generateTitleFromFilename(item.image);
                return {
                    id: item.id,
                    image: item.image,
                    title: item.title || generatedTitle,
                    description: item.description || "More details coming soon for this piece.",
                    alt: item.alt || `Artwork titled: ${item.title || generatedTitle}`
                };
            });

            renderGallery();

        } catch (error) {
            console.error("Could not load or process art data:", error);
            if (artGallery) {
                artGallery.innerHTML = `<p style="text-align: center; color: red;">Error loading art pieces. Please check 'art_data.json' and image paths. See console for details.</p>`;
            }
        }
    }

    function renderGallery() {
        if (!artGallery) return;

        if (!artPieces || artPieces.length === 0) {
            if (artGallery.innerHTML === '') {
                artGallery.innerHTML = "<p style='text-align: center;'>No art pieces to display. Add data to 'art_data.json'.</p>";
            }
            return;
        }
        artGallery.innerHTML = '';

        artPieces.forEach(piece => {
            if (!piece.image || typeof piece.image !== 'string' || !piece.id) {
                console.warn("Skipping an art piece due to missing image path or ID:", piece);
                return;
            }

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('gallery-item');
            itemDiv.setAttribute('role', 'button');
            itemDiv.setAttribute('tabindex', '0');
            itemDiv.setAttribute('aria-label', `View details for ${piece.title}`);

            const img = document.createElement('img');
            img.src = piece.image;
            img.alt = piece.alt;

            img.onerror = function () {
                console.error(`Error loading image: ${piece.image}.`);
                itemDiv.innerHTML = `<p style="padding:10px; text-align:center; color:red;">Image not found: <br><small>${piece.image.split('/').pop()}</small></p>`;
                itemDiv.style.height = '150px';
                itemDiv.style.display = 'flex';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.justifyContent = 'center';
                itemDiv.style.border = '1px dashed red';
            };

            itemDiv.appendChild(img);
            itemDiv.addEventListener('click', () => openModal(piece));
            itemDiv.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    openModal(piece);
                }
            });
            artGallery.appendChild(itemDiv);
        });
    }

    function openModal(piece) {
        if (!modal || !modalImage || !modalTitle || !modalDescription) return;

        modalImage.src = piece.image;
        modalImage.alt = piece.alt;
        modalTitle.textContent = piece.title;
        modalDescription.textContent = piece.description;

        modal.style.display = 'block';
        if (closeModalButton) closeModalButton.focus();
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    function closeModal() {
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore background scroll
    }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) { // Click outside modal content
                closeModal();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
    }

    // Load art data only if the art gallery section is present
    if (artGallery) {
        loadArtData();
    }
});