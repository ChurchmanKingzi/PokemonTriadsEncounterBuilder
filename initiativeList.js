// Warte, bis das DOM geladen ist und reagiere auf das Event, wenn die PokemonTeamBuilder-App initialisiert wurde
document.addEventListener('DOMContentLoaded', () => {
    // Sobald die PokemonTeamBuilder-App initialisiert wurde, starten wir unseren Code
    // Mit einem kleinen Delay, um sicherzustellen, dass alles vollständig geladen ist
    setTimeout(() => {
        const app = window.pokemonApp;
        if (app) {
            initializeInitiativeList(app);
        } else {
            console.error('PokemonTeamBuilder app not found!');
        }
    }, 500);
});

// Globaler HP-Zustand für alle Pokemon
window.pokemonHPState = window.pokemonHPState || {};

/**
 * Initialisiert die Initiative-Liste für die gegebene PokemonTeamBuilder-App
 * @param {PokemonTeamBuilder} app - Die PokemonTeamBuilder-App-Instanz
 */
function initializeInitiativeList(app) {
    // Container für die Hauptanwendung verkleinern, um Platz zu schaffen
    const builderContainer = document.querySelector('.pokemon-builder-container');
    builderContainer.style.height = '65vh';
    
    // Initiative-Container erstellen und einfügen
    const initiativeContainer = createElement('div', { 
        class: 'initiative-container',
        id: 'initiative-container'
    });
    
    // Titel für die Initiative-Liste
    const initiativeTitle = createElement('h3');
    initiativeTitle.textContent = 'Initiative-Reihenfolge';
    initiativeTitle.style.color = '#3b5ca8';
    initiativeTitle.style.borderBottom = '2px solid #3b5ca8';
    initiativeTitle.style.paddingBottom = '5px';
    initiativeTitle.style.marginBottom = '10px';
    
    // Text-Area für die Initiative-Liste
    const initiativeList = createElement('div', { 
        class: 'initiative-list',
        id: 'initiative-list'
    });
    
    // Füge Elemente zum Container hinzu
    initiativeContainer.appendChild(initiativeTitle);
    initiativeContainer.appendChild(initiativeList);
    
    // Initiative-Container nach dem Builder-Container einfügen
    builderContainer.parentNode.insertBefore(initiativeContainer, builderContainer.nextSibling);
    
    // Styles für die Initiative-Liste hinzufügen
    addInitiativeStyles();
    
    // Setze einen Beobachter ein, der die Liste aktualisiert, wenn sich etwas ändert
    setupInitiativeObserver(app);
    
    // Initialisiere die Liste
    updateInitiativeList(app);
}

/**
 * Fügt CSS-Stile für die Initiative-Liste hinzu
 */
function addInitiativeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        body {
            display: flex; /* Behalte das Flex-Layout bei */
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        .pokemon-builder-container {
            width: 65%;
            height: 65vh;
            overflow-y: auto;
            margin-bottom: 0;
            padding-bottom: 10px;
            box-sizing: border-box;
        }
        
        .sidebar-space {
            width: 35%;
            height: 100vh;
            overflow-y: auto;
            box-sizing: border-box;
            position: fixed;
            right: 0;
            top: 0;
        }
        
        .initiative-container {
            width: 65%;
            padding: 12px;
            box-sizing: border-box;
            border: 2px solid #3b5ca8;
            border-radius: 8px;
            margin-top: 0;
            margin-bottom: 10px;
            background-color: #f9f9f9;
            height: 28vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: absolute;
            left: 0;
            bottom: 10px;
        }
        
        .initiative-list {
            overflow-y: auto;
            flex-grow: 1;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: white;
            padding: 5px;
        }
        
        .initiative-entry {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-bottom: 1px solid #eee;
            gap: 10px;
        }
        
        .initiative-entry:last-child {
            border-bottom: none;
        }
        
        /* Linker Bereich: Sprite und Name */
        .initiative-left-section {
            display: flex;
            align-items: center;
            width: 30%;
            min-width: 120px;
        }
        
        /* Mittlerer Bereich: HP-Bar und Schadenseingabe */
        .initiative-middle-section {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            gap: 5px;
        }
        
        /* Rechter Bereich: Initiative-Wert */
        .initiative-right-section {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            min-width: 70px;
        }
        
        .initiative-sprite {
            width: 40px;
            height: 40px;
            margin-right: 10px;
        }
        
        .initiative-name {
            flex-grow: 1;
            font-weight: bold;
        }
        
        .initiative-value {
            font-weight: bold;
            background-color: #3b5ca8;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            min-width: 35px;
            text-align: center;
        }
        
        /* Initiative-Wert mit Würfel-Anzeige */
        .initiative-value {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Styling für die Basis-Initiative (Würfelanzahl) */
        .initiative-base {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.8);
            margin-left: 3px;
        }
        
        /* Hover-Effekt für Tooltip */
        .initiative-value[title]:hover {
            background-color: #2a4a8a;
            cursor: help;
        }
        
        /* Nicht-Spieler-Pokemon haben eine andere Farbe */
        .initiative-entry:not(.player-pokemon) .initiative-value {
            background-color: #d55e00;
        }
        
        .initiative-entry:not(.player-pokemon) .initiative-value:hover {
            background-color: #c04d00;
        }
        
        .initiative-entry.player-pokemon {
            background-color: #e6f0ff;
        }
        
        .initiative-entry:hover {
            background-color: #f5f5f5;
        }
        
        .initiative-entry.player-pokemon:hover {
            background-color: #d6e5ff;
        }
        
        /* HP-Container Styles */
        .hp-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            transition: background-color 0.3s;
        }
        
        /* HP-Bar Animation bei Veränderung */
        .hp-change {
            animation: hp-pulse 0.5s ease-in-out;
        }
        
        @keyframes hp-pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
        }
        
        /* HP-Bar Styles */
        .hp-bar {
            height: 10px;
            background-color: #e0e0e0;
            border-radius: 5px;
            overflow: hidden;
            margin-bottom: 2px;
        }
        
        .hp-fill {
            height: 100%;
            background-color: #4caf50;
            border-radius: 5px;
            transition: width 0.3s, background-color 0.3s;
        }
        
        /* HP-Text Styles */
        .hp-text {
            font-size: 11px;
            text-align: center;
            color: #555;
        }
        
        /* Schaden-Container Styles */
        .damage-container {
            display: flex;
            gap: 5px;
            align-items: center;
        }
        
        /* Schaden-Eingabefeld Styles */
        .damage-input {
            width: 60px;
            height: 24px;
            border: 1px solid #ccc;
            border-radius: 3px;
            padding: 2px 5px;
            font-size: 12px;
        }
        
        /* Schaden-Button Styles */
        .damage-button {
            height: 24px;
            padding: 0 8px;
            font-size: 12px;
            border: none;
            border-radius: 3px;
            background-color: #f44336;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .damage-button:hover {
            background-color: #d32f2f;
        }
        
        .damage-button:active {
            background-color: #b71c1c;
        }
        
        /* Spieler-Pokemon haben keinen mittleren Bereich */
        .initiative-entry.player-pokemon .initiative-middle-section {
            display: none;
        }
        
        .initiative-entry.player-pokemon .initiative-left-section {
            width: 70%;
            flex-grow: 1;
        }
        
        /* Responsive Anpassungen */
        @media (max-width: 768px) {
            .initiative-entry {
                flex-wrap: wrap;
            }
            
            .initiative-left-section {
                width: 60%;
            }
            
            .initiative-right-section {
                width: 40%;
                justify-content: flex-end;
            }
            
            .initiative-middle-section {
                width: 100%;
                order: 3;
                margin-top: 5px;
            }
        }
        
        /* Komprimiere die Pokemon-Slots leicht */
        .pokemon-slot {
            padding: 8px;
            margin-bottom: 5px;
            box-sizing: border-box;
        }
        
        .pokemon-image-container {
            margin: 5px 0;
        }
        
        .pokemon-image {
            width: 100px;
            height: 100px;
        }
        
        .pokemon-stats-container, .pokemon-moves-container, .exp-gain-container {
            margin-top: 8px;
            padding-top: 8px;
        }
        
        /* Stile für kleinere Slots */
        .team-container {
            gap: 10px;
            padding: 10px;
        }
        
        /* Vertikal anordnen statt horizontal scrollen */
        @media (max-height: 900px) {
            .pokemon-slot {
                padding: 5px;
                margin-bottom: 5px;
            }
            
            .pokemon-image {
                width: 80px;
                height: 80px;
            }
            
            .stat-entry {
                margin-bottom: 1px;
                font-size: 12px;
            }
            
            .pokemon-stats-container, .pokemon-moves-container, .exp-gain-container {
                margin-top: 5px;
                padding-top: 5px;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Richtet einen Beobachter ein, der die Initiative-Liste aktualisiert,
 * wenn sich relevante Elemente ändern
 * @param {PokemonTeamBuilder} app - Die PokemonTeamBuilder-App-Instanz
 */
function setupInitiativeObserver(app) {
    // Beobachte die Hauptpokémon-Slots
    const teamObserver = new MutationObserver(() => {
        updateInitiativeList(app);
    });
    
    teamObserver.observe(app.teamContainer, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['data-value', 'value'] 
    });
    
    // Beobachte Änderungen an den Spieler-Pokémon
    if (app.teamBuilder) {
        const teamSlotsContainer = document.querySelector('.team-grid-container');
        if (teamSlotsContainer) {
            teamObserver.observe(teamSlotsContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-value', 'value']
            });
        }
    }
    
    // Event-Listener für INIT- und Level-Änderungen
    document.addEventListener('change', (event) => {
        const target = event.target;
        if (target.id && 
            (target.id.startsWith('speed-') || 
             target.id.startsWith('team-init-') ||
             target.id.startsWith('pokemon-level-') ||
             target.id.startsWith('team-level-'))) {
            updateInitiativeList(app);
        }
    });
}

