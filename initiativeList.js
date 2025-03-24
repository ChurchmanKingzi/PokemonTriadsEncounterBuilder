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

    enableDamageAnimationOverflow();
}

/**
 * Fügt CSS-Stile für die Initiative-Liste hinzu
 */
function addInitiativeStyles() {
    // Hauptstil und Defeat/Revive-Stile in einem einzigen Style-Element zusammenführen
    const style = document.createElement('style');
    
    // Definiere die Farbskala für Initiative-Werte (unverändert)
    const initColorScale = `
        /* Farbskala von Rot bis Dunkelgrün basierend auf Initiative-Wert */
        .init-color-0 { background-color: #8b0000; } /* Dunkelrot */
        .init-color-1 { background-color: #a30000; }
        .init-color-2 { background-color: #b71c1c; }
        .init-color-3 { background-color: #c62828; }
        .init-color-4 { background-color: #d32f2f; } /* Rot */
        .init-color-5 { background-color: #e53935; }
        .init-color-6 { background-color: #f44336; }
        .init-color-7 { background-color: #ef5350; }
        .init-color-8 { background-color: #e57373; }
        .init-color-9 { background-color: #ef6c00; } /* Orange */
        .init-color-10 { background-color: #f57c00; }
        .init-color-11 { background-color: #fb8c00; }
        .init-color-12 { background-color: #ff9800; }
        .init-color-13 { background-color: #ffa726; }
        .init-color-14 { background-color: #ffb74d; } /* Hellorange */
        .init-color-15 { background-color: #fbc02d; } /* Gelb */
        .init-color-16 { background-color: #fdd835; }
        .init-color-17 { background-color: #ffeb3b; }
        .init-color-18 { background-color: #fff176; }
        .init-color-19 { background-color: #dce775; } /* Gelbgrün */
        .init-color-20 { background-color: #c0ca33; }
        .init-color-21 { background-color: #afb42b; }
        .init-color-22 { background-color: #9e9d24; }
        .init-color-23 { background-color: #827717; }
        .init-color-24 { background-color: #558b2f; } /* Grün */
        .init-color-25 { background-color: #43a047; }
        .init-color-26 { background-color: #388e3c; }
        .init-color-27 { background-color: #2e7d32; }
        .init-color-28 { background-color: #1b5e20; }
        .init-color-29 { background-color: #1b5e20; } /* Dunkelgrün (Maximum) */
    `;
    
    // Definiere die Animations-Styles für Schaden und Heilung (unverändert)
    const animationStyles = `
        /* Schadensanzeige-Container */
        .damage-animation-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        }
        
        /* Schadens-Feedback Animation */
        @keyframes damage-float {
            0% { 
                opacity: 1; 
                transform: translateY(0) scale(1);
            }
            100% { 
                opacity: 0; 
                transform: translateY(-50px) scale(1.5);
            }
        }
        
        .damage-indicator {
            position: fixed;
            color: #ff3333;
            font-weight: bold;
            font-size: 20px;
            text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.7);
            z-index: 9999;
            animation: damage-float 2s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
            pointer-events: none;
            will-change: transform, opacity;
        }
        
        .healing-indicator {
            position: fixed;
            color: #2ecc71;
            font-weight: bold;
            font-size: 20px;
            text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.7);
            z-index: 9999;
            animation: damage-float 2s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
            pointer-events: none;
            will-change: transform, opacity;
        }
    `;
    
    // Kombiniere alle Stile in einem Style-Block
    style.textContent = `
        body {
            display: flex;
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        /* Layout-Stile */
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
            display: flex;
            flex-direction: column;
            position: absolute;
            left: 0;
            bottom: 10px;
            overflow: visible;
        }
        
        .initiative-list {
            overflow-y: auto;
            flex-grow: 1;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: white;
            padding: 5px;
            max-height: calc(100% - 50px);
            z-index: 1;
        }
        
        /* Initiative-Einträge */
        .initiative-entry {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-bottom: 1px solid #eee;
            gap: 10px;
            margin-bottom: 2px;
            background-color: rgba(244, 67, 54, 0.1);
            position: relative;
            border-left: 2px solid rgba(244, 67, 54, 0.3);
            overflow: visible;
        }
        
        .initiative-entry:last-child {
            border-bottom: none;
        }
        
        .initiative-entry:hover {
            background-color: rgba(244, 67, 54, 0.15);
        }
        
        .initiative-entry.player-pokemon {
            background-color: rgba(76, 175, 80, 0.1);
            border-left: 2px solid rgba(76, 175, 80, 0.3);
        }
        
        .initiative-entry.player-pokemon:hover {
            background-color: rgba(76, 175, 80, 0.15);
        }
        
        /* Strukturierung der Initiative-Einträge */
        .initiative-left-section {
            display: flex;
            align-items: center;
            width: 30%;
            min-width: 120px;
        }
        
        .initiative-middle-section {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            gap: 5px;
            overflow: visible;
        }
        
        /* Mittlerer Bereich für Spieler-Pokémon einblenden */
        .initiative-entry.player-pokemon .initiative-middle-section {
            display: flex;
            flex-direction: column;
            gap: 5px;
            overflow: visible;
        }
        
        /* Neue Struktur für den rechten Bereich */
        .initiative-right-section {
            display: flex;
            align-items: center; /* War column, jetzt row */
            justify-content: flex-start; /* War center, jetzt flex-start */
            min-width: 140px; /* Etwas mehr Platz für beide Elemente */
            gap: 15px; /* Abstand zwischen Button und Initiative-Wert */
        }
        
        /* Container für Initiative-Wert und Buttons */
        .init-value-container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        /* Position des Besiegen/Revive-Buttons */
        .defeat-button-position {
            order: -1; /* Erscheint vor dem Initiative-Wert */
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
        
        /* Container für Player-Pokemon Defeat/Revive Button */
        .player-defeat-container {
            display: flex;
            justify-content: flex-start;
            margin-top: 6px;
            margin-bottom: 0;
        }
        
        /* Initiative-Wert Styling */
        .initiative-value {
            font-weight: bold;
            background-color: #3b5ca8;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            min-width: 35px;
            text-align: center;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .initiative-value:hover {
            filter: brightness(0.9);
            background-color: #2a4a8a;
            cursor: help;
        }
        
        .initiative-base {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.8);
            margin-left: 3px;
        }
        
        /* Initiative-Buttons */
        .initiative-buttons {
            display: flex;
            gap: 4px;
            margin-top: 8px;
        }
        
        .init-button {
            font-size: 11px;
            padding: 2px 4px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            color: white;
            transition: background-color 0.2s, transform 0.1s;
            line-height: 1;
        }
        
        .init-button:active {
            transform: scale(0.95);
        }
        
        .init-plus {
            background-color: #4caf50;
        }
        
        .init-plus:hover {
            background-color: #388e3c;
        }
        
        .init-minus {
            background-color: #f44336;
        }
        
        .init-minus:hover {
            background-color: #d32f2f;
        }
        
        /* HP-System */
        .hp-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            transition: background-color 0.3s;
            position: relative;
            overflow: visible;
        }
        
        .hp-change {
            animation: hp-pulse 0.5s ease-in-out;
        }
        
        @keyframes hp-pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
        }
        
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
        
        .hp-text {
            font-size: 11px;
            text-align: center;
            color: #555;
        }
        
        /* Aktion-Container (Schaden & Heilung) */
        .action-container {
            display: flex;
            flex-direction: row;
            align-items: center; 
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 6px;
        }
        
        .damage-container, .heal-container {
            display: flex;
            align-items: center;
            gap: 4px;
            height: 28px;
            padding: 0;
            width: auto;
            min-width: auto;
        }
        
        .damage-container::after {
            content: "";
            height: 20px;
            width: 1px;
            background-color: rgba(200, 200, 200, 0.5);
            margin-left: 10px;
        }
        
        .damage-input, .heal-input {
            width: 50px;
            min-width: 40px;
            height: 24px;
            border: 1px solid #ccc;
            border-radius: 3px;
            padding: 2px 5px;
            font-size: 12px;
        }
        
        .damage-button, .heal-button, 
        .damage-10-percent, .heal-10-percent {
            height: 24px;
            padding: 0 8px;
            font-size: 11px;
            border: none;
            border-radius: 3px;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
            white-space: nowrap;
        }
        
        .damage-button {
            background-color: #f44336;
        }
        
        .damage-button:hover {
            background-color: #d32f2f;
        }
        
        .damage-button:active {
            background-color: #b71c1c;
        }
        
        .damage-10-percent {
            background-color: #d32f2f;
            margin-left: 5px;
        }
        
        .damage-10-percent:hover {
            background-color: #b71c1c;
        }
        
        .heal-button {
            background-color: #4caf50;
        }
        
        .heal-button:hover {
            background-color: #388e3c;
        }
        
        .heal-10-percent {
            background-color: #27ae60;
            margin-left: 5px;
        }
        
        .heal-10-percent:hover {
            background-color: #219653;
        }
        
        .damage-button-group, .heal-button-group {
            display: flex;
            gap: 4px;
        }
        
        /* Allgemeine Styles für Defeat/Revive-Container */
        .defeat-revive-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        
        /* Buttons für Besiegen/Wiederbeleben - größer und konsistenter */
        .defeat-button, .revive-button {
            height: 28px;
            padding: 0 10px;
            font-size: 12px;
            border: none;
            border-radius: 3px;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.1s;
            white-space: nowrap;
        }
        
        .defeat-button {
            background-color: #7d0000;
        }
        
        .defeat-button:hover {
            background-color: #a30000;
            transform: scale(1.05);
        }
        
        .defeat-button:active {
            transform: scale(0.95);
        }
        
        .revive-button {
            background-color: #1b5e20;
        }
        
        .revive-button:hover {
            background-color: #2e7d32;
            transform: scale(1.05);
        }
        
        .revive-button:active {
            transform: scale(0.95);
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
        
        /* Pokemon-Slot Anpassungen */
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
        
        .team-container {
            gap: 10px;
            padding: 10px;
        }
        
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
        
        /* Besiegter Zustand für Initiative-Einträge */
        .initiative-entry.defeated {
            opacity: 0.6;
            filter: grayscale(70%);
            position: relative;
        }
        
        .initiative-entry.defeated::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.05);
            pointer-events: none;
        }
        
        .initiative-entry.defeated .initiative-name {
            text-decoration: line-through;
            opacity: 0.8;
        }
        
        /* Deaktivierte Elemente in besiegten Einträgen */
        .initiative-entry.defeated input,
        .initiative-entry.defeated button:not(.defeat-button):not(.revive-button) {
            opacity: 0.5;
            pointer-events: none;
            cursor: not-allowed;
        }

        ${initColorScale}
        ${animationStyles}
    `;
    
    document.head.appendChild(style);
    
    // Erstelle den Container für Animationen, falls er noch nicht existiert
    if (!document.querySelector('.damage-animation-container')) {
        const animationContainer = document.createElement('div');
        animationContainer.className = 'damage-animation-container';
        document.body.appendChild(animationContainer);
    }
}
  

