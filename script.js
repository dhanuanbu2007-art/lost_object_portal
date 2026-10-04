// Wait for DOM
document.addEventListener('DOMContentLoaded', init);

// DOM Elements
const reportBtn = document.getElementById('reportBtn');
const reportModal = document.getElementById('reportModal');
const detailsModal = document.getElementById('detailsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const closeDetailsFooterBtn = document.getElementById('closeDetailsFooterBtn');
const reportForm = document.getElementById('reportForm');
const itemsGrid = document.getElementById('itemsGrid');
const noResults = document.getElementById('noResults');
const totalLostEl = document.getElementById('totalLost');
const totalFoundEl = document.getElementById('totalFound');

// Filters
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');

// Image Upload
const itemImageInput = document.getElementById('itemImage');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const uploadPlaceholder = document.querySelector('.upload-placeholder');
let currentImageData = null;

// State management (Local Storage)
let items = JSON.parse(localStorage.getItem('campusFindItems')) || [];

function init() {
    seedDummyDataIfEmpty();
    renderItems();
    updateStats();
    setupEventListeners();
}

function seedDummyDataIfEmpty() {
    if (items.length === 0) {
        items = [
            {
                id: '1',
                type: 'lost',
                name: 'Apple AirPods Pro',
                category: 'electronics',
                date: '2023-10-15',
                location: 'Main Library, 2nd Floor',
                description: 'White AirPods Pro case with a small scratch on the back. Left earbud is missing inside.',
                image: null,
                contactName: 'Alex Johnson',
                contactInfo: 'alex.j@college.edu',
                status: 'lost',
                createdAt: Date.now() - 86400000
            },
            {
                id: '2',
                type: 'found',
                name: 'Blue Hydroflask',
                category: 'accessories',
                date: '2023-10-16',
                location: 'Science Building, Room 302',
                description: 'Blue 32oz Hydroflask with several stickers including a NASA logo and a GitHub octocat.',
                image: null,
                contactName: 'Sarah Smith',
                contactInfo: '555-0192',
                status: 'found',
                createdAt: Date.now() - 40000000
            },
            {
                id: '3',
                type: 'lost',
                name: 'Calculus Textbook',
                category: 'books',
                date: '2023-10-18',
                location: 'Student Union Cafeteria',
                description: 'Stewart Calculus 8th Edition. Has my name written on the inside cover in blue ink.',
                image: null,
                contactName: 'Michael Chang',
                contactInfo: 'm.chang@college.edu',
                status: 'returned',
                createdAt: Date.now() - 20000000
            }
        ];
        saveItems();
    }
}

function setupEventListeners() {
    // Open report modal
    reportBtn.addEventListener('click', () => {
        reportForm.reset();
        resetImageUpload();
        reportModal.showModal();
    });

    // Close modals
    closeModalBtn.addEventListener('click', () => reportModal.close());
    cancelBtn.addEventListener('click', () => reportModal.close());
    closeDetailsBtn.addEventListener('click', () => detailsModal.close());
    closeDetailsFooterBtn.addEventListener('click', () => detailsModal.close());

    // Click backdrop to close
    [reportModal, detailsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            const rect = modal.getBoundingClientRect();
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                                rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
            if (!isInDialog) {
                modal.close();
            }
        });
    });

    // Form submission
    reportForm.addEventListener('submit', handleFormSubmit);

    // Filters & Search
    searchInput.addEventListener('input', renderItems);
    filterCategory.addEventListener('change', renderItems);
    filterStatus.addEventListener('change', renderItems);

    // Image Upload Handling
    itemImageInput.addEventListener('change', handleImageUpload);
    removeImageBtn.addEventListener('click', resetImageUpload);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Size limit check (approx 2MB for localstorage safety)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image is too large. Please select an image under 2MB.');
        itemImageInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        currentImageData = event.target.result;
        imagePreview.src = currentImageData;
        imagePreview.classList.remove('hidden');
        removeImageBtn.classList.remove('hidden');
        uploadPlaceholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

function resetImageUpload(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    itemImageInput.value = '';
    currentImageData = null;
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    removeImageBtn.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Modern pattern to validate input before proceeding
    if (!reportForm.checkValidity()) {
        return;
    }

    const formData = new FormData(reportForm);
    
    const newItem = {
        id: Date.now().toString(),
        type: formData.get('itemType'),
        name: formData.get('itemName'),
        category: formData.get('itemCategory'),
        date: formData.get('itemDate'),
        location: formData.get('itemLocation'),
        description: formData.get('itemDescription'),
        image: currentImageData,
        contactName: formData.get('contactName'),
        contactInfo: formData.get('contactInfo'),
        status: formData.get('itemType'), // initial status matches type
        createdAt: Date.now()
    };

    try {
        items.unshift(newItem); // Add to beginning
        saveItems();
        renderItems();
        updateStats();
        reportModal.close();
        
        // Show brief success toast/alert
        setTimeout(() => alert('Item reported successfully!'), 100);
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            alert('Local storage is full! Please try uploading a smaller image or clearing data.');
            items.shift(); // Revert
        } else {
            console.error('Error saving item:', error);
        }
    }
}