/**
 * Aktualisiert die Initiative-Liste
 * @param {PokemonTeamBuilder} app - Die PokemonTeamBuilder-App-Instanz
 */
function updateInitiativeList(app) {
    const initiativeList = document.getElementById('initiative-list');
    if (!initiativeList) return;
    
    // Leere die Liste
    initiativeList.innerHTML = '';
    
    // Sammle alle aktiven Pokémon (Slots + Team)
    const allPokemon = getAllActivePokemon(app);
    
    // Wenn keine Pokémon vorhanden sind, zeige Hinweis
    if (allPokemon.length === 0) {
        const emptyMessage = createElement('div', { class: 'initiative-empty' });
        emptyMessage.textContent = 'Keine aktiven Pokémon vorhanden';
        initiativeList.appendChild(emptyMessage);
        return;
    }
    
    // Verarbeite die Berechnung der Würfel-Initiative für Nicht-Spieler-Pokemon
    allPokemon.forEach(pokemon => {
        if (!pokemon.isPlayerPokemon) {
            // Erstelle einen einzigartigen Schlüssel für dieses Pokemon in diesem Slot
            const pokemonKey = `${pokemon.id}_${pokemon.slotIndex}`;
            
            // Prüfe, ob bereits ein HP-Zustand für dieses Pokemon existiert
            if (!window.pokemonHPState[pokemonKey]) {
                // Falls nicht, initialisiere mit vollen HP
                window.pokemonHPState[pokemonKey] = {
                    currentHP: pokemon.hp,
                    maxHP: pokemon.hp
                };
            } else {
                // Falls der maximale HP-Wert sich geändert hat (z.B. durch Stats-Randomisierung),
                // passe den aktuellen HP-Wert proportional an
                const storedState = window.pokemonHPState[pokemonKey];
                if (storedState.maxHP !== pokemon.hp) {
                    // Berechne die Proportion der aktuellen HP
                    const hpRatio = storedState.currentHP / storedState.maxHP;
                    // Aktualisiere max HP
                    storedState.maxHP = pokemon.hp;
                    // Aktualisiere aktuelle HP proportional, mindestens 1
                    storedState.currentHP = Math.max(1, Math.floor(hpRatio * pokemon.hp));
                }
            }
            
            // Füge die HP-Werte dem Pokemon-Objekt hinzu
            pokemon.currentHP = window.pokemonHPState[pokemonKey].currentHP;
            pokemon.maxHP = window.pokemonHPState[pokemonKey].maxHP;
            
            // Berechne die gewürfelte Initiative
            pokemon.displayedInit = rollInitiativeDice(pokemon.init);
            pokemon.initDescription = `${pokemon.init}W6 = ${pokemon.displayedInit}`;
        } else {
            // Für Spieler-Pokemon verwenden wir den normalen INIT-Wert
            pokemon.displayedInit = pokemon.init;
            pokemon.initDescription = pokemon.init.toString();
        }
    });
    
    // Sortiere nach Initiative-Wert (absteigend) und breche Gleichstände zufällig auf
    allPokemon.sort((a, b) => {
        if (a.displayedInit === b.displayedInit) {
            // Bei Gleichstand: zufällige Entscheidung
            return Math.random() - 0.5;
        }
        return b.displayedInit - a.displayedInit; // Absteigend (höhere Werte zuerst)
    });
    
    // Füge Einträge zur Liste hinzu
    allPokemon.forEach((pokemon, index) => {
        const entry = createInitiativeEntry(pokemon, index);
        initiativeList.appendChild(entry);
    });
}

