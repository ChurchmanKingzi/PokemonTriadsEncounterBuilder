/**
 * Fügt INIT+/INIT- Buttons zur Initiative-Liste hinzu
 * Diese Datei erweitert die vorhandene Initiative-Funktionalität
 */

// Speichere die originale createInitiativeEntry-Funktion
let originalCreateInitiativeEntry;

// Warte bis das DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    // Warte einen Moment, bis die Initiative-Liste initialisiert wurde
    setTimeout(() => {
        // Speichere die Original-Funktion, bevor wir sie überschreiben
        if (typeof createInitiativeEntry === 'function') {
            originalCreateInitiativeEntry = createInitiativeEntry;
            
            // Überschreibe die Funktion mit unserer erweiterten Version
            window.createInitiativeEntry = enhancedCreateInitiativeEntry;
            
            // Füge CSS-Stile für Initiative-Buttons hinzu
            addInitiativeButtonStyles();
            
            console.log('Initiative-Buttons wurden initialisiert.');
            
            // Aktualisiere die Initiative-Liste, wenn verfügbar
            if (typeof updateInitiativeList === 'function' && window.pokemonApp) {
                updateInitiativeList(window.pokemonApp);
            }
        } else {
            console.error('createInitiativeEntry-Funktion nicht gefunden.');
        }
    }, 1000);
});

/**
 * CSS-Stile für die neuen Initiative-Buttons
 */
function addInitiativeButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .initiative-buttons {
            display: flex;
            gap: 4px;
            margin-top: 4px;
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
    `;
    document.head.appendChild(style);
}

/**
 * Erweiterte Version der createInitiativeEntry-Funktion mit Initiative-Buttons
 * Diese Funktion verwendet die Original-Funktion und fügt nur die Buttons hinzu,
 * anstatt die komplette Funktion zu duplizieren
 */
function enhancedCreateInitiativeEntry(pokemon, index) {
    // Rufe die Original-Funktion auf, um das Basis-Element zu erhalten
    const entry = originalCreateInitiativeEntry(pokemon, index);
    
    // Da die Buttons bereits in der originalen createInitiativeEntry-Funktion
    // hinzugefügt werden, müssen wir hier nichts weiter machen.
    // Wir geben einfach den originalen Eintrag zurück.
    
    return entry;
}

/**
 * Ergänze die Level-Information für die Pokémon in der Initiative-Liste
 * Diese Funktion wird vor dem Aufruf der updateInitiativeList-Funktion ausgeführt
 */
const originalGetAllActivePokemon = window.getAllActivePokemon;

if (typeof originalGetAllActivePokemon === 'function') {
    window.getAllActivePokemon = function(app) {
        // Rufe die Original-Funktion auf
        const allPokemon = originalGetAllActivePokemon(app);
        
        // Füge Level-Information hinzu
        allPokemon.forEach(pokemon => {
            if (!pokemon.isPlayerPokemon) {
                // Hole Level-Wert für Nicht-Spieler-Pokémon
                const levelElement = document.getElementById(`pokemon-level-${pokemon.slotIndex}`);
                if (levelElement) {
                    pokemon.level = parseInt(levelElement.value) || 1;
                } else {
                    pokemon.level = 1; // Standard-Level
                }
            } else {
                // Hole Level-Wert für Spieler-Pokémon
                const levelElement = document.getElementById(`team-level-${pokemon.slotIndex}`);
                if (levelElement) {
                    pokemon.level = parseInt(levelElement.value) || 1;
                } else {
                    pokemon.level = 1; // Standard-Level
                }
            }
        });
        
        return allPokemon;
    };
}