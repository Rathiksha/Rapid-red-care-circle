// Rapid Red Care Circle - Frontend JavaScript

let map = null;
let markers = [];
let currentUserId = 1; // Demo user ID
let allDonors = []; // Store all donors for best donor calculation
let bestDonorMarker = null;
let routeLine = null;
let userLocation = { lat: 13.0827, lng: 80.2707 }; // Chennai center as user location

// View switching
function showView(viewName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Handle event-based calls vs programmatic calls
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Programmatic call - find and activate the correct nav button
        const navButtons = document.querySelectorAll('.nav-btn');
        const viewIndex = ['register', 'donate', 'request', 'map', 'history'].indexOf(viewName);
        if (viewIndex >= 0 && navButtons[viewIndex]) {
            navButtons[viewIndex].classList.add('active');
        }
    }
    
    // Update views
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Load data for the view
    if (viewName === 'map') {
        initMap();
        loadDonors();
    } else if (viewName === 'history') {
        loadHistory();
    }
}

// Handle registration form submission
async function handleRegistration(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const bloodGroup = document.getElementById('bloodGroup').value;
    const mobileNumber = document.getElementById('mobileNumber').value;
    const city = document.getElementById('city').value;
    const lastDonationDate = document.getElementById('lastDonationDate').value;
    const medicalHistory = document.getElementById('medicalHistory').value;
    const isDonor = document.getElementById('isDonor').checked;
    
    // Validate age
    const ageError = document.getElementById('age-error');
    if (age < 18 || age > 60) {
        ageError.classList.add('show');
        return;
    } else {
        ageError.classList.remove('show');
    }
    
    const successMessage = document.getElementById('registration-success');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName,
                age,
                gender,
                bloodGroup,
                mobileNumber,
                city,
                lastDonationDate: lastDonationDate || null,
                medicalHistory,
                isDonor,
                password: 'demo123'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            successMessage.textContent = `✓ Registration successful! Welcome ${fullName}`;
            successMessage.classList.add('show');
            
            // Reset form
            document.getElementById('registration-form').reset();
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 5000);
            
            // If donor, update location
            if (isDonor && data.userId) {
                await updateDonorLocation(data.userId);
            }
        } else {
            alert('Registration failed: ' + data.error);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

// Update donor location (using browser geolocation or default)
async function updateDonorLocation(userId) {
    try {
        // Use default New York coordinates for demo
        const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
        const lng = -74.0060 + (Math.random() - 0.5) * 0.1;
        
        await fetch(`/api/donors/${userId}/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng })
        });
    } catch (error) {
        console.error('Error updating location:', error);
    }
}

// Initialize map centered on Chennai, India
function initMap() {
    if (map) return;
    
    // Center on Chennai, India (13.0827, 80.2707) with zoom level 12
    map = L.map('map').setView([13.0827, 80.2707], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add dummy donors immediately
    addDummyDonors();
}

// Add dummy donor data for Chennai
function addDummyDonors() {
    // Comprehensive dummy donor data - ALL blood groups in ALL locations
    const locations = [
        { name: 'Anna Nagar', lat: 13.0850, lng: 80.2100 },
        { name: 'T. Nagar', lat: 13.0418, lng: 80.2341 },
        { name: 'Adyar', lat: 13.0012, lng: 80.2565 },
        { name: 'Velachery', lat: 12.9815, lng: 80.2180 },
        { name: 'Egmore', lat: 13.0732, lng: 80.2609 }
    ];
    
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    
    const firstNames = ['Ravi', 'Priya', 'Ahmed', 'Sarah', 'John', 'Lakshmi', 'Kumar', 'Anjali', 
                        'Vijay', 'Meera', 'Arjun', 'Divya', 'Karthik', 'Sneha', 'Rahul', 'Pooja',
                        'Suresh', 'Kavya', 'Arun', 'Nisha', 'Prakash', 'Deepa', 'Manoj', 'Swathi',
                        'Ganesh', 'Preethi', 'Naveen', 'Harini', 'Rajesh', 'Mythili', 'Sanjay', 'Keerthi',
                        'Venkat', 'Ramya', 'Ashok', 'Sangeetha', 'Dinesh', 'Pavithra', 'Mohan', 'Varsha'];
    
    const dummyDonors = [];
    let nameIndex = 0;
    
    // Generate donors for each location and blood group combination
    locations.forEach(location => {
        bloodGroups.forEach(bloodGroup => {
            const name = firstNames[nameIndex % firstNames.length];
            nameIndex++;
            
            // Add slight random offset to coordinates so markers don't overlap
            const latOffset = (Math.random() - 0.5) * 0.01;
            const lngOffset = (Math.random() - 0.5) * 0.01;
            
            dummyDonors.push({
                name: name,
                location: location.name,
                bloodGroup: bloodGroup,
                distance: (Math.random() * 9 + 1).toFixed(1), // Will be recalculated based on search
                eta: Math.floor(Math.random() * 40 + 5), // Will be recalculated
                reliability: Math.floor(Math.random() * 40 + 60), // 60-100%
                eligibility: Math.floor(Math.random() * 30 + 70), // 70-100%
                coordinates: {
                    lat: location.lat + latOffset,
                    lng: location.lng + lngOffset
                }
            });
        });
    });
    
    // Store donors for best donor calculation
    allDonors = [...dummyDonors];
    
    // Create custom red blinking icon
    const redIcon = L.divIcon({
        className: 'blinking-icon',
        html: '<div class="red-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
    
    // Add markers for each dummy donor
    dummyDonors.forEach(donor => {
        const marker = L.marker(
            [donor.coordinates.lat, donor.coordinates.lng],
            { icon: redIcon }
        ).addTo(map);
        
        // Bind popup with donor details
        marker.bindPopup(`
            <div style="font-family: 'Segoe UI', sans-serif; min-width: 200px;">
                <b>Name:</b> ${donor.name}<br>
                <b>Location:</b> ${donor.location}<br>
                <b>Blood:</b> ${donor.bloodGroup}<br>
                <b>Distance:</b> ${donor.distance} km<br>
                <b>ETA:</b> ${donor.eta} min
            </div>
        `);
        
        markers.push(marker);
    });
    
    console.log(`Generated ${dummyDonors.length} dummy donors across ${locations.length} locations`);
}

// Load donors on map (from database)
async function loadDonors() {
    try {
        const response = await fetch('/api/map/donors');
        const data = await response.json();
        
        // Clear existing markers (except dummy donors if you want to keep them)
        // markers.forEach(marker => map.removeLayer(marker));
        // markers = [];
        
        // Create custom red blinking icon
        const redIcon = L.divIcon({
            className: 'blinking-icon',
            html: '<div class="red-marker"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
        
        // Add donor markers from database
        data.donors.forEach(donor => {
            if (donor.coordinates) {
                const reliabilityLevel = getReliabilityLevel(donor.reliabilityScore);
                
                const marker = L.marker(
                    [donor.coordinates.lat, donor.coordinates.lng],
                    { icon: redIcon }
                ).addTo(map);
                
                marker.bindPopup(`
                    <div style="min-width: 250px; font-family: 'Segoe UI', sans-serif;">
                        <h3 style="margin-bottom: 0.75rem; color: #dc2626; font-size: 1.1rem;">${donor.fullName}</h3>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <strong>Blood Group:</strong> 
                                <span style="color: #dc2626; font-weight: bold;">${donor.bloodGroup}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <strong>City:</strong> 
                                <span>${donor.city}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong>Reliability:</strong> 
                                <span class="badge badge-${reliabilityLevel.class}" style="padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem;">
                                    ${reliabilityLevel.label} (${donor.reliabilityScore}%)
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <strong>Eligibility:</strong> 
                                <span>${donor.eligibilityScore}%</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <strong>Donations:</strong> 
                                <span>${donor.completedDonations}/${donor.totalDonations}</span>
                            </div>
                        </div>
                    </div>
                `);
                
                markers.push(marker);
            }
        });
        
        if (data.donors.length === 0) {
            console.log('No database donors found. Showing dummy donors only.');
        }
    } catch (error) {
        console.error('Error loading donors:', error);
        console.log('Showing dummy donors only.');
    }
}

// Get reliability level
function getReliabilityLevel(score) {
    if (score >= 80) return { label: 'High', class: 'high' };
    if (score >= 60) return { label: 'Medium', class: 'medium' };
    return { label: 'Low', class: 'low' };
}

// Load history with card-based layout
async function loadHistory() {
    try {
        const response = await fetch(`/api/history/requester/${currentUserId}`);
        const data = await response.json();
        
        // Display accepted donations
        const acceptedList = document.getElementById('accepted-list');
        if (data.accepted.length === 0) {
            acceptedList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No Accepted Donations Yet</h3>
                    <p>Accepted donations will appear here</p>
                </div>
            `;
        } else {
            acceptedList.innerHTML = data.accepted.map(d => `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${d.donorName}</h3>
                            <span class="badge badge-${d.urgencyBand?.toLowerCase()}">${d.urgencyBand || 'N/A'}</span>
                        </div>
                        <div class="card-icon">✅</div>
                    </div>
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-label">Blood Group</span>
                            <span class="info-value">${d.bloodGroup}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">City</span>
                            <span class="info-value">${d.city}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Type</span>
                            <span class="info-value">${d.donationType || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status</span>
                            <span class="info-value">${d.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Accepted</span>
                            <span class="info-value">${new Date(d.acceptedAt).toLocaleDateString()}</span>
                        </div>
                        ${d.completedAt ? `
                        <div class="info-row">
                            <span class="info-label">Completed</span>
                            <span class="info-value">${new Date(d.completedAt).toLocaleDateString()}</span>
                        </div>
                        ` : ''}
                    </div>
                    <button class="btn-private" style="width: 100%; margin-top: 1rem;" onclick="openPrivateRequestModal(${d.donorId}, '${d.donorName}')">
                        💬 Private Request
                    </button>
                </div>
            `).join('');
        }
        
        // Display future commitments
        const futureList = document.getElementById('future-list');
        if (data.futureCommitments.length === 0) {
            futureList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🤝</div>
                    <h3>No Future Commitments Yet</h3>
                    <p>Future donation commitments will appear here</p>
                </div>
            `;
        } else {
            futureList.innerHTML = data.futureCommitments.map(d => `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${d.donorName}</h3>
                            <span class="badge badge-${d.urgencyBand?.toLowerCase()}">${d.urgencyBand}</span>
                        </div>
                        <div class="card-icon">📅</div>
                    </div>
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-label">Blood Group</span>
                            <span class="info-value">${d.bloodGroup}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">City</span>
                            <span class="info-value">${d.city}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Committed</span>
                            <span class="info-value">${new Date(d.respondedAt).toLocaleDateString()}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Request Date</span>
                            <span class="info-value">${new Date(d.requestDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        alert('Failed to load history');
    }
}

// Create sample data
async function createSampleData() {
    const successMessage = document.getElementById('registration-success');
    successMessage.textContent = 'Creating sample data...';
    successMessage.classList.add('show');
    
    try {
        const donors = [
            { fullName: 'John Doe', age: 25, gender: 'Male', mobileNumber: '+1234567890', city: 'New York', bloodGroup: 'O+', lat: 40.7128, lng: -74.0060 },
            { fullName: 'Jane Smith', age: 30, gender: 'Female', mobileNumber: '+1234567891', city: 'New York', bloodGroup: 'A+', lat: 40.7580, lng: -73.9855 },
            { fullName: 'Bob Johnson', age: 35, gender: 'Male', mobileNumber: '+1234567892', city: 'New York', bloodGroup: 'B+', lat: 40.7489, lng: -73.9680 },
            { fullName: 'Alice Williams', age: 28, gender: 'Female', mobileNumber: '+1234567893', city: 'New York', bloodGroup: 'AB+', lat: 40.7614, lng: -73.9776 }
        ];
        
        const donorIds = [];
        
        for (const donor of donors) {
            const userResponse = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...donor,
                    password: 'demo123',
                    isDonor: true,
                    lastDonationDate: '2024-01-15',
                    medicalHistory: ''
                })
            });
            
            const userData = await userResponse.json();
            
            if (userData.userId && userData.isDonor) {
                donorIds.push(userData.userId);
                
                await fetch(`/api/donors/${userData.userId}/location`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        latitude: donor.lat,
                        longitude: donor.lng
                    })
                });
            }
        }
        
        successMessage.textContent = `✓ Sample data created! ${donors.length} donors added. Check the Map View.`;
        
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 5000);
    } catch (error) {
        console.error('Error creating sample data:', error);
        successMessage.textContent = `✗ Error: ${error.message}`;
    }
}


