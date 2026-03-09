# Frontend Hospital Discovery Implementation Guide

## UI Components to Add

### 1. Toggle Switch (Donors/Hospitals)
```html
<div class="view-toggle">
  <button class="toggle-btn active" data-view="donors">
    👥 Donors
  </button>
  <button class="toggle-btn" data-view="hospitals">
    🏥 Hospitals
  </button>
</div>
```

### 2. Hospital Map View
- Separate map instance or reuse existing with different markers
- Blue hospital markers (⚕️) vs red/green donor markers
- Cluster markers when zoomed out

### 3. Hospital Detail Modal
```html
<div id="hospital-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="hospital-name"></h3>
      <button class="close-btn">&times;</button>
    </div>
    <div class="modal-body">
      <div class="hospital-info">
        <p class="address"></p>
        <p class="distance"></p>
        <p class="rating"></p>
      </div>
      <div class="blood-inventory">
        <h4>Blood Availability</h4>
        <div class="blood-grid">
          <!-- 8 blood type cards -->
        </div>
        <p class="last-updated"></p>
      </div>
      <div class="hospital-actions">
        <button class="contact-btn">📞 Contact Now</button>
        <button class="navigate-btn">🗺️ Navigate</button>
      </div>
    </div>
  </div>
</div>
```

### 4. Blood Inventory Grid
```
┌─────┬─────┬─────┬─────┐
│ A+  │ B+  │ AB+ │ O+  │
│ 15  │ 8   │ 5   │ 22  │
└─────┴─────┴─────┴─────┘
┌─────┬─────┬─────┬─────┐
│ A-  │ B-  │ AB- │ O-  │
│ 3   │ 0   │ 2   │ 7   │
└─────┴─────┴─────┴─────┘
```

## JavaScript Functions to Add

### 1. Toggle View
```javascript
function switchView(view) {
  if (view === 'donors') {
    showDonorMap();
  } else {
    showHospitalMap();
  }
}
```

### 2. Load Hospitals
```javascript
async function loadNearbyHospitals(lat, lng, radius = 20, bloodGroup = null) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    radius: radius
  });
  
  if (bloodGroup) {
    params.append('bloodGroup', bloodGroup);
  }
  
  const response = await fetch(`/api/hospitals/nearby?${params}`);
  const data = await response.json();
  return data.hospitals;
}
```

### 3. Display Hospital Markers
```javascript
function displayHospitalMarkers(hospitals) {
  clearMarkers();
  
  hospitals.forEach(hospital => {
    const marker = L.marker([hospital.coordinates.lat, hospital.coordinates.lng], {
      icon: hospitalIcon
    });
    
    marker.bindPopup(`
      <strong>${hospital.name}</strong><br>
      ${hospital.distance} km away<br>
      ⭐ ${hospital.serviceRating}/5
    `);
    
    marker.on('click', () => showHospitalDetails(hospital.id));
    marker.addTo(map);
    markers.push(marker);
  });
}
```

### 4. Show Hospital Details
```javascript
async function showHospitalDetails(hospitalId) {
  const hospital = await fetch(`/api/hospitals/${hospitalId}?latitude=${userLocation.lat}&longitude=${userLocation.lng}`)
    .then(r => r.json());
  
  // Populate modal
  document.getElementById('hospital-name').textContent = hospital.name;
  // ... populate other fields
  
  // Show blood inventory
  displayBloodInventory(hospital.bloodAvailability);
  
  // Show modal
  document.getElementById('hospital-modal').classList.add('show');
}
```

### 5. Display Blood Inventory
```javascript
function displayBloodInventory(availability) {
  const bloodTypes = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'];
  const grid = document.querySelector('.blood-grid');
  grid.innerHTML = '';
  
  bloodTypes.forEach(type => {
    const data = availability[type];
    const units = data ? data.units : 0;
    const isAvailable = units > 0;
    
    const card = document.createElement('div');
    card.className = `blood-card ${isAvailable ? 'available' : 'unavailable'}`;
    card.innerHTML = `
      <div class="blood-type">${type}</div>
      <div class="blood-units">${units}</div>
      <div class="blood-label">units</div>
    `;
    grid.appendChild(card);
  });
}
```

### 6. Contact Hospital
```javascript
function contactHospital(phone) {
  if (phone) {
    window.location.href = `tel:${phone}`;
  } else {
    showToast('Contact number not available');
  }
}
```

### 7. Navigate to Hospital
```javascript
function navigateToHospital(lat, lng) {
  // Open in Google Maps
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
}
```

## CSS Styles to Add

### Toggle Switch
```css
.view-toggle {
  display: flex;
  background: var(--card-bg);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 1rem;
}

.toggle-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.toggle-btn.active {
  background: var(--accent-primary);
  color: white;
}
```

### Hospital Marker Icon
```css
.hospital-marker {
  background: #2563eb;
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
```

### Blood Inventory Grid
```css
.blood-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin: 1rem 0;
}

.blood-card {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
}

.blood-card.available {
  border-color: #10b981;
  background: #ecfdf5;
}

.blood-card.unavailable {
  border-color: #ef4444;
  background: #fef2f2;
  opacity: 0.6;
}

.blood-type {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 0.5rem;
}

.blood-units {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.blood-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}
```

### Hospital Modal
```css
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}

.modal.show {
  display: flex;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  padding: 1.5rem;
}

.hospital-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.hospital-actions button {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.contact-btn {
  background: var(--accent-primary);
  color: white;
}

.navigate-btn {
  background: #2563eb;
  color: white;
}
```

## Implementation Steps

1. **Update HTML** - Add toggle switch and hospital modal
2. **Add CSS** - Style new components
3. **Add JavaScript** - Implement hospital map logic
4. **Test** - Verify toggle, markers, and modal work
5. **Polish** - Add loading states and error handling

## Testing Checklist

- [ ] Toggle switches between donor and hospital views
- [ ] Hospital markers appear on map
- [ ] Clicking marker shows hospital details
- [ ] Blood inventory displays correctly
- [ ] Contact button initiates phone call
- [ ] Navigate button opens Google Maps
- [ ] Modal closes properly
- [ ] Responsive on mobile devices
- [ ] Works in both light and dark themes
- [ ] Loading states show during API calls
- [ ] Error messages display when API fails
