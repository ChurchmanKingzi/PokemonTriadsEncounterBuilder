/**
 * Pokémon Team Builder Hauptanwendung
 */
class PokemonTeamBuilder {
    // Im Konstruktor hinzufügen:
    constructor() {
        this.teamContainer = document.querySelector('.team-container');
        this.loadingMessage = document.querySelector('.loading');
        this.pokemonService = new PokemonService();
        this.moveService = new MoveService();
        this.statCalculator = new StatCalculator();
        this.uiBuilder = new UIBuilder(this);
        this.eventHandler = new EventHandler(this);
        this.teamBuilder = new TeamBuilder(this); // TeamBuilder für die rechte Seite
        this.INITIAL_SLOT_COUNT = 1;    // Start mit einem Slot
        this.MAX_SLOTS = 20;            // Maximale Anzahl an Slots
        this.activeDropdown = null;
        this.activeMoveDropdown = null;
        this.searchQuery = '';
        this.searchTimeout = null;
        this.currentSlotCount = 0;      // Aktuelle Anzahl an Slots
        this.tooltipInitialized = false;
    }

    /**
     * Initialisiert die Anwendung
     */
    async init() {
        // Style für horizontales Scrollen hinzufügen
        this.addHorizontalScrollStyle();
        
        // Erstelle einen initialen Slot
        this.createTeamSlots();

        // Initialisiere das Team-Interface
        this.teamBuilder.init();
        
        try {
            // Lade Pokémon-Daten
            const sortedPokemon = await this.pokemonService.loadAllPokemonData();
            
            // Lade Attackendaten
            await this.moveService.loadAllMoveData();
            
            // Fülle Dropdowns
            this.populateDropdowns(sortedPokemon);
            
            // Verstecke Ladeanimation
            this.loadingMessage.style.display = 'none';
            
            // Event-Listener hinzufügen
            this.eventHandler.setupGlobalEventListeners();
            
            // EXP Gain Event Listener für alle Slots einrichten
            for (let i = 0; i < this.currentSlotCount; i++) {
                this.setupExpGainEventListeners(i);
            }
        } catch (error) {
            this.loadingMessage.textContent = 'Fehler beim Laden der Daten. Bitte versuche es später erneut.';
        }

        // Initialisiere Tooltip-Positionierung
        this.initializeTooltipPositioning();

        this.initializePokemonTeamBuilderWithTooltips();
    }

    /**
     * Initialisiert die Tooltip-Positionierung für die Würfel-Tooltips
     * Diese Methode wird auch aufgerufen, wenn neue Slots hinzugefügt werden
     */
    initializeTooltipPositioning() {
        // Verzögerung, um sicherzustellen, dass alle DOM-Elemente geladen sind
        setTimeout(() => {
            // Rufe die Funktion aus utils.js auf
            if (typeof setupTooltipPositioning === 'function') {
                setupTooltipPositioning();
                this.tooltipInitialized = true;
            }
        }, 200);
    }

    initializePokemonTeamBuilderWithTooltips() {
        // Fähigkeits-Tooltips direkt initialisieren, falls die App bereits geladen ist
        if (this.uiBuilder) {
            this.uiBuilder.createAbilityTooltips();
            console.log('Fähigkeits-Tooltips wurden initialisiert.');
            return;
        }
        
        // Warte, bis die Hauptanwendung initialisiert ist
        const checkAppInterval = setInterval(() => {
            if (window.pokemonApp && window.pokemonApp.uiBuilder) {
                clearInterval(checkAppInterval);
                
                // Füge die Methode zur Initialisierung von Fähigkeits-Tooltips hinzu
                window.pokemonApp.uiBuilder.createAbilityTooltips();
                
                console.log('Fähigkeits-Tooltips wurden nach Timeout initialisiert.');
            }
        }, 500); // Alle 500ms prüfen
    }

    /**
     * Fügt CSS für horizontales Scrollen hinzu
     */
    addHorizontalScrollStyle() {
        const style = document.createElement('style');
        style.textContent = `
            .team-container {
                display: flex;
                flex-wrap: nowrap;
                overflow-x: auto;
                gap: 20px;
                padding-bottom: 15px; /* Platz für Scrollbar */
                scrollbar-width: thin;
            }
            
            .pokemon-slot {
                flex: 0 0 250px; /* Feste Breite für jeden Slot */
                margin-right: 0;
            }
            
            /* Für Webkit-Browser (Chrome, Safari) */
            .team-container::-webkit-scrollbar {
                height: 8px;
            }
            
            .team-container::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            
            .team-container::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 4px;
            }
            
            .team-container::-webkit-scrollbar-thumb:hover {
                background: #aaa;
            }
        `;
        document.head.appendChild(style);
    }


    /**
     * Dropdown für Attacken öffnen/schließen
     * @param {number} pokemonIndex - Index des Pokémon-Slots
     * @param {number} moveIndex - Index des Attacken-Slots
     */
    toggleMoveDropdown(pokemonIndex, moveIndex) {
        const optionsContainer = document.getElementById(`move-options-${pokemonIndex}-${moveIndex}`);
        const moveSelectElement = document.getElementById(`move-select-${pokemonIndex}-${moveIndex}`);
        const containerElement = moveSelectElement.parentElement;
        
        // Schließe alle anderen Dropdowns
        this.closeAllDropdowns();
        
        // Toggle des aktuellen Dropdowns
        if (optionsContainer.style.display === 'block') {
        optionsContainer.style.display = 'none';
        this.activeMoveDropdown = null;
        this.searchQuery = ''; // Suchanfrage zurücksetzen
        } else {
        // Prüfe, ob ein Pokémon ausgewählt ist
        const pokemonId = document.getElementById(`pokemon-select-${pokemonIndex}`).getAttribute('data-value');
        if (!pokemonId) {
            // Wenn kein Pokémon ausgewählt ist, zeige keine Attacken an
            return;
        }
        
        // Hole Pokémon-Daten
        const pokemon = this.pokemonService.getPokemonById(Number(pokemonId));
        if (!pokemon) return;
        
        // Kategorisiere und sortiere Attacken
        const categorizedMoves = this.moveService.categorizeMoves(pokemon);
        
        // Fülle das Dropdown
        this.uiBuilder.populateMoveDropdown(pokemonIndex, moveIndex, categorizedMoves);
        
        // Positioniere das Dropdown je nach Position im Viewport
        positionDropdown(optionsContainer, containerElement);
        
        // Zeige das Dropdown an
        optionsContainer.style.display = 'block';
        this.activeMoveDropdown = {
            pokemonIndex,
            moveIndex
        };
        
        // Scrollposition anpassen
        const selectedMoveId = moveSelectElement.getAttribute('data-value');
        if (selectedMoveId) {
            const selectedOption = optionsContainer.querySelector(`[data-value="${selectedMoveId}"]`);
            if (selectedOption) {
            optionsContainer.scrollTop = selectedOption.offsetTop - optionsContainer.offsetTop - 50;
            // Hervorhebe die aktuell ausgewählte Attacke
            this.uiBuilder.highlightOption(selectedOption, optionsContainer);
            }
        } else {
            // Wenn keine Attacke ausgewählt ist, hebe die erste Option hervor (für Enter-Auswahl)
            const firstMoveOption = optionsContainer.querySelector('.move-select-option[data-value]:not([data-value=""])');
            if (firstMoveOption) {
            this.uiBuilder.highlightOption(firstMoveOption, optionsContainer);
            }
        }
        }
    }