// Find Best Donor Feature
async function findBestDonor() {
    const fabButton = document.querySelector('.fab');
    fabButton.classList.add('scanning');
    fabButton.innerHTML = '<span>🔍</span><span>SCANNING...</span>';
    
    // Create radar pulse effect
    createRadarPulse();
    
    // Wait 3 seconds for "calculating" animation
    setTimeout(() => {
        const bestDonor = calculateBestDonor();
        
        if (bestDonor) {
            highlightBestDonor(bestDonor);
            drawRouteToBestDonor(bestDonor);
            showBestDonorModal(bestDonor);
        }
        
        // Reset button
        fabButton.classList.remove('scanning');
        fabButton.innerHTML = '<span>🎯</span><span>FIND BEST DONOR</span>';
    }, 3000);
}

// Calculate Best Donor using weighted scoring algorithm
function calculateBestDonor() {
    if (allDonors.length === 0) {
        alert('No donors available');
        return null;
    }
    
    const scoredDonors = allDonors.map(donor => {
        // Distance Score (30%): Closer is better
        const distanceScore = Math.max(0, 100 - (parseFloat(donor.distance) * 5));
        
        // ETA Score (20%): Lower time is better
        const etaScore = Math.max(0, 100 - (donor.eta * 2));
        
        // Reliability Score (30%): Use existing reliability
        let reliabilityScore = 50; // Default
        if (donor.reliability) {
            reliabilityScore = donor.reliability;
        } else if (donor.reliabilityScore) {
            reliabilityScore = donor.reliabilityScore;
        }
        
        // Eligibility Score (20%): Use existing eligibility
        let eligibilityScore = 80; // Default
        if (donor.eligibility) {
            eligibilityScore = donor.eligibility;
        } else if (donor.eligibilityScore) {
            eligibilityScore = donor.eligibilityScore;
        }
        
        // Calculate weighted total score
        const totalScore = (
            (distanceScore * 0.30) +
            (etaScore * 0.20) +
            (reliabilityScore * 0.30) +
            (eligibilityScore * 0.20)
        );
        
        return {
            ...donor,
            score: Math.round(totalScore),
            breakdown: {
                distance: Math.round(distanceScore * 0.30),
                eta: Math.round(etaScore * 0.20),
                reliability: Math.round(reliabilityScore * 0.30),
                eligibility: Math.round(eligibilityScore * 0.20)
            }
        };
    });
    
    // Sort by score (highest first)
    scoredDonors.sort((a, b) => b.score - a.score);
    
    return scoredDonors[0];
}