/**
 * Richtet einen Beobachter ein, der die Initiative-Liste aktualisiert,
 * wenn sich relevante Elemente ändern
 * @param {PokemonTeamBuilder} app - Die PokemonTeamBuilder-App-Instanz
 */
function setupInitiativeObserver(app) {
    // Beobachte die Hauptpokémon-Slots für das Hinzufügen/Entfernen von Pokémon
    const teamObserver = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        // Prüfe, ob relevante Änderungen vorgenommen wurden
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                // Pokémon wurde hinzugefügt oder entfernt
                shouldUpdate = true;
            } else if (mutation.type === 'attributes') {
                // Bei Attributänderungen (data-value) wurde ein neues Pokémon ausgewählt
                if (mutation.attributeName === 'data-value') {
                    shouldUpdate = true;
                }
            }
        });
        
        if (shouldUpdate) {
            updateInitiativeList(app);
        }
    });
    
    teamObserver.observe(app.teamContainer, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['data-value'] 
    });
    
    // Beobachte Änderungen an den Spieler-Pokémon
    if (app.teamBuilder) {
        const teamSlotsContainer = document.querySelector('.team-grid-container');
        if (teamSlotsContainer) {
            teamObserver.observe(teamSlotsContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-value']
            });
        }
    }
    
    // Event-Listener für INIT- und Level-Änderungen
    document.addEventListener('change', (event) => {
        const target = event.target;
        
        // Nur bei INIT-Änderungen die Liste aktualisieren
        if (target.id && (target.id.startsWith('speed-') || target.id.startsWith('team-init-'))) {
            // Bei INIT-Änderungen aktualisiere die Liste
            updateInitiativeList(app);
        }
        // Bei Level-Änderungen wird nichts unternommen (keine Initiative-Auswirkung)
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
            
            // Prüfe, ob die Initiative bereits gespeichert ist
            if (!window.pokemonInitiative) {
                window.pokemonInitiative = {};
            }
            
            // Berechne die Initiative nur, wenn sie noch nicht existiert oder sich der INIT-Wert geändert hat
            if (!window.pokemonInitiative[pokemonKey] || 
                window.pokemonInitiative[pokemonKey].baseInit !== pokemon.init) {
                
                // Berechne die gewürfelte Initiative
                const rolledInit = rollInitiativeDice(pokemon.init);
                
                // Speichere die Initiative für dieses Pokemon
                window.pokemonInitiative[pokemonKey] = {
                    baseInit: pokemon.init,
                    rolledInit: rolledInit,
                    description: `${pokemon.init}W6 = ${rolledInit}`
                };
            }
            
            // Setze die displayedInit auf den gespeicherten Wert
            pokemon.displayedInit = window.pokemonInitiative[pokemonKey].rolledInit;
            pokemon.initDescription = window.pokemonInitiative[pokemonKey].description;
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
        'data-pokemon-key': pokemon.isPlayerPokemon ? 
            `player-${pokemon.slotIndex}` : 
            `${pokemon.id}_${pokemon.slotIndex}`
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
    
    // Mittlerer Bereich: HP-Bar und Action-Container
    const middleSection = createElement('div', { class: 'initiative-middle-section' });
    
    if (!pokemon.isPlayerPokemon) {
        // Für Nicht-Spieler-Pokemon: HP-Bar und Aktionen
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
        
        const actionContainer = createElement('div', { class: 'action-container' });

        // SCHADEN-BEREICH
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
        
        //10% SCHADEN BUTTON
        const damage10PercentButton = createElement('button', {
            class: 'damage-button damage-10-percent',
            id: `damage-10-percent-${pokemonKey}`
        });
        damage10PercentButton.textContent = '10% Schaden';
        
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
        
        // Event-Listener für 10% Schaden-Button
        damage10PercentButton.addEventListener('click', () => {
            apply10PercentDamage(pokemonKey);
        });
        
        // Füge alles zum Damage-Container hinzu
        damageContainer.appendChild(damageInput);
        damageContainer.appendChild(damageButton);
        damageContainer.appendChild(damage10PercentButton);
        
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

        // 10% HEILUNG BUTTON
        const heal10PercentButton = createElement('button', {
            class: 'heal-button heal-10-percent',
            id: `heal-10-percent-${pokemonKey}`
        });
        heal10PercentButton.textContent = '10% Heilung';

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

        // Event-Listener für 10% Heilungs-Button
        heal10PercentButton.addEventListener('click', () => {
            apply10PercentHealing(pokemonKey);
        });

        // Füge alles zum Heal-Container hinzu
        healContainer.appendChild(healInput);
        healContainer.appendChild(healButton);
        healContainer.appendChild(heal10PercentButton);

        // Füge Container zum Action-Container hinzu
        actionContainer.appendChild(damageContainer);
        actionContainer.appendChild(healContainer);
        
        // Füge HP-Container und Action-Container zum mittleren Bereich hinzu
        middleSection.appendChild(hpContainer);
        middleSection.appendChild(actionContainer);

        if (window.pokemonHPState[pokemonKey] && window.pokemonHPState[pokemonKey].defeated) {
            setTimeout(() => {
                defeatPokemon(pokemonKey);
            }, 0);
        }
    }
    
    // Rechter Bereich: Initiative-Wert und Buttons
    const rightSection = createElement('div', { class: 'initiative-right-section' });
    
    // Erstelle den Besiegen/Revive-Button am Anfang des rechten Bereichs
    const pokemonKey = pokemon.isPlayerPokemon ? 
        `player-${pokemon.slotIndex}` : 
        `${pokemon.id}_${pokemon.slotIndex}`;
    
    // Falls es ein Spieler-Pokemon ist, initialisiere den HP-Zustand
    if (pokemon.isPlayerPokemon && !window.pokemonHPState[pokemonKey]) {
        window.pokemonHPState[pokemonKey] = {
            defeated: false
        };
    }
    
    // Erstelle den Besiegen/Revive-Button-Container
    const defeatButtonContainer = createDefeatButton(pokemonKey);
    defeatButtonContainer.classList.add('defeat-button-position'); // Hinzufügen einer Klasse für Positionierung
    
    // Füge den Button-Container zum rechten Bereich hinzu
    rightSection.appendChild(defeatButtonContainer);
    
    // INIT-Wert
    const initValueContainer = createElement('div', { class: 'init-value-container' });
    const initValue = createElement('div', { class: 'initiative-value' });
    
    // Ermittle die Farbklasse basierend auf dem Initiative-Wert
    const colorClass = getInitiativeColorClass(pokemon.displayedInit || 0);
    initValue.classList.add(colorClass);
    
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
    
    // INITIATIVE-BUTTONS
    const initButtonsContainer = createElement('div', { class: 'initiative-buttons' });
    
    // INIT+ Button
    const initPlusButton = createElement('button', { 
        class: 'init-button init-plus',
        id: `init-plus-${pokemonKey}`,
        title: 'Initiative erhöhen'
    });
    initPlusButton.textContent = 'INIT+';
    
    // INIT- Button
    const initMinusButton = createElement('button', { 
        class: 'init-button init-minus',
        id: `init-minus-${pokemonKey}`,
        title: 'Initiative verringern'
    });
    initMinusButton.textContent = 'INIT-';
    
    // Füge Event-Listener für die Buttons hinzu
    initPlusButton.addEventListener('click', () => {
        // Ermittle das Level des Pokémon
        const level = pokemon.level || 1;
        adjustPokemonInitiative(pokemon.isPlayerPokemon, pokemonKey, level, true);
    });
    
    initMinusButton.addEventListener('click', () => {
        // Ermittle das Level des Pokémon
        const level = pokemon.level || 1;
        adjustPokemonInitiative(pokemon.isPlayerPokemon, pokemonKey, level, false);
    });
    
    // Füge Buttons zum Container hinzu
    initButtonsContainer.appendChild(initPlusButton);
    initButtonsContainer.appendChild(initMinusButton);
    
    // Gruppiere Initiative-Wert und Buttons in einen Container
    initValueContainer.appendChild(initValue);
    initValueContainer.appendChild(initButtonsContainer);
    
    // Füge den Initiative-Container zum rechten Bereich hinzu
    rightSection.appendChild(initValueContainer);
    
    // Wende den Besiegungsstatus an, falls das Pokemon bereits besiegt ist
    if (window.pokemonHPState[pokemonKey] && window.pokemonHPState[pokemonKey].defeated) {
        setTimeout(() => {
            defeatPokemon(pokemonKey);
        }, 0);
    }
    
    // Füge alle Bereiche zum Eintrag hinzu
    entry.appendChild(leftSection);
    entry.appendChild(middleSection);
    entry.appendChild(rightSection);
    
    return entry;
}

/**
 * Passt die Initiative eines Pokémon an (erhöhen oder verringern)
 * @param {boolean} isPlayerPokemon - Ist es ein Spieler-Pokémon?
 * @param {string} pokemonKey - Schlüssel zur Identifizierung des Pokémon
 * @param {number} amount - Menge der Änderung (üblicherweise das Level des Pokémon)
 * @param {boolean} increase - true zum Erhöhen, false zum Verringern
 */
function adjustPokemonInitiative(isPlayerPokemon, pokemonKey, amount, increase) {
    // Für Spieler-Pokémon
    if (isPlayerPokemon) {
        // Extrahiere den Index aus dem pokemonKey (Format: "player-X")
        const slotIndex = pokemonKey.split('-')[1];
        
        // Spieler-Pokémon verwenden ihre INIT direkt
        const teamInitInput = document.getElementById(`team-init-${slotIndex}`);
        if (teamInitInput) {
            let currentInit = parseInt(teamInitInput.value) || 0;
            
            // Berechne neuen Wert
            let newInit = increase ? currentInit + amount : Math.max(1, currentInit - amount);
            
            // Aktualisiere Wert im Input
            teamInitInput.value = newInit;
            
            // Triggere ein change-Event, damit die Initiative-Liste aktualisiert wird
            const event = new Event('change');
            teamInitInput.dispatchEvent(event);
            
            console.log(`Spieler-Pokémon Initiative ${increase ? 'erhöht' : 'verringert'} um ${amount} auf ${newInit}`);
            
            // KORREKTUR: Nach Änderung der Initiative die Liste aktualisieren
            if (typeof updateInitiativeList === 'function' && window.pokemonApp) {
                updateInitiativeList(window.pokemonApp);
            }
        }
    } 
    // Für Nicht-Spieler-Pokémon
    else {
        // Für Nicht-Spieler-Pokémon (pokemonKey Format: "id_slotIndex")
        if (!window.pokemonInitiative || !window.pokemonInitiative[pokemonKey]) {
            console.error('Initiative-Daten für Pokémon nicht gefunden:', pokemonKey);
            return;
        }
        
        // Aktualisiere den gespeicherten Wert
        let currentInit = window.pokemonInitiative[pokemonKey].rolledInit;
        
        // Berechne neuen Wert (nicht unter 1)
        let newInit = increase ? currentInit + amount : Math.max(1, currentInit - amount);
        
        // Aktualisiere gespeicherten Wert
        window.pokemonInitiative[pokemonKey].rolledInit = newInit;
        
        // Aktualisiere die Beschreibung
        window.pokemonInitiative[pokemonKey].description = 
            `${window.pokemonInitiative[pokemonKey].baseInit}W6 = ${newInit} ${increase ? '(+)' : '(-)'}`;
        
        console.log(`Nicht-Spieler-Pokémon Initiative ${increase ? 'erhöht' : 'verringert'} um ${amount} auf ${newInit}`);
        
        // Aktualisiere die Initiative-Liste
        if (typeof updateInitiativeList === 'function' && window.pokemonApp) {
            updateInitiativeList(window.pokemonApp);
        }
    }
}

/**
 * Bestimmt die CSS-Klasse für die Farbgestaltung der Initiative basierend auf dem Initiative-Wert
 * @param {number} initiativeValue - Der Initiative-Wert
 * @returns {string} - Die CSS-Klasse für die Initiative-Farbe
 */
function getInitiativeColorClass(initiativeValue) {
    // Begrenze den Wert auf 0-500
    const limitedValue = Math.max(0, Math.min(500, initiativeValue));
    
    // Skaliere den Wert auf 0-29 (für 30 Farbstufen)
    const scaledValue = Math.floor(limitedValue / (500 / 29));
    
    return `init-color-${scaledValue}`;
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
    
    // Wenn das Pokemon bereits besiegt ist, nichts tun
    if (window.pokemonHPState[pokemonKey].defeated) return;
    
    // Hole aktuelle und maximale KP aus dem gespeicherten Zustand
    let currentHP = window.pokemonHPState[pokemonKey].currentHP;
    const maxHP = window.pokemonHPState[pokemonKey].maxHP;
    
    // Berechne neue KP
    const newHP = Math.max(0, currentHP - damageValue);
    
    // Aktualisiere den HP-Zustand
    window.pokemonHPState[pokemonKey].currentHP = newHP;
    
    // UI-Aktualisierung der HP-Bar
    updateHPBar(pokemonKey, newHP, maxHP);
    
    // Zeige Schadens-Feedback an
    showDamageIndicator(pokemonKey, damageValue);
    
    // Setze das Schadenseingabefeld zurück
    damageInput.value = '0';
    
    // Wenn HP auf 0 fallen, setze den Besiegt-Status
    if (newHP === 0) {
        defeatPokemon(pokemonKey);
    }
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
    
    // Bei 0 KP kann nicht geheilt werden
    if (currentHP <= 0) {
        healInput.value = '0';
        return;
    }
    
    // Berechne neue KP (nie über Maximum)
    const newHP = Math.min(maxHP, currentHP + healValue);
    
    // Wenn keine Heilung möglich ist (bereits max HP), nichts tun
    if (newHP <= currentHP) {
        healInput.value = '0';
        return;
    }
    
    // Aktualisiere den HP-Zustand
    window.pokemonHPState[pokemonKey].currentHP = newHP;
    
    // UI-Aktualisierung der HP-Bar
    updateHPBar(pokemonKey, newHP, maxHP);
    
    // Zeige Heilungs-Feedback an
    showHealingIndicator(pokemonKey, healValue);
    
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
 * Wendet 10% Schaden auf ein Pokemon an
 * @param {string} pokemonKey - Einzigartiger Schlüssel des Pokemons (id_slotIndex)
 */
function apply10PercentDamage(pokemonKey) {
    // Prüfe ob der HP-Zustand für dieses Pokemon existiert
    if (!window.pokemonHPState[pokemonKey]) return;
    
    // Hole aktuelle und maximale KP aus dem gespeicherten Zustand
    let currentHP = window.pokemonHPState[pokemonKey].currentHP;
    const maxHP = window.pokemonHPState[pokemonKey].maxHP;
    
    // Berechne 10% der maximalen KP, aufgerundet
    const damageAmount = Math.ceil(maxHP * 0.1);
    
    // Berechne neue KP
    const newHP = Math.max(0, currentHP - damageAmount);
    
    // Aktualisiere den HP-Zustand
    window.pokemonHPState[pokemonKey].currentHP = newHP;
    
    // UI-Aktualisierung der HP-Bar
    updateHPBar(pokemonKey, newHP, maxHP);
    
    // Zeige Schadens-Feedback an
    showDamageIndicator(pokemonKey, damageAmount);
    
    console.log(`10% Schaden angewendet: ${damageAmount} Schaden (${newHP}/${maxHP} KP übrig)`);
}

/**
 * Wendet 10% Heilung auf ein Pokemon an
 * @param {string} pokemonKey - Einzigartiger Schlüssel des Pokemons (id_slotIndex)
 */
function apply10PercentHealing(pokemonKey) {
    // Prüfe ob der HP-Zustand für dieses Pokemon existiert
    if (!window.pokemonHPState[pokemonKey]) return;
    
    // Hole aktuelle und maximale KP aus dem gespeicherten Zustand
    let currentHP = window.pokemonHPState[pokemonKey].currentHP;
    const maxHP = window.pokemonHPState[pokemonKey].maxHP;
    
    // Bei 0 KP kann nicht geheilt werden
    if (currentHP <= 0) return;
    
    // Berechne 10% der maximalen KP, aufgerundet
    const healAmount = Math.ceil(maxHP * 0.1);
    
    // Berechne neue KP (nie über Maximum)
    const newHP = Math.min(maxHP, currentHP + healAmount);
    
    // Wenn keine Heilung möglich ist (bereits max HP), nichts tun
    if (newHP <= currentHP) return;
    
    // Aktualisiere den HP-Zustand
    window.pokemonHPState[pokemonKey].currentHP = newHP;
    
    // UI-Aktualisierung der HP-Bar
    updateHPBar(pokemonKey, newHP, maxHP);
    
    // Zeige Heilungs-Feedback an
    showHealingIndicator(pokemonKey, healAmount);
    
    console.log(`10% Heilung angewendet: ${healAmount} Heilung (${newHP}/${maxHP} KP)`);
}

/**
 * Zeigt den genommenen Schaden als animierte Zahl über der HP-Anzeige an
 * @param {string} pokemonKey - Einzigartiger Schlüssel des Pokemons
 * @param {number} damageValue - Höhe des Schadens
 */
function showDamageIndicator(pokemonKey, damageValue) {
    // Finde den HP-Container für dieses Pokemon
    const hpContainer = document.querySelector(`.hp-container[data-pokemon-key="${pokemonKey}"]`);
    if (!hpContainer) return;
    
    // Hole die Position des HP-Containers relativ zum Viewport
    const rect = hpContainer.getBoundingClientRect();
    
    // Erstelle ein Element für die Schadens-Anzeige im separaten Container
    const damageIndicator = document.createElement('div');
    damageIndicator.className = 'damage-indicator';
    damageIndicator.textContent = `${damageValue}`;
    
    // Positioniere die Anzeige mittig über dem HP-Container
    const centerX = rect.left + (rect.width / 2) - 8; // Links-Position
    const startY = rect.top - 5; // Starte knapp über dem Container
    
    // Zufälliger horizontaler Versatz für natürlichere Wirkung
    const randomOffset = Math.floor(Math.random() * 10) - 5;
    
    // Setze die Position
    damageIndicator.style.position = 'fixed';
    damageIndicator.style.left = `${centerX + randomOffset}px`;
    damageIndicator.style.top = `${startY}px`;
    
    // Füge die Anzeige zum separaten Animation-Container hinzu
    document.querySelector('.damage-animation-container').appendChild(damageIndicator);
    
    // Entferne das Element nach der Animation
    setTimeout(() => {
      if (damageIndicator.parentNode) {
        damageIndicator.parentNode.removeChild(damageIndicator);
      }
    }, 2100);
}

/**
 * Zeigt die Heilung als animierte Zahl über der HP-Anzeige an
 * @param {string} pokemonKey - Einzigartiger Schlüssel des Pokemons
 * @param {number} healAmount - Höhe der Heilung
 */
function showHealingIndicator(pokemonKey, healAmount) {
    // Finde den HP-Container für dieses Pokemon
    const hpContainer = document.querySelector(`.hp-container[data-pokemon-key="${pokemonKey}"]`);
    if (!hpContainer) return;
    
    // Hole die Position des HP-Containers relativ zum Viewport
    const rect = hpContainer.getBoundingClientRect();
    
    // Erstelle ein Element für die Heilungs-Anzeige im separaten Container
    const healingIndicator = document.createElement('div');
    healingIndicator.className = 'healing-indicator';
    healingIndicator.textContent = `+${healAmount}`;
    
    // Positioniere die Anzeige mittig über dem HP-Container
    const centerX = rect.left + (rect.width / 2) - 8; // Links-Position
    const startY = rect.top - 5; // Starte knapp über dem Container
    
    // Zufälliger horizontaler Versatz für natürlichere Wirkung
    const randomOffset = Math.floor(Math.random() * 10) - 5;
    
    // Setze die Position
    healingIndicator.style.position = 'fixed';
    healingIndicator.style.left = `${centerX + randomOffset}px`;
    healingIndicator.style.top = `${startY}px`;
    
    // Füge die Anzeige zum separaten Animation-Container hinzu
    document.querySelector('.damage-animation-container').appendChild(healingIndicator);
    
    // Entferne das Element nach der Animation
    setTimeout(() => {
      if (healingIndicator.parentNode) {
        healingIndicator.parentNode.removeChild(healingIndicator);
      }
    }, 2100);
}

/**
 * Stellt sicher, dass die Schadens-Animationen nicht abgeschnitten werden
 * Muss einmalig aufgerufen werden
 */
function enableDamageAnimationOverflow() {
    // Selektiere alle relevanten Container außer der Initiative-Liste
    const containers = [
        document.querySelector('.initiative-container'),
        ...document.querySelectorAll('.initiative-entry'),
        ...document.querySelectorAll('.initiative-middle-section')
    ];
    
    // Setze overflow: visible für alle Container außer der Initiative-Liste
    containers.forEach(container => {
        if (container) {
            container.style.overflow = 'visible';
        }
    });
    
    // Spezielle Behandlung für die Initiative-Liste: nur overflow-x auf visible setzen
    const initiativeList = document.querySelector('.initiative-list');
    if (initiativeList) {
        initiativeList.style.overflowX = 'visible';
        initiativeList.style.overflowY = 'auto'; // Behalte vertikales Scrollen bei
    }
    
    console.log('Damage animation overflow settings adjusted with scrolling preserved');
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

function createDefeatButton(pokemonKey) {
    const buttonContainer = createElement('div', { 
      class: 'defeat-revive-container',
      id: `defeat-revive-container-${pokemonKey}`
    });
    
    const defeatButton = createElement('button', {
      class: 'defeat-button',
      id: `defeat-button-${pokemonKey}`
    });
    defeatButton.textContent = 'Besiegen';
    
    // Event-Handler für den Klick auf "Besiegen"
    defeatButton.addEventListener('click', () => {
      defeatPokemon(pokemonKey);
    });
    
    buttonContainer.appendChild(defeatButton);
    return buttonContainer;
}

function createReviveButton(pokemonKey) {
    const reviveButton = createElement('button', {
      class: 'revive-button',
      id: `revive-button-${pokemonKey}`
    });
    reviveButton.textContent = 'Revive';
    
    // Event-Handler für den Klick auf "Revive"
    reviveButton.addEventListener('click', () => {
      revivePokemon(pokemonKey);
    });
    
    return reviveButton;
}

function defeatPokemon(pokemonKey) {
    // 1. Status im HP-Zustand speichern
    if (!window.pokemonHPState[pokemonKey]) {
        window.pokemonHPState[pokemonKey] = { defeated: true };
    } else {
        // Speichere die aktuellen HP, falls vorhanden, bevor wir sie auf 0 setzen (für mögliches Revive später)
        if (window.pokemonHPState[pokemonKey].currentHP !== undefined) {
            window.pokemonHPState[pokemonKey].previousHP = window.pokemonHPState[pokemonKey].currentHP;
            window.pokemonHPState[pokemonKey].currentHP = 0;
        }
        window.pokemonHPState[pokemonKey].defeated = true;
    }
    
    // 2. Initiative-Eintrag finden und Klasse hinzufügen
    const initiativeEntry = document.querySelector(`.initiative-entry[data-pokemon-key="${pokemonKey}"]`);
    if (!initiativeEntry) return;
    
    initiativeEntry.classList.add('defeated');
    
    // 3. HP-Bar aktualisieren (nur für Nicht-Spieler-Pokémon)
    if (window.pokemonHPState[pokemonKey].maxHP) {
        updateHPBar(pokemonKey, 0, window.pokemonHPState[pokemonKey].maxHP);
    }
    
    // 4. Besiegen-Button durch Revive-Button ersetzen
    const defeatReviveContainer = document.getElementById(`defeat-revive-container-${pokemonKey}`);
    if (defeatReviveContainer) {
        defeatReviveContainer.innerHTML = '';
        
        const reviveButton = createReviveButton(pokemonKey);
        defeatReviveContainer.appendChild(reviveButton);
    }
}


function revivePokemon(pokemonKey) {
    // 1. Status im HP-Zustand wiederherstellen
    if (!window.pokemonHPState[pokemonKey]) return;
    
    // Setze den Besiegungszustand zurück
    window.pokemonHPState[pokemonKey].defeated = false;
    
    // 2. Für Nicht-Spieler-Pokémon: Setze HP auf 1 oder auf 10% der maximalen HP
    if (window.pokemonHPState[pokemonKey].maxHP) {
        // Setze HP auf 1 oder auf den vorherigen Wert, wenn weniger als 10% der maximalen HP
        window.pokemonHPState[pokemonKey].currentHP = Math.max(1, Math.min(
            window.pokemonHPState[pokemonKey].previousHP || 0, 
            Math.floor(window.pokemonHPState[pokemonKey].maxHP * 0.1)
        ));
        delete window.pokemonHPState[pokemonKey].previousHP; // Lösche die gespeicherte HP
    }
    
    // 3. Initiative-Eintrag finden und Klasse entfernen
    const initiativeEntry = document.querySelector(`.initiative-entry[data-pokemon-key="${pokemonKey}"]`);
    if (!initiativeEntry) return;
    
    initiativeEntry.classList.remove('defeated');
    
    // 4. HP-Bar aktualisieren (nur für Nicht-Spieler-Pokémon)
    if (window.pokemonHPState[pokemonKey].maxHP) {
        updateHPBar(
            pokemonKey, 
            window.pokemonHPState[pokemonKey].currentHP, 
            window.pokemonHPState[pokemonKey].maxHP
        );
        
        // Zeige Heilungs-Feedback an
        showHealingIndicator(pokemonKey, window.pokemonHPState[pokemonKey].currentHP);
    }
    
    // 5. Revive-Button durch Besiegen-Button ersetzen
    const defeatReviveContainer = document.getElementById(`defeat-revive-container-${pokemonKey}`);
    if (defeatReviveContainer) {
        defeatReviveContainer.innerHTML = '';
        
        const defeatButton = createElement('button', {
            class: 'defeat-button',
            id: `defeat-button-${pokemonKey}`
        });
        defeatButton.textContent = 'Besiegen';
        defeatButton.addEventListener('click', () => {
            defeatPokemon(pokemonKey);
        });
        
        defeatReviveContainer.appendChild(defeatButton);
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
        
        // Hole Level-Wert aus dem Level-Input
        const levelElement = document.getElementById(`pokemon-level-${i}`);
        const level = levelElement ? parseInt(levelElement.value) : 1;
        
        // Hole HP-Wert aus den Statuswerten
        const hpElement = document.getElementById(`hp-${i}`);
        const hp = hpElement ? parseInt(hpElement.value) : 0;
        
        allPokemon.push({
            id: pokemon.id,
            name: pokemon.germanName || pokemon.name,
            sprite: pokemon.sprites.front_default,
            init: init,
            level: level, // Level hinzufügen
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
            
            // Hole Level-Wert aus dem Team-Level-Input
            const levelElement = document.getElementById(`team-level-${i}`);
            const level = levelElement ? parseInt(levelElement.value) : 1;
            
            allPokemon.push({
                id: pokemon.id,
                name: pokemon.germanName || pokemon.name,
                sprite: pokemon.sprites.front_default,
                init: init,
                level: level, // Level hinzufügen
                slotIndex: i,
                isPlayerPokemon: true
            });
        }
    }
    
    return allPokemon;
}
