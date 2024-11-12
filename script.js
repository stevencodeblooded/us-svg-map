document.addEventListener('DOMContentLoaded', function() {
    let usStates;
    let geoPath;
    let usData;
    let mainProjection;
    
    // State names mapping
    const stateNames = {
        "US": "United States",
        "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas", "06": "California",
        "08": "Colorado", "09": "Connecticut", "10": "Delaware", "11": "District of Columbia",
        "12": "Florida", "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois",
        "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky", "22": "Louisiana",
        "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan",
        "27": "Minnesota", "28": "Mississippi", "29": "Missouri", "30": "Montana",
        "31": "Nebraska", "32": "Nevada", "33": "New Hampshire", "34": "New Jersey",
        "35": "New Mexico", "36": "New York", "37": "North Carolina", "38": "North Dakota",
        "39": "Ohio", "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania",
        "44": "Rhode Island", "45": "South Carolina", "46": "South Dakota", "47": "Tennessee",
        "48": "Texas", "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
        "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"
    };

    // Get tooltip element
    const tooltip = document.querySelector('.state-hover-label');

    // Add loading indicator
    function showLoading() {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.style.opacity = '0.5';
            mapContainer.insertAdjacentHTML('beforeend', '<div class="loading-indicator">Loading map data...</div>');
        }
    }

    // Remove loading indicator
    function hideLoading() {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.style.opacity = '1';
            const loadingIndicator = mapContainer.querySelector('.loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }

    // Show error message
    function showError(message) {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.style.opacity = '1';
            mapContainer.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }

    function initializeMap() {
        showLoading();

        // Load US map data
        d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
            .then(function(us) {
                try {
                    usData = us;
                    usStates = topojson.feature(us, us.objects.states).features;
                    
                    // Set up the projection
                    mainProjection = d3.geoAlbersUsa()
                        .scale(1000)
                        .translate([487.5, 305]);

                    geoPath = d3.geoPath()
                        .projection(mainProjection);

                    // Draw the map
                    drawMap();
                    
                    // Set initial state
                    initializeState();
                    
                    hideLoading();
                } catch (error) {
                    console.error('Error processing map data:', error);
                    showError('Error processing map data. Please refresh the page.');
                }
            })
            .catch(error => {
                console.error('Error loading map data:', error);
                showError('Error loading map data. Please check your internet connection and refresh the page.');
            });
    }

    function drawMap() {
        const svg = d3.select('#us-map');
        
        try {
            // Clear existing content
            svg.selectAll('*').remove();
            
            // Add state paths
            svg.selectAll('path')
                .data(usStates)
                .enter()
                .append('path')
                .attr('class', 'state')
                .attr('d', geoPath)
                .attr('id', d => `state-${d.id}`)
                .on('click', handleStateClick)
                .on('mousemove', handleStateHover)
                .on('mouseout', handleStateHoverEnd);

            // Populate dropdown
            populateStateDropdown();
        } catch (error) {
            console.error('Error drawing map:', error);
            showError('Error drawing map. Please refresh the page.');
        }
    }

    function populateStateDropdown() {
        try {
            const stateSelect = document.getElementById('stateSelect');
            stateSelect.innerHTML = '<option value="US">United States</option>';
            
            const stateList = usStates
                .map(state => ({
                    id: state.id,
                    name: stateNames[state.id]
                }))
                .filter(state => state.name)
                .sort((a, b) => a.name.localeCompare(b.name));

            stateList.forEach(state => {
                const option = document.createElement('option');
                option.value = state.id;
                option.textContent = state.name;
                stateSelect.appendChild(option);
            });

            // Add change event listener
            stateSelect.addEventListener('change', function(e) {
                updateStateInfo(e.target.value);
            });
        } catch (error) {
            console.error('Error populating dropdown:', error);
            showError('Error setting up state selection. Please refresh the page.');
        }
    }

    function initializeState() {
        try {
            // Set initial selection to United States
            document.getElementById('stateSelect').value = 'US';
            updateStateInfo('US');
        } catch (error) {
            console.error('Error initializing state:', error);
            showError('Error initializing map. Please refresh the page.');
        }
    }

    function handleStateClick(event, d) {
        try {
            if (!stateNames[d.id]) return;
            
            const stateId = d.id;
            document.getElementById('stateSelect').value = stateId;
            updateStateInfo(stateId);
            
            // Update active state
            d3.selectAll('.state').classed('active', false);
            d3.select(`#state-${stateId}`).classed('active', true);
        } catch (error) {
            console.error('Error handling state click:', error);
        }
    }

    function handleStateHover(event, d) {
        try {
            if (!stateNames[d.id]) return;
        
            // Show tooltip
            tooltip.style.display = 'block';
            tooltip.textContent = stateNames[d.id];
        
            // Position tooltip
            const mapContainer = document.querySelector('.map-container').getBoundingClientRect();
            const x = event.clientX - mapContainer.left;
            const y = event.clientY - mapContainer.top - 10; // Offset for pointer
        
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        } catch (error) {
            console.error('Error handling state hover:', error);
        }
    }

    function handleStateHoverEnd() {
        tooltip.style.display = 'none';
    }

    function updateStateInfo(stateId) {
        try {
            const stateInfo = document.getElementById('stateInfo');
            
            if (!stateId || (!stateNames[stateId] && stateId !== 'US')) {
                stateInfo.classList.remove('visible');
                return;
            }
        
            const stateName = stateNames[stateId];
            
            // Update text content
            stateInfo.querySelector('.state-name').textContent = stateName;
            stateInfo.querySelector('.state-name-text').textContent = stateName;
            
            // Show state info
            stateInfo.classList.add('visible');
            
            // Update map highlighting
            d3.selectAll('.state').classed('active', false);
            if (stateId !== 'US') {
                d3.select(`#state-${stateId}`).classed('active', true);
            }
        
            // Update state shape
            updateStateShape(stateId);
        } catch (error) {
            console.error('Error updating state info:', error);
            showError('Error updating state information. Please refresh the page.');
        }
    }

    function updateStateShape(stateId) {
        try {
            const stateShapeSvg = d3.select('#state-shape');
            stateShapeSvg.selectAll('*').remove();
    
            const containerWidth = 182;
            const containerHeight = 107;
            
            stateShapeSvg
                .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
                .attr('preserveAspectRatio', 'xMidYMid meet');
                    
            if (stateId === 'US') {
                // US map handling remains the same
                const usProjection = d3.geoAlbersUsa()
                    .scale(200)
                    .translate([containerWidth / 2, containerHeight / 2]);
                
                const usPath = d3.geoPath().projection(usProjection);
                
                stateShapeSvg
                    .selectAll('path')
                    .data(usStates)
                    .enter()
                    .append('path')
                    .attr('d', usPath)
                    .attr('class', 'us-map');
            } else {
                // Handle individual state
                const selectedState = usStates.find(state => state.id === stateId);
                if (!selectedState || !selectedState.geometry) return;
    
                // Use the main projection to get the state path
                const statePath = geoPath(selectedState);
                const bounds = geoPath.bounds(selectedState);
                const [[x0, y0], [x1, y1]] = bounds;
    
                // Calculate scale and translation
                const stateWidth = x1 - x0;
                const stateHeight = y1 - y0;
                const stateCenterX = (x0 + x1) / 2;
                const stateCenterY = (y0 + y1) / 2;
    
                // Calculate scale with padding
                const padding = 0.1;
                const scale = (1 - padding) * Math.min(
                    containerWidth / stateWidth,
                    containerHeight / stateHeight
                );
    
                // Create a new projection that maintains orientation
                const stateProjection = d3.geoAlbersUsa()
                    .scale(mainProjection.scale() * scale)
                    .translate([
                        containerWidth / 2 - (stateCenterX - mainProjection.translate()[0]) * scale,
                        containerHeight / 2 - (stateCenterY - mainProjection.translate()[1]) * scale
                    ]);
    
                const statePathGenerator = d3.geoPath().projection(stateProjection);
    
                // Draw the state
                stateShapeSvg
                    .append('path')
                    .datum(selectedState)
                    .attr('d', statePathGenerator)
                    .attr('class', 'state-map');
            }
        } catch (error) {
            console.error('Error updating state shape:', error);
        }
    }

    // Event listener cleanup on page unload
    window.addEventListener('unload', function() {
        try {
            // Remove event listeners to prevent memory leaks
            const stateSelect = document.getElementById('stateSelect');
            if (stateSelect) {
                stateSelect.removeEventListener('change', null);
            }
        } catch (error) {
            console.error('Error cleaning up event listeners:', error);
        }
    });

    // Add CSS for loading and error states
    const style = document.createElement('style');
    style.textContent = `
        .loading-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 15px 30px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }

        .error-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff3f3;
            color: #d32f2f;
            padding: 15px 30px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            z-index: 1000;
        }
    `;
    document.head.appendChild(style);

    // Initialize map
    initializeMap();
});