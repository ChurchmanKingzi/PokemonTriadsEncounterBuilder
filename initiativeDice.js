/**
 * Calculates initiative by rolling dice based on INIT value
 * @param {number} initValue - The Pokémon's INIT value
 * @returns {number} - The sum of dice rolls (d6 rolls equal to INIT value)
 */
function calculateDiceInitiative(initValue) {
    // Validiere Input
    if (!initValue || isNaN(initValue) || initValue <= 0) {
        return 0;
    }
    
    // Konvertiere zu Integer, um sicherzustellen, dass wir ganze Würfel würfeln
    const diceCount = Math.floor(initValue);
    let totalInitiative = 0;
    let rolls = [];
    
    // Würfle W6-Würfel in der Anzahl des INIT-Werts und summiere sie
    for (let i = 0; i < diceCount; i++) {
        // Generiere Zufallszahl zwischen 1-6
        const roll = Math.floor(Math.random() * 6) + 1;
        rolls.push(roll);
        totalInitiative += roll;
    }
    
    // Optional: Würfe für Debugging/Anzeige protokollieren
    console.log(`INIT ${diceCount}: Würfle [${rolls.join(', ')}] = ${totalInitiative}`);
    
    return totalInitiative;
}

/**
 * Modified function to add Pokémon to initiative list using dice-based initiative
 * Assumes this replaces or modifies your existing addToInitiativeList function
 */
function addToInitiativeList() {
    // Clear previous initiative list
    const initiativeList = document.getElementById('initiative-list');
    initiativeList.innerHTML = '';
    
    // Get all selected Pokémon slots
    const slots = document.querySelectorAll('.pokemon-slot');
    let initiativeData = [];
    
    // Process each Pokémon slot
    slots.forEach(slot => {
        // Skip empty slots
        const pokemonName = slot.querySelector('.pokemon-name')?.textContent;
        if (!pokemonName || pokemonName === 'Select Pokémon') {
            return;
        }
        
        // Get initiative value from the slot
        const initInput = slot.querySelector('.team-init-input');
        if (!initInput) {
            return;
        }
        
        // Get raw INIT value
        const rawInitValue = parseInt(initInput.value || 0, 10);
        
        // Calculate initiative using dice rolls
        const rolledInitiative = calculateDiceInitiative(rawInitValue);
        
        // Get other Pokémon data
        const pokemonSprite = slot.querySelector('.pokemon-image img')?.src || '';
        
        // Add to initiative data array
        initiativeData.push({
            name: pokemonName,
            initiative: rolledInitiative,
            rawInitiative: rawInitValue, // Store original value for display/reference
            sprite: pokemonSprite
        });
    });
    
    // Sort by initiative (highest first)
    initiativeData.sort((a, b) => b.initiative - a.initiative);
    
    // Create initiative entries
    initiativeData.forEach(pokemon => {
        const entry = document.createElement('div');
        entry.className = 'initiative-entry';
        
        entry.innerHTML = `
            <div class="initiative-content">
                <img class="initiative-sprite" src="${pokemon.sprite}" alt="${pokemon.name}">
                <div class="initiative-details">
                    <div class="initiative-name">${pokemon.name}</div>
                    <div class="initiative-value">
                        <span class="initiative-rolled">${pokemon.initiative}</span>
                        <span class="initiative-raw">(INIT: ${pokemon.rawInitiative})</span>
                    </div>
                </div>
            </div>
        `;
        
        initiativeList.appendChild(entry);
    });
}

/**
 * Add event listeners to the initiative refresh button 
 * and any other relevant elements
 */
function initializeInitiativeSystem() {
    // Find the refresh/load initiative button
    const refreshButton = document.getElementById('refresh-initiative-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', addToInitiativeList);
    }
    
    // Add listener to any "Add to Initiative" buttons if they exist separately
    const addButtons = document.querySelectorAll('.add-to-initiative-button');
    addButtons.forEach(button => {
        button.addEventListener('click', addToInitiativeList);
    });
}

// Add some CSS for the new initiative display
function addInitiativeStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .initiative-entry {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-bottom: 1px solid #eee;
            background-color: #f9f9f9;
            margin-bottom: 4px;
            border-radius: 4px;
        }
        
        .initiative-content {
            display: flex;
            align-items: center;
            width: 100%;
        }
        
        .initiative-details {
            display: flex;
            flex-direction: column;
            margin-left: 8px;
            flex-grow: 1;
        }
        
        .initiative-name {
            font-weight: bold;
            font-size: 14px;
        }
        
        .initiative-value {
            display: flex;
            align-items: center;
        }
        
        .initiative-rolled {
            font-size: 16px;
            font-weight: bold;
            color: #d55e00;
        }
        
        .initiative-raw {
            font-size: 12px;
            color: #666;
            margin-left: 6px;
        }
        
        /* Animation for new rolls */
        @keyframes highlight-roll {
            0% { background-color: #ffe6cc; }
            100% { background-color: #f9f9f9; }
        }
        
        .initiative-entry-new {
            animation: highlight-roll 1.5s ease-out;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Call this function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeInitiativeSystem();
    addInitiativeStyles();
});