    /**
     * Alle Dropdowns schließen
     * Diese Methode muss erweitert werden
     */
    closeAllDropdowns() {
        const optionsContainers = document.querySelectorAll('.custom-select-options');
        optionsContainers.forEach(container => {
            container.style.display = 'none';
        });
        this.activeDropdown = null;
        this.activeMoveDropdown = null;
        this.searchQuery = ''; // Suchanfrage zurücksetzen
    }

    /**
     * Setzt die ausgewählte Attacke für einen Slot
     * @param {number} pokemonIndex - Index des Pokémon-Slots
     * @param {number} moveIndex - Index des Attacken-Slots
     * @param {string} value - Attacken-ID
     * @param {string} text - Anzuzeigender Text
     * @param {string} type - Typ der Attacke (optional)
     */
    selectMove(pokemonIndex, moveIndex, value, text, type = null) {
        const selectedElement = document.getElementById(`move-select-${pokemonIndex}-${moveIndex}`);
        selectedElement.setAttribute('data-value', value);
        
        // Inhalt leeren
        selectedElement.innerHTML = '';
        
        if (value) {
            // Für ausgewählte Attacken
            const moveContent = createElement('div', { class: 'selected-move' });
            
            if (type) {
                // Typ-Indikator hinzufügen
                const typeIndicator = createElement('div', {
                    class: `move-type-indicator type-${type}`
                });
                moveContent.appendChild(typeIndicator);
            }
            
            const textSpan = createElement('span');
            textSpan.textContent = text;
            moveContent.appendChild(textSpan);
            
            selectedElement.appendChild(moveContent);
        } else {
            // Nur Text anzeigen für "Keine Attacke"
            selectedElement.textContent = text;
        }
    }

    /**
     * Durchsucht das Attacken-Dropdown nach Attacken, die mit der Suchanfrage übereinstimmen
     */
    searchInMoveDropdown() {
        if (!this.activeMoveDropdown) return;
        
        const { pokemonIndex, moveIndex } = this.activeMoveDropdown;
        const optionsContainer = document.getElementById(`move-options-${pokemonIndex}-${moveIndex}`);
        const options = optionsContainer.querySelectorAll('.move-select-option[data-value]:not([data-value=""])');
        
        if (this.searchQuery === '') {
            // Wenn die Suchanfrage leer ist, hebe die erste Option hervor (für Enter-Auswahl)
            const firstOption = optionsContainer.querySelector('.move-select-option[data-value]:not([data-value=""])');
            if (firstOption) {
                this.uiBuilder.highlightOption(firstOption, optionsContainer);
            }
            return;
        }
        
        // Suche nach der ersten passenden Attacke
        let bestMatch = null;
        const lowerSearchQuery = this.searchQuery.toLowerCase();
        
        // Durchlaufe alle Optionen, um das beste Match zu finden
        for (const option of options) {
            const optionName = option.getAttribute('data-name') || '';
            
            // Prüfe, ob der Name mit der Suchanfrage beginnt
            if (optionName.startsWith(lowerSearchQuery)) {
                bestMatch = option;
                break; // Nehme den ersten Treffer, der mit der Suchanfrage beginnt
            }
        }
        
        // Falls kein Treffer gefunden, suche nach Teiltreffern
        if (!bestMatch) {
            for (const option of options) {
                const optionName = option.getAttribute('data-name') || '';
                
                if (optionName.includes(lowerSearchQuery)) {
                    bestMatch = option;
                    break;
                }
            }
        }
        
        if (bestMatch) {
            // Scrolle zum besten Treffer und hebe ihn hervor
            this.uiBuilder.highlightOption(bestMatch, optionsContainer);
            
            // Scrolle zu dieser Option
            optionsContainer.scrollTop = bestMatch.offsetTop - optionsContainer.offsetTop - 50;
        }
    }

    /**
     * Erstellt die Team-Slots
     */
    createTeamSlots() {
        // Leere den Container
        this.teamContainer.innerHTML = '';
        
        // Erstelle die initiale Anzahl an Slots
        for (let i = 0; i < this.INITIAL_SLOT_COUNT; i++) {
            this.addNewSlot();
        }
    }