/**
 * Interne Funktion zum Würfeln der Initiative-Werte
 * @param {number} initValue - Der INIT-Wert des Pokémon
 * @returns {number} - Die gewürfelte Initiative
 */
function rollInitiativeDice(initValue) {
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
 * Erstellt einen Eintrag für die Initiative-Liste mit HP-Bar und Schadenseingabe
 * @param {Object} pokemon - Das Pokémon
 * @param {number} index - Index in der sortierten Liste
 * @returns {HTMLElement} - Der erstellte Listeneintrag
 */
function createInitiativeEntry(pokemon, index) {
    const entry = createElement('div', { 
        class: `initiative-entry ${pokemon.isPlayerPokemon ? 'player-pokemon' : ''}`,
        'data-init': pokemon.displayedInit,
        'data-pokemon-key': pokemon.isPlayerPokemon ? '' : `${pokemon.id}_${pokemon.slotIndex}`
    });
    
    // Linker Bereich: Sprite und Name
    const leftSection = createElement('div', { class: 'initiative-left-section' });
    
    // Sprite
    const sprite = createElement('img', {
        class: 'initiative-sprite',
        src: pokemon.sprite,
        alt: pokemon.name
    });
    
    // Name
    const name = createElement('div', { class: 'initiative-name' });
    name.textContent = `${index + 1}. ${pokemon.name}`;
    
    leftSection.appendChild(sprite);
    leftSection.appendChild(name);
    
    // Mittlerer Bereich: HP-Bar (nur für Nicht-Spieler-Pokemon)
    const middleSection = createElement('div', { class: 'initiative-middle-section' });
    
    if (!pokemon.isPlayerPokemon) {
        const pokemonKey = `${pokemon.id}_${pokemon.slotIndex}`;
        
        // HP-Container
        const hpContainer = createElement('div', { 
            class: 'hp-container',
            'data-pokemon-key': pokemonKey
        });
        
        // HP-Bar
        const hpBar = createElement('div', { class: 'hp-bar' });
        
        // Berechne den HP-Prozentsatz
        const hpPercentage = (pokemon.currentHP / pokemon.maxHP) * 100;
        
        // HP-Fill (der gefüllte Teil der HP-Bar)
        const hpFill = createElement('div', { 
            class: 'hp-fill',
            style: `width: ${hpPercentage}%; background-color: ${getHPBarColor(hpPercentage)};`
        });
        
        // HP-Text (aktuelle/maximale KP)
        const hpText = createElement('div', { 
            class: 'hp-text',
            id: `hp-text-${pokemonKey}`
        });
        hpText.textContent = `${pokemon.currentHP}/${pokemon.maxHP}`;
        
        // Baue die HP-Bar zusammen
        hpBar.appendChild(hpFill);
        hpContainer.appendChild(hpBar);
        hpContainer.appendChild(hpText);
        
        // Schaden-Eingabefeld und Heilungs-Eingabefeld Container
        const actionContainer = createElement('div', { class: 'action-container' });
        
        // 1. SCHADEN-BEREICH
        const damageContainer = createElement('div', { class: 'damage-container' });
        
        const damageInput = createElement('input', {
            type: 'number',
            class: 'damage-input',
            id: `damage-input-${pokemonKey}`,
            value: '0',
            min: '0',
            placeholder: 'Schaden'
        });
        
        const damageButton = createElement('button', {
            class: 'damage-button',
            id: `damage-button-${pokemonKey}`
        });
        damageButton.textContent = 'Schaden';
        
        // Event-Listener für Schaden-Eingabe
        damageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                applyDamage(pokemonKey);
                event.preventDefault();
            }
        });
        
        damageButton.addEventListener('click', () => {
            applyDamage(pokemonKey);
        });
        
        // Füge alles zum Damage-Container hinzu
        damageContainer.appendChild(damageInput);
        damageContainer.appendChild(damageButton);
        
        // 2. HEILUNGS-BEREICH
        const healContainer = createElement('div', { class: 'heal-container' });
        
        const healInput = createElement('input', {
            type: 'number',
            class: 'heal-input',
            id: `heal-input-${pokemonKey}`,
            value: '0',
            min: '0',
            placeholder: 'Heilung'
        });
        
        const healButton = createElement('button', {
            class: 'heal-button',
            id: `heal-button-${pokemonKey}`
        });
        healButton.textContent = 'Heilung';
        
        // Event-Listener für Heilungs-Eingabe
        healInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                applyHealing(pokemonKey);
                event.preventDefault();
            }
        });
        
        healButton.addEventListener('click', () => {
            applyHealing(pokemonKey);
        });
        
        // Füge alles zum Heal-Container hinzu
        healContainer.appendChild(healInput);
        healContainer.appendChild(healButton);
        
        // Füge beide Container zum Action-Container hinzu
        actionContainer.appendChild(damageContainer);
        actionContainer.appendChild(healContainer);
        
        // Füge HP-Container und Action-Container zum mittleren Bereich hinzu
        middleSection.appendChild(hpContainer);
        middleSection.appendChild(actionContainer);
    }
    
    // Rechter Bereich: Initiative-Wert
    const rightSection = createElement('div', { class: 'initiative-right-section' });
    
    // INIT-Wert
    const initValue = createElement('div', { class: 'initiative-value' });
    
    if (!pokemon.isPlayerPokemon) {
        // Für Nicht-Spieler-Pokemon: Zeige gewürfelten Wert und Tooltip
        initValue.textContent = pokemon.displayedInit;
        initValue.setAttribute('title', pokemon.initDescription);
        
        // Füge eine kleine Anzeige für den INIT-Basiswert hinzu
        const initBase = createElement('span', { class: 'initiative-base' });
        initBase.textContent = ` (${pokemon.init}W6)`;
        initValue.appendChild(initBase);
    } else {
        // Für Spieler-Pokemon: Zeige nur den INIT-Wert
        initValue.textContent = pokemon.init;
    }
    
    rightSection.appendChild(initValue);
    
    // Füge alle Bereiche zum Eintrag hinzu
    entry.appendChild(leftSection);
    entry.appendChild(middleSection);
    entry.appendChild(rightSection);
    
    return entry;
}

