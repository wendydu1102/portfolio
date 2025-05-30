// // art-portfolio/script.js
document.addEventListener('DOMContentLoaded', () => {
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

    let artPieces = []; // This will be populated from the JSON file

    // Function to generate a title from a filename
    function generateTitleFromFilename(imagePath) {
        const filename = imagePath.split('/').pop(); // e.g., "crimson-dream.png"
        const baseFilename = filename.substring(0, filename.lastIndexOf('.')); // e.g., "crimson-dream"
        // Capitalize first letter of each word, replace hyphens with spaces
        return baseFilename
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Function to fetch art data from JSON file
    async function loadArtData() {
        try {
            const response = await fetch('art_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching art_data.json`);
            }
            const rawArtData = await response.json();

            artPieces = rawArtData.map(item => {
                const generatedTitle = generateTitleFromFilename(item.image);
                return {
                    id: item.id, // ID is crucial and should be unique
                    image: item.image,
                    title: item.title || generatedTitle,
                    description: item.description || "More details coming soon for this piece.", // Default description
                    alt: item.alt || `Artwork titled: ${item.title || generatedTitle}` // Default alt text
                };
            });
            
            renderGallery();

        } catch (error) {
            console.error("Could not load or process art data:", error);
            if (artGallery) {
                artGallery.innerHTML = `<p style="text-align: center; color: red;">Error loading art pieces. Please ensure 'art_data.json' is correctly formatted and all listed images exist in the 'images' folder. Check the console for more details.</p>`;
            }
        }
    }

    // Function to render art pieces in the gallery
    function renderGallery() {
        if (!artGallery) return;

        if (!artPieces || artPieces.length === 0) {
             // Message will be shown by error handler in loadArtData if JSON is empty or malformed
             // Or if genuinely no art pieces are defined.
            if (document.readyState === 'complete' && artGallery.innerHTML === '') { // Check if no error message already present
                 artGallery.innerHTML = "<p style='text-align: center;'>No art pieces to display. Add image details to 'art_data.json'.</p>";
            }
            return;
        }
        artGallery.innerHTML = ''; // Clear existing gallery items

        artPieces.forEach(piece => {
            // Basic check if image path looks okay (very simple check)
            if (!piece.image || typeof piece.image !== 'string' || !piece.id) {
                console.warn("Skipping an art piece due to missing image path or ID:", piece);
                return; // Skip this piece
            }

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('gallery-item');
            itemDiv.setAttribute('role', 'button');
            itemDiv.setAttribute('tabindex', '0');
            itemDiv.setAttribute('aria-label', `View details for ${piece.title}`);

            const img = document.createElement('img');
            img.src = piece.image;
            img.alt = piece.alt; 
            
            // Add an error handler for missing images
            img.onerror = function() {
                console.error(`Error loading image: ${piece.image}. Check if the file exists in the 'images' folder and the path in 'art_data.json' is correct.`);
                itemDiv.innerHTML = `<p style="padding:10px; text-align:center; color:red;">Image not found: <br><small>${piece.image.split('/').pop()}</small></p>`;
                itemDiv.style.height = '150px'; // Give some height to the error message
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

    // Function to open the modal with art piece details
    function openModal(piece) {
        if (!modal || !modalImage || !modalTitle || !modalDescription) return;

        modalImage.src = piece.image;
        modalImage.alt = piece.alt;
        modalTitle.textContent = piece.title;
        modalDescription.textContent = piece.description; 

        modal.style.display = 'block';
        closeModalButton.focus(); 
        document.body.style.overflow = 'hidden';
    }

    // Function to close the modal
    function closeModal() {
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Event listeners for closing the modal
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
    }
    
    loadArtData();
});