document.addEventListener('DOMContentLoaded', () => {
    const artGallery = document.getElementById('art-gallery');
    const modal = document.getElementById('artModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const closeModalButton = document.querySelector('.modal-close-button');
    const currentYearSpan = document.getElementById('currentYear');

    // Update current year in footer
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    let artPieces = []; // This will be populated from the JSON file

    // Function to fetch art data from JSON file
    async function loadArtData() {
        try {
            const response = await fetch('art_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            artPieces = await response.json();
            renderGallery();
        } catch (error) {
            console.error("Could not load art data:", error);
            if (artGallery) {
                artGallery.innerHTML = "<p>Error loading art pieces. Please check the console for details.</p>";
            }
        }
    }

    // Function to render art pieces in the gallery
    function renderGallery() {
        if (!artGallery) return;

        artGallery.innerHTML = ''; // Clear existing gallery items

        if (!artPieces || artPieces.length === 0) {
            // Optionally display a message if no art pieces are loaded
            // artGallery.innerHTML = "<p>No art pieces to display. Add some to art_data.json!</p>";
            return;
        }


        artPieces.forEach(piece => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('gallery-item');
            itemDiv.setAttribute('role', 'button');
            itemDiv.setAttribute('tabindex', '0'); // Make it focusable
            itemDiv.setAttribute('aria-label', `View details for ${piece.title}`);

            const img = document.createElement('img');
            img.src = piece.image;
            img.alt = piece.alt || piece.title; // Use specific alt text or fallback to title

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

    // Function to open the modal with art piece details
    function openModal(piece) {
        if (!modal || !modalImage || !modalTitle || !modalDescription) return;

        modalImage.src = piece.image;
        modalImage.alt = piece.alt || piece.title;
        modalTitle.textContent = piece.title;
        // The description might contain newlines (\n). CSS 'white-space: pre-wrap;' handles this.
        modalDescription.textContent = piece.description;

        modal.style.display = 'block';
        // For accessibility: set focus to the close button when modal opens
        if (closeModalButton) {
            closeModalButton.focus();
        }
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Function to close the modal
    function closeModal() {
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore background scrolling
        // Optionally return focus to the element that opened the modal
        // (Requires storing the focused element before opening the modal)
    }

    // Event listeners for closing the modal
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }

    if (modal) {
        // Close modal when clicking outside the modal content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    // Close modal with Escape key (listener on document)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal && modal.style.display === 'block') {
            closeModal();
        }
    });


    // Load art data and then render the gallery
    loadArtData();
});