/**
 * Wendet Schaden auf ein Pokemon an und aktualisiert die HP-Bar
 * @param {string} pokemonId - ID des Pokemons
 */
function applyDamage(pokemonKey) {
    // Hole das Schadenseingabefeld
    const damageInput = document.getElementById(`damage-input-${pokemonKey}`);
    if (!damageInput) return;
    
    // Hole den Schadenswert
    const damageValue = parseInt(damageInput.value) || 0;
    if (damageValue <= 0) {
        damageInput.value = '0';
        return;
    }
    
    // Prüfe ob der HP-Zustand für dieses Pokemon existiert
    if (!window.pokemonHPState[pokemonKey]) return;
    
    // Hole aktuelle und maximale KP aus dem gespeicherten Zustand
    let currentHP = window.pokemonHPState[pokemonKey].currentHP;
    const maxHP = window.pokemonHPState[pokemonKey].maxHP;
    
    // Berechne neue KP
    const newHP = Math.max(0, currentHP - damageValue);
    
    // Aktualisiere den HP-Zustand
    window.pokemonHPState[pokemonKey].currentHP = newHP;
    
    // UI-Aktualisierung der HP-Bar
    updateHPBar(pokemonKey, newHP, maxHP);
    
    // Setze das Schadenseingabefeld zurück
    damageInput.value = '0';
}