function saveItems() {
    localStorage.setItem('campusFindItems', JSON.stringify(items));
}

function updateStats() {
    const lost = items.filter(i => i.type === 'lost' && i.status !== 'returned').length;
    const found = items.filter(i => i.type === 'found' && i.status !== 'returned').length;
    
    totalLostEl.textContent = `Lost: ${lost}`;
    totalFoundEl.textContent = `Found: ${found}`;
}

function getCategoryIcon(category) {
    const icons = {
        'electronics': 'fa-laptop',
        'clothing': 'fa-shirt',
        'accessories': 'fa-glasses',
        'books': 'fa-book',
        'other': 'fa-box'
    };
    return icons[category] || 'fa-box';
}

function renderItems() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const categoryFilter = filterCategory.value;
    const statusFilter = filterStatus.value;

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                              item.location.toLowerCase().includes(searchTerm) ||
                              item.description.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    itemsGrid.innerHTML = '';

    if (filteredItems.length === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        
        filteredItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.onclick = () => openDetails(item.id);
            
            const dateStr = new Date(item.date).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
            });

            const catIcon = getCategoryIcon(item.category);
            
            const imageHtml = item.image 
                ? `<img src="${item.image}" alt="${item.name}" class="item-image" loading="lazy">`
                : `<div class="item-image placeholder"><i class="fa-solid fa-image"></i></div>`;

            card.innerHTML = `
                ${imageHtml}
                <div class="item-content">
                    <div class="item-header">
                        <h3 class="item-title">${item.name}</h3>
                        <span class="status-badge status-${item.status}">${item.status}</span>
                    </div>
                    <ul class="item-details-list">
                        <li><i class="fa-solid ${catIcon}"></i> <span style="text-transform: capitalize;">${item.category}</span></li>
                        <li><i class="fa-solid fa-location-dot"></i> ${item.location}</li>
                        <li><i class="fa-regular fa-calendar"></i> ${dateStr}</li>
                    </ul>
                    <div class="item-footer">
                        <span>Reported by ${item.contactName.split(' ')[0]}</span>
                        <span><i class="fa-solid fa-chevron-right" style="font-size: 0.8rem"></i></span>
                    </div>
                </div>
            `;
            itemsGrid.appendChild(card);
        });
    }
}

function openDetails(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const detailsBody = document.getElementById('detailsBody');
    const markReturnedBtn = document.getElementById('markReturnedBtn');
    
    const dateStr = new Date(item.date).toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
    });

    const catIcon = getCategoryIcon(item.category);

    const imageHtml = item.image 
        ? `<img src="${item.image}" alt="${item.name}" class="details-image">`
        : `<div class="details-image placeholder"><i class="fa-solid fa-image"></i></div>`;

    detailsBody.innerHTML = `
        ${imageHtml}
        <div class="details-header">
            <h3 class="details-title">${item.name}</h3>
            <span class="status-badge status-${item.status}">${item.status.toUpperCase()}</span>
        </div>
        
        <div class="details-meta">
            <div class="meta-item">
                <i class="fa-solid ${catIcon}"></i>
                <div>
                    <span class="meta-label">Category</span>
                    <span class="meta-value" style="text-transform: capitalize;">${item.category}</span>
                </div>
            </div>
            <div class="meta-item">
                <i class="fa-regular fa-calendar"></i>
                <div>
                    <span class="meta-label">Date ${item.type === 'lost' ? 'Lost' : 'Found'}</span>
                    <span class="meta-value">${dateStr}</span>
                </div>
            </div>
            <div class="meta-item">
                <i class="fa-solid fa-location-dot"></i>
                <div>
                    <span class="meta-label">Location</span>
                    <span class="meta-value">${item.location}</span>
                </div>
            </div>
        </div>
        
        <div class="details-description">
            <h3>Description</h3>
            <p>${item.description}</p>
        </div>
        
        <div class="details-contact">
            <h3><i class="fa-solid fa-address-card"></i> Contact Information</h3>
            <div class="contact-info-grid">
                <div>
                    <strong>Name</strong>
                    <p>${item.contactName}</p>
                </div>
                <div>
                    <strong>Contact</strong>
                    <p>${item.contactInfo}</p>
                </div>
            </div>
        </div>
    `;

    // Only show "Mark as Returned" if not already returned
    if (item.status !== 'returned') {
        markReturnedBtn.classList.remove('hidden');
        markReturnedBtn.onclick = () => {
            if(confirm('Are you sure you want to mark this item as returned/resolved?')) {
                item.status = 'returned';
                saveItems();
                renderItems();
                updateStats();
                detailsModal.close();
            }
        };
    } else {
        markReturnedBtn.classList.add('hidden');
    }

    detailsModal.showModal();
}