    /**
     * Fügt einen neuen Slot hinzu
     */
    addNewSlot() {
        if (this.currentSlotCount >= this.MAX_SLOTS) {
            console.log("Maximale Anzahl an Slots erreicht");
            return; // Maximale Anzahl erreicht
        }
        
        // Speichere den aktuellen Slot-Index vor dem Inkrementieren
        const currentIndex = this.currentSlotCount;
        
        const slot = this.uiBuilder.createPokemonSlot(currentIndex);
        this.teamContainer.appendChild(slot);
    
        // Kopiere die Optionen des ersten Slots in den neuen Slot
        const firstOptionsContainer = document.getElementById('pokemon-options-0');
        const newOptionsContainer = document.getElementById(`pokemon-options-${currentIndex}`);
        
        // Kopiere den Inhalt des ersten Dropdowns
        if (firstOptionsContainer && newOptionsContainer) {
            newOptionsContainer.innerHTML = firstOptionsContainer.innerHTML;
            
            // Erneuere die Event-Listener für die kopierten Optionen
            const options = newOptionsContainer.querySelectorAll('.custom-select-option');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    const pokemonId = option.getAttribute('data-value');
                    const pokemonName = option.textContent;
                    const spriteUrl = option.querySelector('.option-sprite') ? 
                        option.querySelector('.option-sprite').src : null;
                    
                    // Verwende den gespeicherten Index statt this.currentSlotCount
                    this.selectPokemon(currentIndex, pokemonId, pokemonName, spriteUrl);
                    this.closeAllDropdowns();
                    
                    if (pokemonId) {
                        const pokemon = this.pokemonService.getPokemonById(Number(pokemonId));
                        this.displayPokemonDetails(currentIndex, pokemon);
                    }
                });
            });
        }
        
        // Event-Listener für EXP Gain einrichten
        this.setupExpGainEventListeners(currentIndex);
        
        // Inkrementiere den Zähler erst nach dem Einrichten aller Event-Listener
        this.currentSlotCount++;
        
        // Scrolle zum neuen Slot
        setTimeout(() => {
            this.teamContainer.scrollTo({
                left: this.teamContainer.scrollWidth,
                behavior: 'smooth'
            });
            
            // Initialisiere Tooltip-Positionierung für den neuen Slot
            this.initializeTooltipPositioning();
        }, 100);
    }

    /**
     * Entfernt alle leeren Slots am rechten Rand, behält aber mindestens einen leeren Slot insgesamt
     */
    removeEmptySlotsIfNeeded() {
        // Wenn wir nur einen Slot haben, machen wir nichts
        if (this.currentSlotCount <= 1) return;
        
        // Finde den letzten nicht-leeren Slot
        let lastNonEmptySlotIndex = -1;
        for (let i = this.currentSlotCount - 1; i >= 0; i--) {
            const slot = document.getElementById(`pokemon-select-${i}`);
            if (slot && slot.getAttribute('data-value')) {
                lastNonEmptySlotIndex = i;
                break;
            }
        }
        
        // Wenn wir keinen nicht-leeren Slot gefunden haben, behalte nur den ersten Slot
        if (lastNonEmptySlotIndex === -1) {
            // Entferne alle Slots bis auf den ersten
            while (this.currentSlotCount > 1) {
                const slotElement = document.querySelector(`.pokemon-slot:nth-child(${this.currentSlotCount})`);
                if (slotElement) {
                    this.teamContainer.removeChild(slotElement);
                    this.currentSlotCount--;
                }
            }
            return;
        }
        
        // Zähle, wie viele leere Slots wir insgesamt haben
        let emptySlotCount = 0;
        for (let i = 0; i < this.currentSlotCount; i++) {
            const slot = document.getElementById(`pokemon-select-${i}`);
            if (slot && !slot.getAttribute('data-value')) {
                emptySlotCount++;
            }
        }
        
        // Behalte mindestens einen leeren Slot (für neue Einträge)
        const minEmptySlots = 1;
        
        // Entferne überzählige leere Slots am Ende
        while (this.currentSlotCount > lastNonEmptySlotIndex + 1 + minEmptySlots && emptySlotCount > minEmptySlots) {
            const slotElement = document.querySelector(`.pokemon-slot:nth-child(${this.currentSlotCount})`);
            if (slotElement) {
                this.teamContainer.removeChild(slotElement);
                this.currentSlotCount--;
                emptySlotCount--;
            }
        }
    }

    /**
     * Leert einen Slot
     * @param {number} slot - Slot-Index
     */
    clearSlot(slot) {
        // Setze den Slot zurück
        this.selectPokemon(slot, '', 'Wähle ein Pokémon');
        this.displayPokemonDetails(slot, null);
        
        // EXP-Gain auf 0 zurücksetzen
        const expGainInput = document.getElementById(`exp-gain-${slot}`);
        const originalExpInput = document.getElementById(`exp-gain-original-${slot}`);
        if (expGainInput && originalExpInput) {
            expGainInput.value = '0';
            originalExpInput.value = '0';
        }
        
        // Schließe alle geöffneten Dropdowns
        this.closeAllDropdowns();
    }


    /**
     * Befüllt alle Dropdown-Menüs mit Pokémon
     * @param {Array} pokemonList - Sortierte Liste der Pokémon
     */
    populateDropdowns(pokemonList) {
        // Befülle ALLE existierenden Slots
        for (let slotIndex = 0; slotIndex < this.currentSlotCount; slotIndex++) {
            const optionsContainer = document.getElementById(`pokemon-options-${slotIndex}`);
            
            // Prüfe, ob das Container-Element existiert
            if (!optionsContainer) {
                console.error(`Container für Slot ${slotIndex} nicht gefunden`);
                continue;
            }
            
            // Leere den Container zuerst
            optionsContainer.innerHTML = '';
            
            // Leere Option hinzufügen
            const emptyOption = createElement('div', { 
                class: 'custom-select-option', 
                'data-value': '' 
            });
            emptyOption.textContent = 'Wähle ein Pokémon';
            optionsContainer.appendChild(emptyOption);
            
            // Klick-Handler für die leere Option
            emptyOption.addEventListener('click', () => {
                this.selectPokemon(slotIndex, '', 'Wähle ein Pokémon');
                this.closeAllDropdowns();
                this.displayPokemonDetails(slotIndex, null);
            });
            
            // Füge Pokémon-Optionen hinzu
            pokemonList.forEach(pokemon => {
                const option = this.uiBuilder.createPokemonOption(pokemon, slotIndex);
                optionsContainer.appendChild(option);
            });
        }
    }

    /**
     * Durchsucht das Dropdown-Menü nach Pokémon, die mit der Suchanfrage übereinstimmen
     * @param {number} slotIndex - Index des Slots/Dropdowns
     */
    searchInDropdown(slotIndex) {
        const optionsContainer = document.getElementById(`pokemon-options-${slotIndex}`);
        const options = optionsContainer.querySelectorAll('.custom-select-option[data-value]:not([data-value=""])');
        
        if (this.searchQuery === '') {
            // Wenn die Suchanfrage leer ist, hebe die erste Option hervor (für Enter-Auswahl)
            const firstOption = optionsContainer.querySelector('.custom-select-option[data-value]:not([data-value=""])');
            if (firstOption) {
                this.uiBuilder.highlightOption(firstOption, optionsContainer);
            }
            return;
        }
        
        // Suche nach dem ersten passenden Pokémon
        let bestMatch = null;
        const lowerSearchQuery = this.searchQuery.toLowerCase();
        
        // Durchlaufe alle Optionen, um das beste Match zu finden
        for (const option of options) {
            const optionName = option.getAttribute('data-name') || '';
            
            // Prüfe, ob der Name mit der Suchanfrage beginnt
            if (optionName.startsWith(lowerSearchQuery)) {
                bestMatch = option;
                break; // Nehme den ersten Treffer, der mit der Suchanfrage beginnt
            }
        }
        
        // Falls kein Treffer gefunden, suche nach Teiltreffern
        if (!bestMatch) {
            for (const option of options) {
                const optionName = option.getAttribute('data-name') || '';
                
                if (optionName.includes(lowerSearchQuery)) {
                    bestMatch = option;
                    break;
                }
            }
        }
        
        if (bestMatch) {
            // Scrolle zum besten Treffer und hebe ihn hervor
            this.uiBuilder.highlightOption(bestMatch, optionsContainer);
        }
    }

    /**
     * Dropdown öffnen/schließen
     * @param {number} index - Slot-Index
     */
    toggleDropdown(index) {
        const optionsContainer = document.getElementById(`pokemon-options-${index}`);
        const pokemonSelectElement = document.getElementById(`pokemon-select-${index}`);
        const containerElement = pokemonSelectElement.parentElement;
        
        // Schließe alle anderen Dropdowns
        this.closeAllDropdowns();
        
        // Toggle des aktuellen Dropdowns
        if (optionsContainer.style.display === 'block') {
          optionsContainer.style.display = 'none';
          this.activeDropdown = null;
          this.searchQuery = ''; // Suchanfrage zurücksetzen
        } else {
          optionsContainer.style.display = 'block';
          this.activeDropdown = index;
          
          // Positioniere das Dropdown je nach Position im Viewport
          positionDropdown(optionsContainer, containerElement);
          
          // Scrollposition anpassen
          const selectedPokemonId = pokemonSelectElement.getAttribute('data-value');
          if (selectedPokemonId) {
            const selectedOption = optionsContainer.querySelector(`[data-value="${selectedPokemonId}"]`);
            if (selectedOption) {
              optionsContainer.scrollTop = selectedOption.offsetTop - optionsContainer.offsetTop - 50;
              // Hervorhebe das aktuell ausgewählte Pokémon
              this.uiBuilder.highlightOption(selectedOption, optionsContainer);
            }
          } else {
            // Wenn kein Pokémon ausgewählt ist, hebe die erste Option hervor (für Enter-Auswahl)
            const firstPokemonOption = optionsContainer.querySelector('.custom-select-option[data-value]:not([data-value=""])');
            if (firstPokemonOption) {
              this.uiBuilder.highlightOption(firstPokemonOption, optionsContainer);
            }
          }
        }
      }

    /**
     * Setzt den ausgewählten Pokémon für einen Slot
     * Erweitert, um neue Slots hinzuzufügen oder leere zu entfernen
     */
    selectPokemon(slot, value, text, sprite = null) {
        const selectedElement = document.getElementById(`pokemon-select-${slot}`);
        const previousValue = selectedElement.getAttribute('data-value');
        selectedElement.setAttribute('data-value', value);
        
        // Inhalt leeren
        selectedElement.innerHTML = '';
        
        if (sprite) {
            // Sprite und Text anzeigen
            const spriteImg = createElement('img', {
                class: 'selected-sprite',
                src: sprite,
                alt: text
            });
            selectedElement.appendChild(spriteImg);
            
            const textSpan = createElement('span');
            textSpan.textContent = text;
            selectedElement.appendChild(textSpan);
            
            // Wenn wir den letzten Slot befüllt haben, füge einen neuen Slot hinzu
            if (slot === this.currentSlotCount - 1) {
                this.addNewSlot();
            }
        } else {
            // Nur Text anzeigen (leerer Slot)
            selectedElement.textContent = text;
            
            // Wenn ein Pokemon entfernt wurde, setze EXP-Gain auf 0 zurück
            if (previousValue && !value) {
                const expGainInput = document.getElementById(`exp-gain-${slot}`);
                const originalExpInput = document.getElementById(`exp-gain-original-${slot}`);
                if (expGainInput && originalExpInput) {
                    expGainInput.value = '0';
                    originalExpInput.value = '0';
                }
                
                // Prüfe, ob wir leere Slots reduzieren müssen
                this.removeEmptySlotsIfNeeded();
            }
        }
    }

    /**
     * Gibt den lokalisierten Namen eines Pokemon-Typs zurück
     * @param {string} typeName - Englischer Typ-Name
     * @returns {string} - Deutscher Typ-Name
     */
    getLocalizedTypeName(typeName) {
        const typeTranslations = {
            'normal': 'Normal',
            'fire': 'Feuer',
            'water': 'Wasser',
            'grass': 'Pflanze',
            'electric': 'Elektro',
            'ice': 'Eis',
            'fighting': 'Kampf',
            'poison': 'Gift',
            'ground': 'Boden',
            'flying': 'Flug',
            'psychic': 'Psycho',
            'bug': 'Käfer',
            'rock': 'Gestein',
            'ghost': 'Geist',
            'dragon': 'Drache',
            'dark': 'Unlicht',
            'steel': 'Stahl',
            'fairy': 'Fee'
        };
        
        return typeTranslations[typeName] || typeName;
    }
    
    /**
     * Berechnet das Standardlevel basierend auf dem BST
     * @param {number} bst - Base Stat Total des Pokémon
     * @returns {number} - Berechnetes Level (Minimum 5)
     */
    calculateDefaultLevel(bst) {
        // Formel: (BST - 300) * 0.2, Minimum 5
        const calculatedLevel = Math.round((bst - 300) * 0.2);
        return Math.max(5, calculatedLevel);
    }
    
    /**
     * Validiert die Level-Eingabe und stellt sicher, dass sie zwischen 1 und 100 liegt
     * @param {Event} event - Das Input-Event
     * @param {number} slot - Slot-Index
     */
    validateLevel(event, slot) {
        const input = event.target;
        const value = parseInt(input.value);
        
        // Speichere den aktuellen Wert als vorherigen Wert
        if (!input.hasAttribute('data-prev-value')) {
            input.setAttribute('data-prev-value', input.value);
        }
        
        // Überprüfe, ob der Wert eine Zahl zwischen 1 und 100 ist
        if (isNaN(value) || value < 1 || value > 100) {
            // Wenn ungültig, stelle den vorherigen Wert wieder her
            input.value = input.getAttribute('data-prev-value');
        } else {
            // Wenn gültig, aktualisiere den vorherigen Wert
            input.setAttribute('data-prev-value', value);
        }
    }
    
    /**
     * Aktualisiert die Anzeige der Statuswerte für ein Pokémon
     * @param {number} slot - Slot-Index
     * @param {Object} pokemonData - Pokémon-Daten
     * @param {number} level - Level des Pokémon
     */
    updatePokemonStats(slot, pokemonData, level) {
        const statsContainer = document.getElementById(`pokemon-stats-${slot}`);
        
        // Leere den Container
        statsContainer.innerHTML = '';
        
        // Berechne die Statuswerte
        const stats = this.statCalculator.calculatePokemonStats(pokemonData, level);
        if (!stats) return;
        
        // Erstelle die Statusanzeige
        this.uiBuilder.createStatsDisplay(statsContainer, stats, slot);
        
        // Zeige den Stats-Container an
        statsContainer.classList.remove('hidden');
    }


    /**
     * Generiert ein zufälliges Moveset für ein Pokémon
     * @param {number} slot - Slot-Index des Pokémon
     * @param {Object} pokemonData - Die Pokémon-Daten
     */
    assignRandomMoves(slot, pokemonData) {
        if (!pokemonData || !pokemonData.moves) return;
        
        // Hole die Level des Pokémon
        const level = parseInt(document.getElementById(`pokemon-level-${slot}`).value);
        
        // Hole kategorisierte Attacken
        const categorizedMoves = this.moveService.categorizeMoves(pokemonData);
        
        // Leere Array für die ausgewählten Attacken
        const selectedMoves = [];
        
        // Versuche eine Zucht-Attacke zuzuweisen (25% Chance)
        if (categorizedMoves.eggMoves.length > 0 && Math.random() < 0.25) {
            const randomEggMove = categorizedMoves.eggMoves[Math.floor(Math.random() * categorizedMoves.eggMoves.length)];
            selectedMoves.push(randomEggMove);
        }
        
        // Versuche eine TM/VM-Attacke zuzuweisen (50% Chance)
        let hasTmMove = false;
        if (categorizedMoves.tmMoves.length > 0 && Math.random() < 0.5) {
            const randomTmMove = categorizedMoves.tmMoves[Math.floor(Math.random() * categorizedMoves.tmMoves.length)];
            selectedMoves.push(randomTmMove);
            hasTmMove = true;
        }
        
        // Wenn keine Zucht-Attacke, aber eine TM-Attacke vorhanden ist, versuche eine zweite TM-Attacke (25% Chance)
        if (hasTmMove && selectedMoves.length < 2 && categorizedMoves.eggMoves.length === 0 && 
            categorizedMoves.tmMoves.length > 1 && Math.random() < 0.25) {
            // Finde eine TM-Attacke, die noch nicht ausgewählt wurde
            const availableTmMoves = categorizedMoves.tmMoves.filter(move => 
                !selectedMoves.some(selectedMove => selectedMove.id === move.id));
            
            if (availableTmMoves.length > 0) {
                const randomTmMove = availableTmMoves[Math.floor(Math.random() * availableTmMoves.length)];
                selectedMoves.push(randomTmMove);
            }
        }
        
        // Versuche eine "Andere"-Attacke zuzuweisen (10% Chance)
        // Die "Andere"-Kategorie sollte alle verbleibenden Attacken enthalten, die in keiner anderen Kategorie sind
        const uniqueOtherMoves = this.getUniqueOtherMoves(categorizedMoves);
        
        if (uniqueOtherMoves.length > 0 && Math.random() < 0.1) {
            const randomOtherMove = uniqueOtherMoves[Math.floor(Math.random() * uniqueOtherMoves.length)];
            selectedMoves.push(randomOtherMove);
        }
        
        // Filtere Level-Up Attacken, die bis zum aktuellen Level erlernt werden können
        const availableLevelMoves = categorizedMoves.levelUpMoves.filter(move => move.levelLearned <= level);
        
        // Fülle die verbleibenden Slots mit Level-Up Attacken
        while (selectedMoves.length < 4 && availableLevelMoves.length > 0) {
            // Finde eine Level-Up Attacke, die noch nicht ausgewählt wurde
            const unusedLevelMoves = availableLevelMoves.filter(move => 
                !selectedMoves.some(selectedMove => selectedMove.id === move.id));
            
            if (unusedLevelMoves.length === 0) break;
            
            const randomLevelMove = unusedLevelMoves[Math.floor(Math.random() * unusedLevelMoves.length)];
            selectedMoves.push(randomLevelMove);
        }
        
        // Wenn immer noch Plätze frei sind, versuche mit anderen Attackenkategorien aufzufüllen
        const allRemainingMoves = [
            ...categorizedMoves.eggMoves,
            ...categorizedMoves.tmMoves,
            ...categorizedMoves.sameTypeMoves,
            ...this.getUniqueOtherMoves(categorizedMoves) // Verwende die eindeutigen "Andere"-Attacken
        ].filter(move => !selectedMoves.some(selectedMove => selectedMove.id === move.id));
        
        // Mische die verbleibenden Attacken
        const shuffledRemainingMoves = this.shuffleArray(allRemainingMoves);
        
        // Fülle bis zu 4 Attacken auf
        while (selectedMoves.length < 4 && shuffledRemainingMoves.length > 0) {
            selectedMoves.push(shuffledRemainingMoves.pop());
        }
        
        // Zeige die ausgewählten Attacken an
        for (let i = 0; i < 4; i++) {
            const moveData = i < selectedMoves.length ? selectedMoves[i] : null;
            if (moveData) {
                this.selectMove(slot, i, moveData.id, moveData.germanName, moveData.type);
            } else {
                this.selectMove(slot, i, '', 'Wähle eine Attacke');
            }
        }
    }

    /**
     * Sammelt alle eindeutigen Attacken für die "Andere"-Kategorie
     * @param {Object} categorizedMoves - Die kategorisierten Attacken
     * @returns {Array} - Liste aller eindeutigen Attacken für "Andere"
     */
    getUniqueOtherMoves(categorizedMoves) {
        // Sammle alle IDs von Attacken, die bereits in anderen Kategorien sind
        const existingMoveIds = new Set();
        
        // Füge alle Attacken aus Level-Up, Zucht, TM/VM und gleichem Typ hinzu
        categorizedMoves.levelUpMoves.forEach(move => existingMoveIds.add(move.id));
        categorizedMoves.eggMoves.forEach(move => existingMoveIds.add(move.id));
        categorizedMoves.tmMoves.forEach(move => existingMoveIds.add(move.id));
        categorizedMoves.sameTypeMoves.forEach(move => existingMoveIds.add(move.id));
        
        // Filtere aus otherMoves nur die heraus, die in keiner anderen Kategorie sind
        return categorizedMoves.otherMoves.filter(move => !existingMoveIds.has(move.id));
    }

    /**
     * Hilfsfunktion zum Mischen eines Arrays
     * @param {Array} array - Das zu mischende Array
     * @returns {Array} - Das gemischte Array
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * Zeigt die Details eines Pokémon in einem Slot an
     * Diese Methode muss erweitert werden, um den Moves-Container zu aktualisieren
     */
    displayPokemonDetails(slot, pokemonData) {
        const imageContainer = document.getElementById(`pokemon-image-${slot}`);
        const nameContainer = document.getElementById(`pokemon-name-${slot}`);
        const diceContainer = document.getElementById(`pokemon-dice-${slot}`);
        const levelInput = document.getElementById(`pokemon-level-${slot}`);
        const levelContainer = levelInput.parentNode; // Der Level-Container
        const statsContainer = document.getElementById(`pokemon-stats-${slot}`);
        const typesContainer = document.getElementById(`pokemon-types-${slot}`);
        const movesContainer = document.getElementById(`pokemon-moves-${slot}`); // Container für Attacken
        const newMovesetButton = document.getElementById(`new-moveset-${slot}`); // Button für neues Moveset
        const abilitiesContainer = document.getElementById(`pokemon-abilities-${slot}`); // Container für Fähigkeiten
        
        // Leere alle Container
        imageContainer.innerHTML = '';
        nameContainer.innerHTML = '';
        diceContainer.innerHTML = '';
        statsContainer.innerHTML = '';
        typesContainer.innerHTML = '';
        
        // Setze alle Attacken zurück auf "Wähle eine Attacke"
        if (movesContainer) {
            for (let i = 0; i < 4; i++) {
                const moveElement = document.getElementById(`move-select-${slot}-${i}`);
                if (moveElement) {
                    moveElement.setAttribute('data-value', '');
                    moveElement.textContent = 'Wähle eine Attacke';
                }
            }
        }
        
        // Leere den Fähigkeiten-Container, falls er existiert
        if (abilitiesContainer) {
            const abilitiesList = abilitiesContainer.querySelector('.abilities-list');
            if (abilitiesList) {
                abilitiesList.innerHTML = '';
            }
        }
        
        if (!pokemonData) {
            // Setze Level-Input zurück und blende ihn aus
            levelInput.value = '5';
            levelInput.setAttribute('data-prev-value', '5');
            levelContainer.classList.add('hidden');
            statsContainer.classList.add('hidden');
            
            // Blende auch den Attacken-Container aus
            if (movesContainer) {
                movesContainer.classList.add('hidden');
            }
            
            // Blende auch den Fähigkeiten-Container aus
            if (abilitiesContainer) {
                abilitiesContainer.classList.add('hidden');
            }
            
            // Deaktiviere den "Neues Moveset" Button
            if (newMovesetButton) {
                newMovesetButton.classList.add('disabled');
            }
            return;
        }
        
        // Bild anzeigen
        const img = createElement('img', { 
            src: pokemonData.sprites.front_default,
            alt: pokemonData.name
        });
        imageContainer.appendChild(img);
        
        // Typen anzeigen
        if (pokemonData.types && pokemonData.types.length > 0) {
            pokemonData.types.forEach(typeInfo => {
                const typeName = typeInfo.type.name;
                const typeElement = createElement('div', {
                    class: `type-badge type-${typeName}`
                });
                typeElement.textContent = this.getLocalizedTypeName(typeName);
                typesContainer.appendChild(typeElement);
            });
        }
        
        // Name anzeigen - GEÄNDERT: Nur den Namen anzeigen, keine Nummer
        const name = document.createElement('span');
        name.textContent = pokemonData.germanName || pokemonData.name;
        nameContainer.appendChild(name);
        
        // Diese Zeilen entfernen, um die Pokémon-Nummer zu entfernen
        // const number = createElement('div', { class: 'pokemon-number' });
        // number.textContent = `#${String(pokemonData.id).padStart(4, '0')}`;
        // nameContainer.appendChild(number);
        
        // Würfel anzeigen - Anpassungen für kompaktes Layout
        const diceInfo = DiceCalculator.determineDiceType(pokemonData);
        if (diceInfo) {
            const diceElement = createElement('div', { 
                class: `dice dice-tooltip ${diceInfo.isLegendaryOrMythical ? 'legendary' : ''}`,
                'data-tooltip': diceInfo.tooltipText
            });
            diceElement.textContent = diceInfo.diceType;
            diceContainer.appendChild(diceElement);
        }
        
        // Level berechnen und setzen
        const defaultLevel = this.calculateDefaultLevel(pokemonData.baseStatTotal);
        levelInput.value = defaultLevel;
        levelInput.setAttribute('data-prev-value', defaultLevel);
        
        // Level-Container einblenden
        levelContainer.classList.remove('hidden');
        
        // Statuswerte aktualisieren und anzeigen
        this.updatePokemonStats(slot, pokemonData, defaultLevel);
        
        // Zeige den Attacken-Container an
        if (movesContainer) {
            movesContainer.classList.remove('hidden');
        }
        
        // Aktiviere den "Neues Moveset" Button
        if (newMovesetButton) {
            newMovesetButton.classList.remove('disabled');
        }
        
        // Weise automatisch zufällige Attacken zu
        this.assignRandomMoves(slot, pokemonData);
    
        // EXP-Gain anzeigen
        this.updateExpGain(slot, pokemonData, defaultLevel);
        
        // NEU: Zeige die Fähigkeiten an
        this.displayPokemonAbilities(slot, pokemonData);
        
        // Nachdem die Details angezeigt wurden, initialisiere die Tooltip-Positionierung
        // aber nur, wenn displayPokemonDetails mit einem gültigen pokemonData aufgerufen wird
        if (pokemonData) {
            this.initializeTooltipPositioning();
        }
    }

    /**
     * Zeigt die Fähigkeiten eines Pokémon an, indem die getAbilities-Funktion aus abilityService.js verwendet wird
     * @param {number} slot - Slot-Index
     * @param {Object} pokemonData - Pokémon-Daten
     */
    displayPokemonAbilities(slot, pokemonData) {
        if (!pokemonData) return;
        
        // Prüfe, ob der Fähigkeiten-Container existiert
        let abilitiesContainer = document.getElementById(`pokemon-abilities-${slot}`);
        
        // Falls nicht, erstelle ihn
        if (!abilitiesContainer) {
            abilitiesContainer = createElement('div', {
                class: 'pokemon-abilities-container',
                id: `pokemon-abilities-${slot}`
            });
            
            // Header mit Titel
            const abilitiesHeader = createElement('div', { class: 'abilities-header' });
            
            const abilitiesTitle = createElement('div', { class: 'abilities-title' });
            abilitiesTitle.textContent = 'Fähigkeiten';
            
            // Header zusammenbauen
            abilitiesHeader.appendChild(abilitiesTitle);
            
            // Container für die Fähigkeiten
            const abilitiesList = createElement('div', { 
                class: 'abilities-list',
                id: `abilities-list-${slot}`
            });
            
            abilitiesContainer.appendChild(abilitiesHeader);
            abilitiesContainer.appendChild(abilitiesList);
            
            // Füge den Container nach dem Moves-Container ein
            const movesContainer = document.getElementById(`pokemon-moves-${slot}`);
            if (movesContainer && movesContainer.parentNode) {
                movesContainer.parentNode.insertBefore(abilitiesContainer, movesContainer.nextSibling);
            }
        }
        
        // Zeige den Container an
        abilitiesContainer.classList.remove('hidden');
        
        // Hole die Liste der Fähigkeiten
        const abilitiesList = abilitiesContainer.querySelector('.abilities-list');
        if (!abilitiesList) return;
        
        // Leere die Liste
        abilitiesList.innerHTML = '';
        
        try {
            // Die direkte Verwendung der getAbilities-Funktion aus abilityService.js
            // Die Funktion nimmt eine Pokémon-ID entgegen und gibt ein Array mit drei Fähigkeiten zurück
            
            // Import der abilityService.js erfolgt über:
            // <script src="abilityService.js"></script> im HTML
            
            // Prüfe, ob die getAbilities-Funktion direkt verfügbar ist
            if (typeof getAbilities === 'function') {
                // Direkte Verwendung, falls die Funktion im globalen Scope verfügbar ist
                const abilities = getAbilities(pokemonData.id);
                displayAbilities(abilities);
            }
            // Alternativ, falls die Funktion als Teil eines Moduls exportiert wird
            else if (typeof abilityService !== 'undefined' && typeof abilityService.getAbilities === 'function') {
                // Verwendung über das Modul
                const abilities = abilityService.getAbilities(pokemonData.id);
                displayAbilities(abilities);
            }
            // Als weitere Alternative: Dynamisches Laden von abilityService.js
            else {
                console.warn("getAbilities-Funktion nicht gefunden, versuche abilityService.js zu laden...");
                
                // Hier könnten wir die abilityService.js dynamisch laden,
                // falls das in der Umgebung unterstützt wird
                
                // Fallback für den Test: Hartcodierte Fähigkeiten
                const fallbackAbilities = [
                    "Fähigkeit nicht verfügbar",
                    "Überprüfe abilityService.js",
                    "Leer"
                ];
                displayAbilities(fallbackAbilities);
            }
        } catch (error) {
            console.error('Fehler beim Anzeigen der Fähigkeiten:', error);
            
            // Zeige eine Fehlermeldung im Fähigkeiten-Container an
            const errorMessage = createElement('div', { 
                class: 'ability-badge error'
            });
            errorMessage.textContent = 'Fehler beim Laden der Fähigkeiten';
            abilitiesList.appendChild(errorMessage);
        }
        
        // Hilfsfunktion zum Anzeigen der Fähigkeiten
        function displayAbilities(abilities) {
            if (!abilities || !Array.isArray(abilities)) {
                console.error('Ungültige Fähigkeiten', abilities);
                return;
            }
            
            // Zeige die Fähigkeiten an
            abilities.forEach((ability, index) => {
                if (ability && ability !== 'Leer') {
                    const abilityBadge = createElement('div', { 
                        class: `ability-badge ${index === 0 ? 'primary' : index === 2 ? 'hidden' : ''}`,
                        title: ability // Hier könnten wir eine Beschreibung hinzufügen
                    });
                    abilityBadge.textContent = ability;
                    abilitiesList.appendChild(abilityBadge);
                }
            });
        }
    }

    /**
     * Aktualisiert den EXP-Gain-Wert für ein Pokémon
     * @param {number} slot - Slot-Index
     * @param {Object} pokemonData - Pokémon-Daten
     * @param {number} level - Level des Pokémon
     */
    updateExpGain(slot, pokemonData, level) {
        if (!pokemonData) return;
        
        const expGainInput = document.getElementById(`exp-gain-${slot}`);
        const originalExpInput = document.getElementById(`exp-gain-original-${slot}`);
        const expGainContainer = document.getElementById(`exp-gain-container-${slot}`);
        
        // Berechne den EXP-Gain
        const expGain = calculateExpGain(pokemonData, level);
        
        // Setze die Werte
        expGainInput.value = expGain;
        originalExpInput.value = expGain;
        
        // Zeige den Container an
        expGainContainer.classList.remove('hidden');
        
        // Deaktiviere alle Multiplikator-Buttons
        const buttons = expGainContainer.querySelectorAll('.exp-multiplier-button');
        buttons.forEach(button => {
            button.classList.remove('active');
        });

        // Aktualisiere die Team-EXP-Werte, wenn der TeamBuilder bereits initialisiert ist
        if (this.teamBuilder) {
            this.teamBuilder.updateAllExpGain();
        }
    }

    /**
     * Richtet Event-Listener für den EXP-Gain-Bereich ein
     * @param {number} pokemonIndex - Index des Pokémon-Slots
     */
    setupExpGainEventListeners(pokemonIndex) {
        const expGainInput = document.getElementById(`exp-gain-${pokemonIndex}`);
        const originalExpInput = document.getElementById(`exp-gain-original-${pokemonIndex}`);
        const trainerButton = document.getElementById(`exp-trainer-${pokemonIndex}`);
        const arenaButton = document.getElementById(`exp-arena-${pokemonIndex}`);
        const bossButton = document.getElementById(`exp-boss-${pokemonIndex}`);
        
        if (!expGainInput || !originalExpInput) return; // Früher Abbruch, falls Elemente nicht gefunden werden
        
        // Event-Listener für die Exp-Gain-Eingabe
        expGainInput.addEventListener('change', (event) => {
            validateExpInput(event);
            // Aktualisiere den ursprünglichen Wert, wenn keine Multiplikatoren aktiv sind
            if (!trainerButton.classList.contains('active') && 
                !arenaButton.classList.contains('active') && 
                !bossButton.classList.contains('active')) {
                originalExpInput.value = expGainInput.value;
            }
        });
        
        // Event-Listener für die Multiplikator-Buttons
        const that = this; // Für den Zugriff auf this innerhalb der Closure

        // Funktion zum Einrichten der Multiplikator-Buttons
        function setupMultiplierButton(button, multiplier) {
            // Entferne zuerst alle bestehenden Event-Listener, um Duplikate zu vermeiden
            button.removeEventListener('click', button.clickHandler);
            
            // Definiere den Click-Handler und speichere ihn für späteren Zugriff
            button.clickHandler = () => {
                // Deaktiviere alle anderen Buttons
                [trainerButton, arenaButton, bossButton].forEach(btn => {
                    if (btn !== button && btn.classList.contains('active')) {
                        btn.classList.remove('active');
                    }
                });
                
                // Toggle den aktiven Status dieses Buttons
                if (button.classList.contains('active')) {
                    // Wenn bereits aktiv, deaktiviere und setze auf Originalwert zurück
                    button.classList.remove('active');
                    expGainInput.value = originalExpInput.value;
                } else {
                    // Wenn nicht aktiv, aktiviere und wende Multiplikator an
                    button.classList.add('active');
                    const originalValue = parseInt(originalExpInput.value);
                    expGainInput.value = Math.ceil(originalValue * multiplier);
                }
                
                // Aktualisiere die Team-EXP-Werte
                if (that.teamBuilder) {
                    that.teamBuilder.updateAllExpGain();
                }
            };
            
            // Füge den Event-Listener hinzu
            button.addEventListener('click', button.clickHandler);
        }
        
        setupMultiplierButton(trainerButton, 1.5);
        setupMultiplierButton(arenaButton, 2);
        setupMultiplierButton(bossButton, 3);
    }

    /**
     * Dupliziert ein Pokémon in den nächsten freien Slot
     * @param {number} sourceIndex - Index des zu duplizierenden Slots
     */
    duplicatePokemon(sourceIndex) {
        // Prüfe, ob das Quell-Pokémon existiert
        const sourcePokemonSelect = document.getElementById(`pokemon-select-${sourceIndex}`);
        if (!sourcePokemonSelect) return;
        
        const pokemonId = sourcePokemonSelect.getAttribute('data-value');
        if (!pokemonId) return; // Kein Pokémon ausgewählt
        
        // Suche den nächsten freien Slot
        let targetIndex = -1;
        for (let i = 0; i < this.currentSlotCount; i++) {
            const slot = document.getElementById(`pokemon-select-${i}`);
            if (slot && !slot.getAttribute('data-value')) {
                targetIndex = i;
                break;
            }
        }
        
        // Wenn kein freier Slot gefunden wurde, nehme den letzten Slot
        // und füge danach einen neuen Slot hinzu
        if (targetIndex === -1) {
            targetIndex = this.currentSlotCount - 1;
        }
        
        // Hole die Pokémon-Daten
        const pokemon = this.pokemonService.getPokemonById(Number(pokemonId));
        if (!pokemon) return;
        
        // Hole den aktuellen Level und EXP-Gain des Quell-Pokémon
        const sourceLevel = document.getElementById(`pokemon-level-${sourceIndex}`).value;
        const sourceExpGain = document.getElementById(`exp-gain-${sourceIndex}`).value;
        const sourceOriginalExp = document.getElementById(`exp-gain-original-${sourceIndex}`).value;
        
        // Setze EXP-Multiplikatoren-Zustand
        const sourceTrainerButton = document.getElementById(`exp-trainer-${sourceIndex}`);
        const sourceArenaButton = document.getElementById(`exp-arena-${sourceIndex}`);
        const sourceBossButton = document.getElementById(`exp-boss-${sourceIndex}`);
        
        const trainerActive = sourceTrainerButton.classList.contains('active');
        const arenaActive = sourceArenaButton.classList.contains('active');
        const bossActive = sourceBossButton.classList.contains('active');
        
        // Hole die Attacken des Quell-Pokémon
        const sourceMoves = [];
        for (let i = 0; i < 4; i++) {
            const moveSelect = document.getElementById(`move-select-${sourceIndex}-${i}`);
            if (moveSelect) {
                sourceMoves.push({
                    id: moveSelect.getAttribute('data-value'),
                    name: moveSelect.textContent.trim()
                });
            }
        }
        
        // Wähle das Pokémon im Ziel-Slot aus
        const pokemonName = pokemon.germanName || pokemon.name;
        this.selectPokemon(targetIndex, pokemon.id, `#${pokemon.id} ${pokemonName}`, pokemon.sprites.front_default);
        this.displayPokemonDetails(targetIndex, pokemon);
        
        // Setze den Level des Ziel-Pokémon
        const targetLevelInput = document.getElementById(`pokemon-level-${targetIndex}`);
        if (targetLevelInput) {
            targetLevelInput.value = sourceLevel;
            targetLevelInput.setAttribute('data-prev-value', sourceLevel);
            
            // Aktualisiere die Stats mit dem neuen Level
            this.updatePokemonStats(targetIndex, pokemon, parseInt(sourceLevel));
        }
        
        // Setze den EXP-Gain des Ziel-Pokémon
        const targetExpGain = document.getElementById(`exp-gain-${targetIndex}`);
        const targetOriginalExp = document.getElementById(`exp-gain-original-${targetIndex}`);
        if (targetExpGain && targetOriginalExp) {
            targetExpGain.value = sourceExpGain;
            targetOriginalExp.value = sourceOriginalExp;
        }
        
        // Setze die EXP-Multiplikatoren-Zustände
        const targetTrainerButton = document.getElementById(`exp-trainer-${targetIndex}`);
        const targetArenaButton = document.getElementById(`exp-arena-${targetIndex}`);
        const targetBossButton = document.getElementById(`exp-boss-${targetIndex}`);
        
        if (trainerActive && targetTrainerButton) targetTrainerButton.classList.add('active');
        if (arenaActive && targetArenaButton) targetArenaButton.classList.add('active');
        if (bossActive && targetBossButton) targetBossButton.classList.add('active');
        
        // Setze die Attacken des Ziel-Pokémon
        for (let i = 0; i < 4; i++) {
            if (i < sourceMoves.length && sourceMoves[i].id) {
                const moveData = this.moveService.getMoveById(sourceMoves[i].id);
                if (moveData) {
                    this.selectMove(targetIndex, i, moveData.id, moveData.germanName || moveData.name, moveData.type ? moveData.type.name : null);
                }
            }
        }
        
        // Wenn der letzte Slot verwendet wurde, füge einen neuen Slot hinzu
        if (targetIndex === this.currentSlotCount - 1) {
            this.addNewSlot();
        }
        
        // Aktualisiere die Team-EXP-Werte
        if (this.teamBuilder) {
            this.teamBuilder.updateAllExpGain();
        }
        
        // Scrolle zum duplizierten Pokémon
        setTimeout(() => {
            const targetSlot = document.querySelector(`.pokemon-slot:nth-child(${targetIndex + 1})`);
            if (targetSlot) {
                targetSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    }

    /**
     * Verteilt die Statuswerte eines Pokémon zufällig neu
     * @param {number} pokemonIndex - Index des Slots
     */
    randomizeStats(pokemonIndex) {
        // Prüfe, ob das Pokémon existiert
        const pokemonSelect = document.getElementById(`pokemon-select-${pokemonIndex}`);
        if (!pokemonSelect) return;
        
        const pokemonId = pokemonSelect.getAttribute('data-value');
        if (!pokemonId) return; // Kein Pokémon ausgewählt
        
        // Hole alle Statuswerte
        const hpInput = document.getElementById(`hp-${pokemonIndex}`);
        const attackInput = document.getElementById(`attack-${pokemonIndex}`);
        const defenseInput = document.getElementById(`defense-${pokemonIndex}`);
        const specialAttackInput = document.getElementById(`specialAttack-${pokemonIndex}`);
        const specialDefenseInput = document.getElementById(`specialDefense-${pokemonIndex}`);
        const speedInput = document.getElementById(`speed-${pokemonIndex}`);
        
        // Prüfe, ob alle Inputs existieren
        if (!hpInput || !attackInput || !defenseInput || !specialAttackInput || !specialDefenseInput || !speedInput) {
            console.error('Statusfelder nicht gefunden');
            return;
        }
        
        // Aktuelle Werte auslesen
        const currentHP = parseInt(hpInput.value) || 0;
        const currentAttack = parseInt(attackInput.value) || 0;
        const currentDefense = parseInt(defenseInput.value) || 0;
        const currentSpecialAttack = parseInt(specialAttackInput.value) || 0;
        const currentSpecialDefense = parseInt(specialDefenseInput.value) || 0;
        const currentSpeed = parseInt(speedInput.value) || 0;
        
        // Berechne die Gesamtsumme der Statuswerte gemäß der Formel
        // ANG + VERT + SP ANG + SP VERT + (2 * INIT) + (KP / 3)
        const hpContribution = Math.ceil(currentHP / 3);
        const totalStatPoints = currentAttack + currentDefense + currentSpecialAttack + 
                            currentSpecialDefense + (2 * currentSpeed) + hpContribution;
        
        console.log(`Gesamtpunkte: ${totalStatPoints} (inkl. ${hpContribution} von KP)`);
        
        // Zufällige Verteilung der Punkte auf die Werte
        // Wir benötigen 5 Trennpunkte für 6 Werte
        const separators = [];
        for (let i = 0; i < 5; i++) {
            // Zufallswert zwischen 1 und (totalStatPoints - 1)
            const randomPoint = Math.floor(Math.random() * (totalStatPoints - 1)) + 1;
            separators.push(randomPoint);
        }
        
        // Sortiere die Trennpunkte
        separators.sort((a, b) => a - b);
        
        // Berechne die neuen Werte basierend auf den Trennpunkten
        const newAttack = separators[0];
        const newDefense = separators[1] - separators[0];
        const newSpecialAttack = separators[2] - separators[1];
        const newSpecialDefense = separators[3] - separators[2];
        const newSpeed = Math.ceil((separators[4] - separators[3]) / 2); // INIT wird halbiert (aufgerundet)
        const newHP = Math.ceil((totalStatPoints - separators[4]) * 3); // KP wird verdreifacht
        
        console.log(`Neue Werte - ANG: ${newAttack}, VERT: ${newDefense}, ` +
                `SP ANG: ${newSpecialAttack}, SP VERT: ${newSpecialDefense}, ` +
                `INIT: ${newSpeed}, KP: ${newHP}`);
        
        // Setze die neuen Werte in die Inputs
        hpInput.value = newHP;
        attackInput.value = newAttack;
        defenseInput.value = newDefense;
        specialAttackInput.value = newSpecialAttack;
        specialDefenseInput.value = newSpecialDefense;
        speedInput.value = newSpeed;
        
        // Speichere die neuen Werte auch als vorherige Werte für die Validierung
        hpInput.setAttribute('data-prev-value', newHP);
        attackInput.setAttribute('data-prev-value', newAttack);
        defenseInput.setAttribute('data-prev-value', newDefense);
        specialAttackInput.setAttribute('data-prev-value', newSpecialAttack);
        specialDefenseInput.setAttribute('data-prev-value', newSpecialDefense);
        speedInput.setAttribute('data-prev-value', newSpeed);
        
        // Visuelles Feedback für den Benutzer
        const statsContainer = document.getElementById(`pokemon-stats-${pokemonIndex}`);
        if (statsContainer) {
            statsContainer.classList.add('stats-randomized');
            
            // Nach kurzer Zeit die Hervorhebung entfernen
            setTimeout(() => {
                statsContainer.classList.remove('stats-randomized');
            }, 1000);
        }
        
        // NEUE FUNKTIONALITÄT: Update der Initiative-Liste
        // Nach der Änderung der Stats (insbesondere INIT) aktualisieren wir die Initiative-Liste
        if (typeof updateInitiativeList === 'function') {
            updateInitiativeList(this);
        }
    }
}

// Starte die Anwendung, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    const app = new PokemonTeamBuilder();
    window.pokemonApp = app; // Mache das Objekt global verfügbar
    app.init();
});