/**
 * Wendet Heilung auf ein Pokemon an und aktualisiert die HP-Bar
 * @param {string} pokemonKey - Einzigartiger Schlüssel des Pokemons (id_slotIndex)
 */
function applyHealing(pokemonKey) {
    // Hole das Heilungseingabefeld
    const healInput = document.getElementById(`heal-input-${pokemonKey}`);
    if (!healInput) return;
    
    // Hole den Heilungswert
    const healValue = parseInt(healInput.value) || 0;
    if (healValue <= 0) {
        healInput.value = '0';
        return;
    }
    
    // Prüfe ob der HP-Zustand für dieses Pokemon existiert
    if (!window.pokemonHPState[pokemonKey]) return;
    
    // Hole aktuelle und maximale KP aus dem gespeicherten Zustand
    let currentHP = window.pokemonHPState[pokemonKey].currentHP;
    const maxHP = window.pokemonHPState[pokemonKey].maxHP;
    
    // Berechne neue KP (nie mehr als maxHP)
    const newHP = Math.min(maxHP, currentHP + healValue);
    
    // Aktualisiere den HP-Zustand
    window.pokemonHPState[pokemonKey].currentHP = newHP;
    
    // UI-Aktualisierung der HP-Bar
    updateHPBar(pokemonKey, newHP, maxHP);
    
    // Setze das Heilungseingabefeld zurück
    healInput.value = '0';
}

/**
 * Aktualisiert die HP-Bar in der UI
 * @param {string} pokemonKey - Einzigartiger Schlüssel des Pokemons
 * @param {number} currentHP - Aktuelle HP
 * @param {number} maxHP - Maximale HP
 */