// Highlight the best donor with green marker
function highlightBestDonor(donor) {
    // Remove previous best donor marker if exists
    if (bestDonorMarker) {
        map.removeLayer(bestDonorMarker);
    }
    
    // Create green pulsing icon
    const greenIcon = L.divIcon({
        className: '',
        html: '<div class="green-marker"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
    
    // Add green marker
    bestDonorMarker = L.marker(
        [donor.coordinates.lat, donor.coordinates.lng],
        { icon: greenIcon }
    ).addTo(map);
    
    // Bind popup
    bestDonorMarker.bindPopup(`
        <div style="font-family: 'Segoe UI', sans-serif; min-width: 200px;">
            <h3 style="color: #10b981; margin-bottom: 0.5rem;">🏆 BEST MATCH</h3>
            <b>Name:</b> ${donor.name}<br>
            <b>Blood:</b> ${donor.bloodGroup}<br>
            <b>Distance:</b> ${donor.distance} km<br>
            <b>ETA:</b> ${donor.eta} min<br>
            <b>Score:</b> <span style="color: #10b981; font-weight: bold;">${donor.score}/100</span>
        </div>
    `).openPopup();
    
    // Pan to best donor
    map.setView([donor.coordinates.lat, donor.coordinates.lng], 14, {
        animate: true,
        duration: 1
    });
}

// Draw route from user to best donor
function drawRouteToBestDonor(donor) {
    // Remove previous route if exists
    if (routeLine) {
        map.removeLayer(routeLine);
    }
    
    // Draw blue polyline
    const latlngs = [
        [userLocation.lat, userLocation.lng],
        [donor.coordinates.lat, donor.coordinates.lng]
    ];
    
    routeLine = L.polyline(latlngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        lineJoin: 'round'
    }).addTo(map);
    
    // Add user location marker
    const userIcon = L.divIcon({
        className: '',
        html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.6);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>');
}

// Show best donor result modal
function showBestDonorModal(donor) {
    const modal = document.getElementById('bestDonorModal');
    const scoreElement = document.getElementById('modalScore');
    const detailsElement = document.getElementById('modalDetails');
    
    scoreElement.textContent = `${donor.score}/100`;
    
    detailsElement.innerHTML = `
        <div class="modal-detail-row">
            <strong>Donor Name:</strong>
            <span>${donor.name}</span>
        </div>
        <div class="modal-detail-row">
            <strong>Blood Group:</strong>
            <span style="color: #dc2626; font-weight: bold;">${donor.bloodGroup}</span>
        </div>
        <div class="modal-detail-row">
            <strong>Distance:</strong>
            <span>${donor.distance} km</span>
        </div>
        <div class="modal-detail-row">
            <strong>ETA:</strong>
            <span>${donor.eta} minutes</span>
        </div>
        <div class="modal-detail-row">
            <strong>Reliability:</strong>
            <span>${donor.reliability || donor.reliabilityScore || 50}%</span>
        </div>
        <div class="modal-detail-row">
            <strong>Eligibility:</strong>
            <span>${donor.eligibility || donor.eligibilityScore || 80}%</span>
        </div>
        <hr style="margin: 1rem 0; border: none; border-top: 2px solid #e5e7eb;">
        <div style="font-size: 0.875rem; color: #6b7280; margin-top: 1rem;">
            <strong>Score Breakdown:</strong><br>
            Distance (30%): ${donor.breakdown.distance} points<br>
            ETA (20%): ${donor.breakdown.eta} points<br>
            Reliability (30%): ${donor.breakdown.reliability} points<br>
            Eligibility (20%): ${donor.breakdown.eligibility} points
        </div>
    `;
    
    modal.classList.add('show');
}

// Close modal
function closeModal() {
    document.getElementById('bestDonorModal').classList.remove('show');
}

// Request donor (placeholder)
function requestDonor() {
    alert('Request sent to donor! They will be notified immediately.');
    closeModal();
}

// Create radar pulse animation
function createRadarPulse() {
    const mapContainer = document.getElementById('map');
    const pulse = document.createElement('div');
    pulse.className = 'radar-pulse';
    pulse.style.position = 'absolute';
    pulse.style.top = '50%';
    pulse.style.left = '50%';
    pulse.style.transform = 'translate(-50%, -50%)';
    
    mapContainer.appendChild(pulse);
    
    setTimeout(() => {
        pulse.remove();
    }, 3000);
}


// Private Request Feature
let isEmergencyRequest = false;
let activeTimeouts = {}; // Store active timeout timers

// Open Private Request Modal
function openPrivateRequestModal(donorId, donorName) {
    document.getElementById('privateRequestDonorId').value = donorId;
    document.getElementById('privateRequestDonorName').textContent = donorName;
    document.getElementById('privateRequestMessage').value = '';
    
    // Reset emergency toggle
    isEmergencyRequest = false;
    const toggle = document.getElementById('emergencyToggle');
    const container = document.getElementById('emergencyToggleContainer');
    toggle.classList.remove('active');
    container.classList.remove('emergency');
    
    document.getElementById('privateRequestModal').classList.add('show');
}

// Close Private Request Modal
function closePrivateRequestModal() {
    document.getElementById('privateRequestModal').classList.remove('show');
}

// Toggle Emergency Status
function toggleEmergency() {
    isEmergencyRequest = !isEmergencyRequest;
    const toggle = document.getElementById('emergencyToggle');
    const container = document.getElementById('emergencyToggleContainer');
    
    if (isEmergencyRequest) {
        toggle.classList.add('active');
        container.classList.add('emergency');
    } else {
        toggle.classList.remove('active');
        container.classList.remove('emergency');
    }
}

// Handle Private Request Submission
async function handlePrivateRequest(event) {
    event.preventDefault();
    
    const donorId = document.getElementById('privateRequestDonorId').value;
    const donorName = document.getElementById('privateRequestDonorName').textContent;
    const message = document.getElementById('privateRequestMessage').value;
    
    try {
        // Create a mock request ID (in real app, this would come from backend)
        const requestId = `req_${Date.now()}`;
        
        // Close modal
        closePrivateRequestModal();
        
        // Show success message
        alert(`Private request sent to ${donorName}!${isEmergencyRequest ? '\n\nEmergency timeout: 10 seconds for testing.' : ''}`);
        
        // If emergency, start timeout timer
        if (isEmergencyRequest) {
            startTimeoutTimer(requestId, donorId, donorName);
        }
        
        // In a real app, you would send this to the backend:
        // await fetch('/api/requests/private', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         donorId,
        //         message,
        //         isEmergency: isEmergencyRequest,
        //         requesterId: currentUserId
        //     })
        // });
        
    } catch (error) {
        console.error('Error sending private request:', error);
        alert('Failed to send private request. Please try again.');
    }
}

// Start Timeout Timer (10 seconds for testing)
function startTimeoutTimer(requestId, donorId, donorName) {
    console.log(`Starting 10-second timeout for request ${requestId} to donor ${donorName}`);
    
    // Store the timeout
    activeTimeouts[requestId] = {
        donorId,
        donorName,
        startTime: Date.now(),
        timer: setTimeout(() => {
            handleTimeout(requestId, donorId, donorName);
        }, 10000) // 10 seconds for testing (20 minutes = 1200000 ms for production)
    };
    
    // Show countdown notification
    showCountdownNotification(requestId, donorName, 10);
}

// Show Countdown Notification
function showCountdownNotification(requestId, donorName, seconds) {
    let remainingSeconds = seconds;
    
    const notification = document.getElementById('timeoutNotification');
    const message = document.getElementById('timeoutNotificationMessage');
    
    message.innerHTML = `Waiting for <strong>${donorName}</strong> to respond... <span class="countdown-timer" id="countdown-${requestId}">${remainingSeconds}s</span>`;
    notification.classList.add('show');
    
    // Update countdown every second
    const countdownInterval = setInterval(() => {
        remainingSeconds--;
        const countdownElement = document.getElementById(`countdown-${requestId}`);
        
        if (countdownElement) {
            countdownElement.textContent = `${remainingSeconds}s`;
        }
        
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    // Store interval for cleanup
    if (activeTimeouts[requestId]) {
        activeTimeouts[requestId].countdownInterval = countdownInterval;
    }
}

// Handle Timeout (Auto-rejection)
function handleTimeout(requestId, donorId, donorName) {
    console.log(`Timeout occurred for request ${requestId} to donor ${donorName}`);
    
    // Clear countdown interval
    if (activeTimeouts[requestId] && activeTimeouts[requestId].countdownInterval) {
        clearInterval(activeTimeouts[requestId].countdownInterval);
    }
    
    // Show "Not Available" notification
    showTimeoutNotification(donorName);
    
    // Clean up timeout data
    delete activeTimeouts[requestId];
    
    // In a real app, you would:
    // 1. Update request status to "EXPIRED" in backend
    // 2. Send notification to requester
    // 3. Move to next donor in the list
    // await fetch(`/api/requests/${requestId}/timeout`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ donorId })
    // });
}

// Show Timeout Notification
function showTimeoutNotification(donorName) {
    const notification = document.getElementById('timeoutNotification');
    const message = document.getElementById('timeoutNotificationMessage');
    
    message.innerHTML = `<strong>${donorName}</strong> did not respond in time. The request has been marked as "Not Available".`;
    notification.classList.add('show');
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 8000);
}

// Cancel Timeout (if donor responds)
function cancelTimeout(requestId) {
    if (activeTimeouts[requestId]) {
        clearTimeout(activeTimeouts[requestId].timer);
        
        if (activeTimeouts[requestId].countdownInterval) {
            clearInterval(activeTimeouts[requestId].countdownInterval);
        }
        
        delete activeTimeouts[requestId];
        
        // Hide notification
        document.getElementById('timeoutNotification').classList.remove('show');
        
        console.log(`Timeout cancelled for request ${requestId}`);
    }
}


// Eligibility Questionnaire Feature
const eligibilityQuestions = [
    { id: 1, text: "Do you feel well and healthy today?", correctAnswer: "YES", category: "General Health" },
    { id: 2, text: "Did you sleep well last night (at least 5 hours)?", correctAnswer: "YES", category: "General Health" },
    { id: 3, text: "Did you take fatty food in the last 6 hours?", correctAnswer: "NO", category: "General Health" },
    { id: 4, text: "Any chronic disease or health problem?", correctAnswer: "NO", category: "General Health" },
    { id: 5, text: "Taking antibiotics or medication for infection in last 7 days?", correctAnswer: "NO", category: "General Health" },
    { id: 6, text: "Taken aspirin/pain killers in last 48 hours?", correctAnswer: "NO", category: "General Health" },
    { id: 7, text: "Taking biotin or herbal supplements regularly?", correctAnswer: "NO", category: "General Health" },
    { id: 8, text: "Drunk alcohol in last 24 hours?", correctAnswer: "NO", category: "General Health" },
    { id: 9, text: "Pregnant, breastfeeding, or given birth in last 6 months?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 10, text: "Engaged in risky sexual behavior or new partners in last 6 months?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 11, text: "History of drug use, needle sharing, or imprisonment?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 12, text: "Any dental procedures, piercings, or tattoos in last 4 months?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 13, text: "Had diarrhea or minor surgery in last 7 days?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 14, text: "Traveled to malaria-risk areas in last 3 years?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 15, text: "Lived in UK/France/Ireland between 1980-1996 (Mad Cow risk)?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 16, text: "Ever tested positive for HIV, Hepatitis B/C, or Syphilis?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 17, text: "Are you confident your blood is safe for transfusion?", correctAnswer: "YES", category: "Final Declaration" }
];

let questionAnswers = {};

// Open Eligibility Modal
function openEligibilityModal() {
    // Reset answers
    questionAnswers = {};
    
    // Hide result alert
    document.getElementById('resultAlert').classList.remove('show');
    
    // Auto-fill personal details if user is registered
    // (In a real app, you'd fetch this from the backend)
    
    // Generate questions
    renderQuestions();
    
    // Show modal
    document.getElementById('eligibilityModal').classList.add('show');
    
    // Scroll to top
    document.getElementById('eligibilityContent').scrollTop = 0;
}

// Close Eligibility Modal
function closeEligibilityModal() {
    document.getElementById('eligibilityModal').classList.remove('show');
}

// Render Questions
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    
    let currentCategory = '';
    let html = '';
    
    eligibilityQuestions.forEach(q => {
        // Add category header if new category
        if (q.category !== currentCategory) {
            if (currentCategory !== '') {
                html += '<div style="margin-bottom: 2rem;"></div>';
            }
            html += `<h4 style="color: #dc2626; font-size: 1.1rem; margin-bottom: 1rem;">${q.category}</h4>`;
            currentCategory = q.category;
        }
        
        html += `
            <div class="question-item" id="question-${q.id}">
                <div class="question-header">
                    <div class="question-text">${q.text}</div>
                    <div class="question-number">${q.id}</div>
                </div>
                <div class="question-toggle">
                    <div class="toggle-option" onclick="answerQuestion(${q.id}, 'YES')">
                        ✓ YES
                    </div>
                    <div class="toggle-option" onclick="answerQuestion(${q.id}, 'NO')">
                        ✗ NO
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Answer Question
function answerQuestion(questionId, answer) {
    // Store answer
    questionAnswers[questionId] = answer;
    
    // Update UI
    const questionItem = document.getElementById(`question-${questionId}`);
    const toggles = questionItem.querySelectorAll('.toggle-option');
    
    toggles.forEach(toggle => {
        toggle.classList.remove('selected-yes', 'selected-no');
    });
    
    if (answer === 'YES') {
        toggles[0].classList.add('selected-yes');
    } else {
        toggles[1].classList.add('selected-no');
    }
    
    // Remove error/success classes
    questionItem.classList.remove('error', 'success');
}

// Check Eligibility
function checkEligibility() {
    // Validate personal details
    const fullName = document.getElementById('eligFullName').value;
    const dob = document.getElementById('eligDOB').value;
    const age = parseInt(document.getElementById('eligAge').value);
    const gender = document.getElementById('eligGender').value;
    const weight = parseInt(document.getElementById('eligWeight').value);
    const mobile = document.getElementById('eligMobile').value;
    
    if (!fullName || !dob || !age || !gender || !weight || !mobile) {
        showResult('error', '❌ Incomplete Information', 'Please fill in all required personal details.');
        return;
    }
    
    if (age < 18 || age > 60) {
        showResult('error', '❌ Age Requirement Not Met', 'Donors must be between 18 and 60 years old.');
        return;
    }
    
    if (weight < 45) {
        showResult('error', '❌ Weight Requirement Not Met', 'Donors must weigh at least 45 kg.');
        return;
    }
    
    // Check if all questions are answered
    if (Object.keys(questionAnswers).length < eligibilityQuestions.length) {
        showResult('error', '❌ Incomplete Questionnaire', 'Please answer all health questions.');
        return;
    }
    
    // Validate answers
    let failedQuestions = [];
    
    eligibilityQuestions.forEach(q => {
        const userAnswer = questionAnswers[q.id];
        const questionItem = document.getElementById(`question-${q.id}`);
        
        if (userAnswer === q.correctAnswer) {
            questionItem.classList.add('success');
            questionItem.classList.remove('error');
        } else {
            questionItem.classList.add('error');
            questionItem.classList.remove('success');
            failedQuestions.push(q);
        }
    });
    
    // Show result
    if (failedQuestions.length > 0) {
        const failedList = failedQuestions.map(q => `Question ${q.id}: ${q.text}`).join('<br>');
        showResult(
            'error',
            '❌ Not Eligible',
            `Based on your responses, you cannot donate today.<br><br><strong>Failed Questions:</strong><br>${failedList}<br><br>Please consult with a healthcare professional or try again when eligible.`
        );
        
        // Scroll to first failed question
        const firstFailed = document.getElementById(`question-${failedQuestions[0].id}`);
        firstFailed.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        showResult(
            'success',
            '✅ Ready to Donate!',
            `Congratulations ${fullName}! You have passed the eligibility test.<br><br>You are cleared to proceed with blood donation. Thank you for your willingness to save lives!`
        );
        
        // In a real app, you would save the eligibility data and proceed to donation
        setTimeout(() => {
            closeEligibilityModal();
            alert('You can now proceed to donate blood!');
        }, 3000);
    }
}

// Show Result
function showResult(type, title, message) {
    const alert = document.getElementById('resultAlert');
    const icon = document.getElementById('resultIcon');
    const messageDiv = document.getElementById('resultMessage');
    
    alert.className = `result-alert ${type} show`;
    icon.textContent = type === 'success' ? '✅' : '❌';
    messageDiv.innerHTML = `<strong>${title}</strong><br>${message}`;
    
    // Scroll to top to show result
    document.getElementById('eligibilityContent').scrollTop = 0;
}


// Request Blood Workflow
let currentBloodGroupFilter = '';
let currentSortFilter = 'distance'; // default sort
let searchLocation = null; // Store search location coordinates

// Chennai Area Coordinates Lookup
const chennaiAreas = {
    'anna nagar': { lat: 13.0850, lng: 80.2100, name: 'Anna Nagar' },
    'annanagar': { lat: 13.0850, lng: 80.2100, name: 'Anna Nagar' },
    't nagar': { lat: 13.0418, lng: 80.2341, name: 'T. Nagar' },
    't.nagar': { lat: 13.0418, lng: 80.2341, name: 'T. Nagar' },
    'tnagar': { lat: 13.0418, lng: 80.2341, name: 'T. Nagar' },
    'adyar': { lat: 13.0012, lng: 80.2565, name: 'Adyar' },
    'velachery': { lat: 12.9815, lng: 80.2180, name: 'Velachery' },
    'egmore': { lat: 13.0732, lng: 80.2609, name: 'Egmore' },
    'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai' } // Default
};

// Handle Blood Request Form Submission
function handleBloodRequest(event) {
    event.preventDefault();
    
    const bloodGroup = document.getElementById('requestBloodGroup').value;
    const urgency = document.getElementById('requestUrgency').value;
    const area = document.getElementById('requestArea').value.trim();
    
    if (!bloodGroup || !urgency || !area) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Lookup area coordinates
    const areaKey = area.toLowerCase().replace(/\s+/g, ' ');
    searchLocation = chennaiAreas[areaKey] || chennaiAreas['chennai'];
    
    // Store request data
    currentBloodGroupFilter = bloodGroup;
    
    // Navigate to map view
    showView('map');
    
    // Update the nav button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[3].classList.add('active'); // Map is 4th button
    
    // Initialize map if not already done
    initMap();
    
    // Center map on searched location with zoom level 14
    map.setView([searchLocation.lat, searchLocation.lng], 14);
    
    // Set the blood group filter
    document.getElementById('mapBloodGroupFilter').value = bloodGroup;
    
    // Filter donors by blood group and location
    filterDonorsByBloodGroup();
    
    // Show success message
    setTimeout(() => {
        alert(`Found ${bloodGroup} donors near ${searchLocation.name}`);
    }, 500);
}

// Filter Donors by Blood Group
function filterDonorsByBloodGroup() {
    const selectedBloodGroup = document.getElementById('mapBloodGroupFilter').value;
    currentBloodGroupFilter = selectedBloodGroup;
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Filter donors
    let filteredDonors = [...allDonors];
    
    // Filter by blood group only (no distance restriction)
    if (selectedBloodGroup) {
        filteredDonors = filteredDonors.filter(d => d.bloodGroup === selectedBloodGroup);
    }
    
    // Calculate actual distances from search location if set
    if (searchLocation) {
        filteredDonors = filteredDonors.map(donor => {
            const calculatedDistance = calculateDistance(
                searchLocation.lat,
                searchLocation.lng,
                donor.coordinates.lat,
                donor.coordinates.lng
            );
            return {
                ...donor,
                distance: calculatedDistance.toFixed(1),
                eta: Math.round(calculatedDistance / 40 * 60) // Calculate ETA at 40km/h
            };
        });
    }
    
    // Sort donors based on current filter
    filteredDonors = sortDonors(filteredDonors);
    
    // Add markers for filtered donors
    addFilteredDonors(filteredDonors);
    
    // Update message
    if (filteredDonors.length === 0) {
        const locationText = searchLocation ? ` near ${searchLocation.name}` : ' in this area';
        alert(`No ${selectedBloodGroup || 'available'} donors found${locationText}.`);
    }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

// Sort Donors
function sortDonors(donors) {
    const sorted = [...donors];
    
    switch (currentSortFilter) {
        case 'eta':
            sorted.sort((a, b) => a.eta - b.eta);
            break;
        case 'reliability':
            sorted.sort((a, b) => b.reliability - a.reliability);
            break;
        case 'distance':
        default:
            sorted.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            break;
    }
    
    return sorted;
}

// Add Filtered Donors to Map
function addFilteredDonors(donors) {
    // Create custom red blinking icon
    const redIcon = L.divIcon({
        className: 'blinking-icon',
        html: '<div class="red-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
    
    donors.forEach((donor, index) => {
        const marker = L.marker(
            [donor.coordinates.lat, donor.coordinates.lng],
            { icon: redIcon }
        ).addTo(map);
        
        // Create enhanced popup with real-time metrics
        const reliabilityLevel = getReliabilityLabel(donor.reliability);
        const eligibilityLevel = getEligibilityLabel(donor.eligibility);
        
        marker.bindPopup(`
            <div class="donor-info-card">
                <div class="donor-info-header">
                    <div class="donor-info-name">${donor.name}</div>
                    <div class="donor-info-blood">${donor.bloodGroup}</div>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">📍 Location:</span>
                    <span class="donor-info-value">${donor.location || 'Chennai'}</span>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">🚗 Distance:</span>
                    <span class="donor-info-value">${donor.distance} km</span>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">⏱️ ETA:</span>
                    <span class="donor-info-value">${donor.eta} mins</span>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">✅ Eligibility:</span>
                    <span class="donor-info-value" style="color: ${eligibilityLevel.color};">${eligibilityLevel.label} (${donor.eligibility}%)</span>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">⭐ Reliability:</span>
                    <span class="donor-info-value" style="color: ${reliabilityLevel.color};">${reliabilityLevel.label} (${donor.reliability}%)</span>
                </div>
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 2px solid #fee2e2;">
                    <div style="font-size: 0.75rem; color: #6b7280; text-align: center;">
                        Rank: #${index + 1} ${currentSortFilter === 'eta' ? '(Best ETA)' : currentSortFilter === 'reliability' ? '(Most Reliable)' : '(Closest)'}
                    </div>
                </div>
            </div>
        `);
        
        markers.push(marker);
    });
    
    // If there are donors, fit map to show all markers
    if (donors.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Get Reliability Label
function getReliabilityLabel(score) {
    if (score >= 80) return { label: 'High', color: '#10b981' };
    if (score >= 60) return { label: 'Medium', color: '#f59e0b' };
    return { label: 'Low', color: '#ef4444' };
}

// Get Eligibility Label
function getEligibilityLabel(score) {
    if (score >= 85) return { label: 'Excellent', color: '#10b981' };
    if (score >= 70) return { label: 'Good', color: '#3b82f6' };
    if (score >= 50) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Limited', color: '#ef4444' };
}

// Toggle Filter Dropdown
function toggleFilterDropdown() {
    const dropdown = document.getElementById('filterDropdown');
    const btn = document.getElementById('filterBtn');
    
    dropdown.classList.toggle('show');
    btn.classList.toggle('active');
}

// Set Sort Filter
function setSortFilter(filter) {
    currentSortFilter = filter;
    
    // Update active state
    document.querySelectorAll('.filter-option').forEach(opt => {
        opt.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Close dropdown
    toggleFilterDropdown();
    
    // Re-filter and sort
    filterDonorsByBloodGroup();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('filterDropdown');
    const btn = document.getElementById('filterBtn');
    
    if (dropdown && btn && !dropdown.contains(event.target) && !btn.contains(event.target)) {
        dropdown.classList.remove('show');
        btn.classList.remove('active');
    }
});