function updateHPBar(pokemonKey, currentHP, maxHP) {
    // Finde den entsprechenden Eintrag in der Initiative-Liste
    const initiativeEntry = document.querySelector(`.initiative-entry[data-pokemon-key="${pokemonKey}"]`);
    if (!initiativeEntry) return;
    
    // Hole den HP-Container
    const hpContainer = initiativeEntry.querySelector('.hp-container');
    if (!hpContainer) return;
    
    // Berechne den Prozentsatz für die HP-Bar
    const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;
    
    // Aktualisiere die HP-Bar
    const hpFill = hpContainer.querySelector('.hp-fill');
    if (hpFill) {
        hpFill.style.width = `${hpPercentage}%`;
        hpFill.style.backgroundColor = getHPBarColor(hpPercentage);
    }
    
    // Aktualisiere den HP-Text
    const hpText = hpContainer.querySelector('.hp-text');
    if (hpText) {
        hpText.textContent = `${currentHP}/${maxHP}`;
    }
    
    // Animation für die HP-Änderung hinzufügen
    if (hpContainer.classList.contains('hp-change')) {
        hpContainer.classList.remove('hp-change');
        void hpContainer.offsetWidth; // Trick, um die Animation zu "resetten"
    }
    hpContainer.classList.add('hp-change');
}

/**
 * Bestimmt die Farbe der HP-Bar basierend auf dem HP-Prozentsatz
 * @param {number} percentage - HP-Prozentsatz (0-100)
 * @returns {string} - Farbe als CSS-Wert
 */
function getHPBarColor(percentage) {
    if (percentage > 50) {
        return '#4caf50'; // Grün
    } else if (percentage > 20) {
        return '#f9a825'; // Gelb
    } else {
        return '#f44336'; // Rot
    }
}

/**
 * Sammelt alle aktiven Pokémon aus Slots und Team
 * @param {PokemonTeamBuilder} app - Die PokemonTeamBuilder-App-Instanz
 * @returns {Array} - Liste aller aktiven Pokémon mit relevanten Daten
 */
function getAllActivePokemon(app) {
    const allPokemon = [];
    
    // Sammle Pokémon aus den Hauptslots
    for (let i = 0; i < app.currentSlotCount; i++) {
        const pokemonSelect = document.getElementById(`pokemon-select-${i}`);
        if (!pokemonSelect) continue;
        
        const pokemonId = pokemonSelect.getAttribute('data-value');
        if (!pokemonId) continue; // Überspringe leere Slots
        
        const pokemon = app.pokemonService.getPokemonById(Number(pokemonId));
        if (!pokemon) continue;
        
        const initElement = document.getElementById(`speed-${i}`);
        const init = initElement ? parseInt(initElement.value) : 0;
        
        // Hole HP-Wert aus den Statuswerten
        const hpElement = document.getElementById(`hp-${i}`);
        const hp = hpElement ? parseInt(hpElement.value) : 0;
        
        allPokemon.push({
            id: pokemon.id,
            name: pokemon.germanName || pokemon.name,
            sprite: pokemon.sprites.front_default,
            init: init,
            hp: hp,
            slotIndex: i,   // Speichere den Slot-Index für die Erstellung des einzigartigen Schlüssels
            isPlayerPokemon: false
        });
    }
    
    // Sammle Pokémon aus dem Team (Spieler)
    if (app.teamBuilder) {
        for (let i = 0; i < app.teamBuilder.TEAM_SIZE; i++) {
            const teamPokemonSelect = document.getElementById(`team-pokemon-select-${i}`);
            if (!teamPokemonSelect) continue;
            
            const pokemonId = teamPokemonSelect.getAttribute('data-value');
            if (!pokemonId) continue; // Überspringe leere Slots
            
            const pokemon = app.pokemonService.getPokemonById(Number(pokemonId));
            if (!pokemon) continue;
            
            const initElement = document.getElementById(`team-init-${i}`);
            const init = initElement ? parseInt(initElement.value) : 0;
            
            allPokemon.push({
                id: pokemon.id,
                name: pokemon.germanName || pokemon.name,
                sprite: pokemon.sprites.front_default,
                init: init,
                slotIndex: i,
                isPlayerPokemon: true
            });
        }
    }
    
    return allPokemon;
}
