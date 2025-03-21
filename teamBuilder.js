/**
 * Klasse zur Verwaltung des Team-Interfaces
 */
class TeamBuilder {
    /**
     * Konstruktor
     * @param {PokemonTeamBuilder} app - Referenz auf die Hauptanwendung
     */
    constructor(app) {
        this.app = app;
        this.teamContainer = null;
        this.teamPokemon = []; // Array für die ausgewählten Team-Pokémon
        this.TEAM_SIZE = 12; // 4x3 Pokémon
        this.DEFAULT_LEVEL = 10; // Standard-Level für Team-Pokémon
        
        // Neue Properties für die Suche
        this.activeTeamDropdown = null;
        this.teamSearchQuery = '';
        this.teamSearchTimeout = null;
    }

    /**
     * Initialisiert das Team-Interface
     */
    init() {
        // Container erstellen
        this.createTeamContainer();
        
        // Event-Listener für Aktualisierungen einrichten
        this.setupEventListeners();
    }

    /**
     * Erstellt den Container für das Team-Interface
     */
    createTeamContainer() {
        // Hole den sidebar-space Container
        const sidebarSpace = document.querySelector('.sidebar-space');
        if (!sidebarSpace) return;
        
        // Leere den Container
        sidebarSpace.innerHTML = '';
        
        // Erstelle den Titel
        const teamTitle = createElement('h2');
        teamTitle.textContent = 'Spieler-Pokémon';
        teamTitle.style.color = '#3b5ca8';
        teamTitle.style.borderBottom = '2px solid #3b5ca8';
        teamTitle.style.paddingBottom = '10px';
        teamTitle.style.marginBottom = '20px';
        
        // Erstelle den Team-Container
        this.teamContainer = createElement('div', { class: 'team-grid-container' });
        
        // Erstelle 3 Spalten mit je 3 Pokémon-Slots
        for (let row = 0; row < 4; row++) {
            const rowContainer = createElement('div', { class: 'team-row' });
            
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                const teamSlot = this.createTeamSlot(index);
                rowContainer.appendChild(teamSlot);
            }
            
            this.teamContainer.appendChild(rowContainer);
        }
        
        // Erstelle Team-Zusammenfassung
        const teamSummary = this.createTeamSummary();
        this.teamContainer.appendChild(teamSummary);
        
        // Füge CSS für das Team-Grid hinzu
        this.addTeamStyles();
        
        // Füge Elemente zum Sidebar-Space hinzu
        sidebarSpace.appendChild(teamTitle);
        sidebarSpace.appendChild(this.teamContainer);
    }
    
    /**
     * Erstellt die Team-Zusammenfassung
     * @returns {HTMLElement} - Element mit der Team-Zusammenfassung
     */
    createTeamSummary() {
        const summary = createElement('div', {
            class: 'team-summary',
            id: 'team-summary'
        });
        
        const title = createElement('div', { class: 'team-summary-title' });
        title.textContent = 'Team-Übersicht';
        
        const stats = createElement('div', { class: 'team-stats' });
        
        // Aktive Pokémon
        const activePokemon = createElement('div', { class: 'team-stat' });
        const activeValue = createElement('div', { 
            class: 'team-stat-value',
            id: 'team-active-count'
        });
        activeValue.textContent = '0';
        const activeLabel = createElement('div', { class: 'team-stat-label' });
        activeLabel.textContent = 'Aktive Pokémon';
        activePokemon.appendChild(activeValue);
        activePokemon.appendChild(activeLabel);
        
        // Durchschnittliches Level
        const avgLevel = createElement('div', { class: 'team-stat' });
        const avgLevelValue = createElement('div', { 
            class: 'team-stat-value',
            id: 'team-avg-level'
        });
        avgLevelValue.textContent = '-';
        const avgLevelLabel = createElement('div', { class: 'team-stat-label' });
        avgLevelLabel.textContent = 'Ø Level';
        avgLevel.appendChild(avgLevelValue);
        avgLevel.appendChild(avgLevelLabel);
        
        // Gesamt-EXP
        const totalExp = createElement('div', { class: 'team-stat' });
        const totalExpValue = createElement('div', { 
            class: 'team-stat-value',
            id: 'team-total-exp'
        });
        totalExpValue.textContent = '0';
        const totalExpLabel = createElement('div', { class: 'team-stat-label' });
        totalExpLabel.textContent = 'Gesamt-EXP';
        totalExp.appendChild(totalExpValue);
        totalExp.appendChild(totalExpLabel);
        
        // Alles zusammenfügen
        stats.appendChild(activePokemon);
        stats.appendChild(avgLevel);
        stats.appendChild(totalExp);
        
        summary.appendChild(title);
        summary.appendChild(stats);
        
        return summary;
    }

    /**
     * Erstellt einen einzelnen Team-Slot
     * @param {number} index - Index des Slots
     * @returns {HTMLElement} - Der erstellte Slot
     */
    createTeamSlot(index) {
        const slot = createElement('div', { class: 'team-slot', id: `team-slot-${index}` });
        
        // Erstelle benutzerdefinierten Dropdown für Pokémon
        const selectContainer = createElement('div', { 
            class: 'custom-select-container team-select-container',
            'data-team-slot': index
        });
        
        const selectSelected = createElement('div', { 
            class: 'custom-select-selected team-select-selected',
            id: `team-pokemon-select-${index}` 
        });
        selectSelected.textContent = 'Wähle ein Pokémon';
        
        const selectOptions = createElement('div', { 
            class: 'custom-select-options team-select-options',
            id: `team-pokemon-options-${index}`
        });
        
        selectContainer.appendChild(selectSelected);
        selectContainer.appendChild(selectOptions);
        
        // Event-Listener für das Öffnen/Schließen des Dropdowns
        selectSelected.addEventListener('click', () => this.toggleTeamDropdown(index));
        
        // Level- und INIT-Container (anfangs versteckt)
        const controlsContainer = createElement('div', { 
            class: 'team-controls-container hidden',
            id: `team-controls-container-${index}`
        });
        
        // Level-Steuerung
        const levelContainer = createElement('div', { class: 'team-level-container' });
        
        const levelLabel = createElement('div', { class: 'team-level-label' });
        levelLabel.textContent = 'Level:';
        
        const levelInput = createElement('input', { 
            type: 'text',
            class: 'team-level-input',
            id: `team-level-${index}`,
            value: this.DEFAULT_LEVEL
        });
        
        // Event-Listener für Level-Änderungen
        levelInput.addEventListener('change', (event) => {
            this.validateTeamLevel(event, index);
            this.updateAllExpGain();
        });
        
        levelContainer.appendChild(levelLabel);
        levelContainer.appendChild(levelInput);
        
        // INIT-Steuerung (neu)
        const initContainer = createElement('div', { class: 'team-init-container' });
        
        const initLabel = createElement('div', { class: 'team-init-label' });
        initLabel.textContent = 'INIT:';
        
        const initInput = createElement('input', { 
            type: 'text',
            class: 'team-init-input',
            id: `team-init-${index}`,
            value: '0',
            maxlength: '3'
        });
        
        // Event-Listener für INIT-Änderungen
        initInput.addEventListener('change', (event) => {
            this.validateTeamInit(event, index);
        });
        
        initContainer.appendChild(initLabel);
        initContainer.appendChild(initInput);
        
        // Füge Level und INIT zum Controls-Container hinzu
        controlsContainer.appendChild(levelContainer);
        controlsContainer.appendChild(initContainer);
        
        // EXP-Container (anfangs versteckt)
        const expContainer = createElement('div', { 
            class: 'team-exp-container hidden',
            id: `team-exp-container-${index}`
        });
        
        const expLabel = createElement('div', { class: 'team-exp-label' });
        expLabel.textContent = 'EXP für dieses Pokémon:';
        
        const expValue = createElement('div', { 
            class: 'team-exp-value',
            id: `team-exp-value-${index}`
        });
        expValue.textContent = '0';
        
        expContainer.appendChild(expLabel);
        expContainer.appendChild(expValue);
        
        // Füge alles zum Slot hinzu
        slot.appendChild(selectContainer);
        slot.appendChild(controlsContainer);
        slot.appendChild(expContainer);
        
        return slot;
    }

    /**
     * Validiert die INIT-Eingabe für Team-Pokémon
     * @param {Event} event - Das Input-Event
     * @param {number} index - Index des Team-Slots
     */
    validateTeamInit(event, index) {
        const input = event.target;
        const value = parseInt(input.value);
        
        // Speichere den aktuellen Wert als vorherigen Wert
        if (!input.hasAttribute('data-prev-value')) {
            input.setAttribute('data-prev-value', input.value || '0');
        }
        
        // Überprüfe, ob der Wert eine positive Zahl bis 999 ist
        if (isNaN(value) || value < 0 || value > 999) {
            // Wenn ungültig, stelle den vorherigen Wert wieder her
            input.value = input.getAttribute('data-prev-value');
        } else {
            // Wenn gültig, aktualisiere den vorherigen Wert
            input.setAttribute('data-prev-value', value);
        }
    }

    /**
     * Fügt CSS-Stile für das Team-Interface hinzu
     */
    addTeamStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .team-grid-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
                padding: 10px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .team-row {
                display: flex;
                gap: 10px;
            }
            
            .team-slot {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: #f9f9f9;
                transition: box-shadow 0.2s;
            }
            
            .team-slot:hover {
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            }
            
            .team-select-container {
                margin-bottom: 8px;
            }
            
            .team-select-selected {
                font-size: 13px;
                padding: 6px;
            }
            
            .team-select-options {
                max-height: 250px;
                z-index: 200; /* Höher als die anderen Dropdowns */
            }
            
            .team-level-container, .team-exp-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 8px;
                font-size: 12px;
                padding: 3px 0;
                border-top: 1px solid #eee;
            }
            
            .team-level-container.hidden, .team-exp-container.hidden {
                display: none;
            }
            
            .team-level-input {
                width: 40px;
                text-align: center;
                border: 1px solid #ccc;
                border-radius: 3px;
                padding: 2px;
            }
            
            .team-exp-value {
                font-weight: bold;
                color: #3b5ca8;
                padding: 2px 5px;
                border-radius: 3px;
            }
            
            /* EXP-Wert-Farben basierend auf dem Wert */
            .exp-very-low {
                color: #888;
            }
            
            .exp-low {
                color: #3b5ca8;
            }
            
            .exp-medium {
                color: #2a9d45;
                background-color: rgba(42, 157, 69, 0.1);
            }
            
            .exp-high {
                color: #d55e00;
                background-color: rgba(213, 94, 0, 0.1);
                font-weight: bold;
            }
            
            /* Team-Zusammenfassung */
            .team-summary {
                margin-top: 20px;
                padding: 10px;
                background-color: #f0f5ff;
                border-radius: 5px;
                font-size: 13px;
            }
            
            .team-summary-title {
                font-weight: bold;
                margin-bottom: 5px;
                color: #3b5ca8;
            }
            
            .team-stats {
                display: flex;
                justify-content: space-between;
            }
            
            .team-stat {
                text-align: center;
                flex: 1;
            }
            
            .team-stat-value {
                font-weight: bold;
                color: #3b5ca8;
                font-size: 14px;
            }
            
            .team-stat-label {
                font-size: 11px;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Richtet Event-Listener für Team-Updates ein
     */
    setupEventListeners() {
        // Event-Listener für Änderungen an den Pokémon-Slots (Hauptanwendung)
        const handleSlotChange = () => {
            this.updateAllExpGain();
        };
        
        // Beobachte Änderungen im Team-Container der Hauptanwendung
        const observer = new MutationObserver(handleSlotChange);
        observer.observe(this.app.teamContainer, { 
            childList: true, 
            subtree: true, 
            attributes: true,
            attributeFilter: ['data-value', 'value'] 
        });
        
        // Event-Listener für EXP-Gain Inputs und Level-Inputs der Hauptanwendung
        document.addEventListener('change', (event) => {
            if (event.target.id && 
                (event.target.id.startsWith('exp-gain-') || 
                 event.target.id.startsWith('pokemon-level-'))) {
                this.updateAllExpGain();
            }
        });
        
        // Event-Listener für Multiplikator-Button-Klicks
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('exp-multiplier-button')) {
                // Kurze Verzögerung, um den aktualisierten EXP-Gain-Wert zu nutzen
                setTimeout(() => this.updateAllExpGain(), 50);
            }
        });

         // Tastatur-Event-Listener für Team-Dropdown-Suche und Enter-Bestätigung
        document.addEventListener('keydown', (event) => {
            // Wenn ein Team-Dropdown aktiv ist
            if (this.activeTeamDropdown !== null) {
                if (event.key === 'Enter') {
                    this.handleTeamEnterKey(event);
                }
                else if (event.key === 'Delete' || event.key === 'Backspace') {
                    // Bei Delete/Backspace das Pokémon im aktuellen Team-Slot entfernen
                    if (event.target.tagName !== 'INPUT') {  // Nicht auslösen, wenn wir in einem Input-Feld sind
                        this.selectTeamPokemon(this.activeTeamDropdown, '', 'Wähle ein Pokémon');
                        this.closeAllTeamDropdowns();
                        event.preventDefault();
                    }
                }
                else if ((event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey)) {
                    // Nur für Tastaturbuchstaben und nicht für Steuerungstasten
                    if (event.target.tagName !== 'INPUT') {  // Nicht auslösen, wenn wir in einem Input-Feld sind
                        this.handleTeamSearchInput(event);
                    }
                }
            }
        });
        
        // Beobachte Änderungen in den Level-Inputs der Team-Pokémon
        for (let i = 0; i < this.TEAM_SIZE; i++) {
            const levelInput = document.getElementById(`team-level-${i}`);
            if (levelInput) {
                levelInput.addEventListener('input', () => {
                    // Aktualisiere bei jeder Eingabe (für Echtzeit-Feedback)
                    this.updateAllExpGain();
                });
            }
        }
    }

    /**
     * Togglet das Dropdown-Menü für Team-Pokémon
     * @param {number} index - Index des Team-Slots
     */
    toggleTeamDropdown(index) {
        const optionsContainer = document.getElementById(`team-pokemon-options-${index}`);
        
        // Schließe alle Dropdowns
        this.closeAllTeamDropdowns();
        
        // Toggle des aktuellen Dropdowns
        if (optionsContainer.style.display === 'block') {
            optionsContainer.style.display = 'none';
            this.activeTeamDropdown = null;
            this.teamSearchQuery = ''; // Suchanfrage zurücksetzen
        } else {
            // Fülle das Dropdown mit Pokémon aus dem PokemonService
            this.populateTeamDropdown(index);
            
            optionsContainer.style.display = 'block';
            this.activeTeamDropdown = index;
            
            // Position des scrollbaren Bereichs anpassen, wenn ein Pokémon ausgewählt ist
            const selectedPokemonId = document.getElementById(`team-pokemon-select-${index}`).getAttribute('data-value');
            if (selectedPokemonId) {
                const selectedOption = optionsContainer.querySelector(`[data-value="${selectedPokemonId}"]`);
                if (selectedOption) {
                    optionsContainer.scrollTop = selectedOption.offsetTop - optionsContainer.offsetTop - 50;
                    // Hervorhebe das aktuell ausgewählte Pokémon
                    this.highlightTeamOption(selectedOption, optionsContainer);
                }
            } else {
                // Wenn kein Pokémon ausgewählt ist, hebe die erste Option hervor (für Enter-Auswahl)
                const firstPokemonOption = optionsContainer.querySelector('.custom-select-option[data-value]:not([data-value=""])');
                if (firstPokemonOption) {
                    this.highlightTeamOption(firstPokemonOption, optionsContainer);
                }
            }
        }
    }

    /**
     * Schließt alle Team-Dropdowns
     */
    closeAllTeamDropdowns() {
        const optionsContainers = document.querySelectorAll('.team-select-options');
        optionsContainers.forEach(container => {
            container.style.display = 'none';
        });
        this.activeTeamDropdown = null;
        this.teamSearchQuery = ''; // Suchanfrage zurücksetzen
    }

    highlightTeamOption(option, container) {
        // Entferne Hervorhebung von allen Optionen
        const allOptions = container.querySelectorAll('.custom-select-option');
        allOptions.forEach(opt => opt.classList.remove('highlighted'));
        
        // Füge Hervorhebung zur ausgewählten Option hinzu
        option.classList.add('highlighted');
        
        // Scrolle zur Option
        const containerRect = container.getBoundingClientRect();
        const optionRect = option.getBoundingClientRect();
        
        // Wenn die Option außerhalb des sichtbaren Bereichs ist, scrolle zu ihr
        if (optionRect.top < containerRect.top || optionRect.bottom > containerRect.bottom) {
            container.scrollTop = option.offsetTop - container.offsetTop - containerRect.height / 2 + optionRect.height / 2;
        }
    }

    searchInTeamDropdown(index) {
        const optionsContainer = document.getElementById(`team-pokemon-options-${index}`);
        const options = optionsContainer.querySelectorAll('.custom-select-option[data-value]:not([data-value=""])');
        
        if (this.teamSearchQuery === '') {
            // Wenn die Suchanfrage leer ist, hebe die erste Option hervor (für Enter-Auswahl)
            const firstOption = optionsContainer.querySelector('.custom-select-option[data-value]:not([data-value=""])');
            if (firstOption) {
                this.highlightTeamOption(firstOption, optionsContainer);
            }
            return;
        }
        
        // Suche nach dem ersten passenden Pokémon
        let bestMatch = null;
        const lowerSearchQuery = this.teamSearchQuery.toLowerCase();
        
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
            this.highlightTeamOption(bestMatch, optionsContainer);
            
            // Scrolle zu dieser Option
            optionsContainer.scrollTop = bestMatch.offsetTop - optionsContainer.offsetTop - 50;
        }
    }

    handleTeamSearchInput(event) {
        if (event.key === 'Backspace') {
            this.teamSearchQuery = this.teamSearchQuery.slice(0, -1);
        } else {
            this.teamSearchQuery += event.key.toLowerCase();
        }
        
        this.searchInTeamDropdown(this.activeTeamDropdown);
        
        clearTimeout(this.teamSearchTimeout);
        this.teamSearchTimeout = setTimeout(() => {
            this.teamSearchQuery = '';
        }, 1500);
    }

    handleTeamEnterKey(event) {
        const optionsContainer = document.getElementById(`team-pokemon-options-${this.activeTeamDropdown}`);
        const highlightedOption = optionsContainer.querySelector('.custom-select-option.highlighted');
        
        if (highlightedOption) {
            highlightedOption.click();
            event.preventDefault();
        }
    }

    /**
     * Befüllt ein Team-Dropdown mit Pokémon
     * @param {number} index - Index des Team-Slots
     */
    populateTeamDropdown(index) {
        const optionsContainer = document.getElementById(`team-pokemon-options-${index}`);
        
        // Leere den Container
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
            this.selectTeamPokemon(index, '', 'Wähle ein Pokémon');
            this.closeAllTeamDropdowns();
        });
        
        // Pokémon aus dem PokemonService holen und hinzufügen
        const pokemonList = this.app.pokemonService.getAllPokemon();
        
        pokemonList.forEach(pokemon => {
            const option = this.createTeamPokemonOption(pokemon, index);
            optionsContainer.appendChild(option);
        });
    }

    /**
     * Erstellt eine Pokémon-Option für das Team-Dropdown
     * @param {Object} pokemon - Pokémon-Daten
     * @param {number} index - Index des Team-Slots
     * @returns {HTMLElement} - Die erstellte Option
     */
    createTeamPokemonOption(pokemon, index) {
        const option = createElement('div', { 
            class: 'custom-select-option',
            'data-value': pokemon.id,
            'data-name': (pokemon.germanName || pokemon.name).toLowerCase()
        });
        
        // Container für Sprite und Text
        const optionContent = createElement('div', { class: 'option-content' });
        
        // Sprite hinzufügen
        const sprite = createElement('img', { 
            class: 'option-sprite',
            src: pokemon.sprites.front_default || 'placeholder.png',
            alt: pokemon.name
        });
        
        // Text hinzufügen
        const optionText = createElement('span', { class: 'option-text' });
        optionText.textContent = `#${String(pokemon.id).padStart(4, '0')} ${pokemon.germanName || pokemon.name}`;
        
        optionContent.appendChild(sprite);
        optionContent.appendChild(optionText);
        option.appendChild(optionContent);
        
        // Event-Listener für die Auswahl
        option.addEventListener('click', () => {
            const pokemonName = pokemon.germanName || pokemon.name;
            this.selectTeamPokemon(index, pokemon.id, `#${pokemon.id} ${pokemonName}`, pokemon.sprites.front_default);
            this.closeAllTeamDropdowns();
        });
        
        return option;
    }

    /**
     * Setzt das ausgewählte Pokémon für einen Team-Slot
     * @param {number} index - Index des Team-Slots
     * @param {string} value - ID des Pokémon
     * @param {string} text - Anzuzeigender Text
     * @param {string} sprite - URL des Sprites (optional)
     */
    selectTeamPokemon(index, value, text, sprite = null) {
        const selectedElement = document.getElementById(`team-pokemon-select-${index}`);
        const previousValue = selectedElement.getAttribute('data-value');
        selectedElement.setAttribute('data-value', value);
        
        // Controls-Container und EXP-Container
        const controlsContainer = document.getElementById(`team-controls-container-${index}`);
        const expContainer = document.getElementById(`team-exp-container-${index}`);
        const slotElement = document.getElementById(`team-slot-${index}`);
        
        // Inhalt leeren
        selectedElement.innerHTML = '';
        
        if (value) {
            // Sprite und Text anzeigen
            if (sprite) {
                const spriteImg = createElement('img', {
                    class: 'selected-sprite',
                    src: sprite,
                    alt: text
                });
                selectedElement.appendChild(spriteImg);
            }
            
            const textSpan = createElement('span');
            textSpan.textContent = text;
            selectedElement.appendChild(textSpan);
            
            // Controls- und EXP-Container anzeigen
            controlsContainer.classList.remove('hidden');
            expContainer.classList.remove('hidden');
            
            // Slot visuell hervorheben
            if (slotElement) {
                slotElement.style.backgroundColor = '#f2f8ff';
                slotElement.style.borderColor = '#b0c9f0';
            }
            
            // Aktualisiere die Team-Pokémon-Liste
            this.teamPokemon[index] = value;
            
            // Pokémon-Daten holen
            const pokemon = this.app.pokemonService.getPokemonById(Number(value));
            if (pokemon) {
                // Level zurücksetzen, falls es ein neues Pokémon ist
                if (previousValue !== value) {
                    const levelInput = document.getElementById(`team-level-${index}`);
                    if (levelInput) {
                        levelInput.value = this.DEFAULT_LEVEL;
                        levelInput.setAttribute('data-prev-value', this.DEFAULT_LEVEL);
                    }
                    
                    // INIT-Wert auf einen Standardwert setzen
                    const initInput = document.getElementById(`team-init-${index}`);
                    if (initInput) {
                        // Setze Standard-INIT basierend auf Pokémon-Geschwindigkeit oder auf 10
                        const defaultInit = pokemon.stats?.find(s => s.stat.name === 'speed')?.base_stat || 10;
                        initInput.value = defaultInit;
                        initInput.setAttribute('data-prev-value', defaultInit);
                    }
                }
            }
        } else {
            // Nur Text anzeigen (leerer Slot)
            selectedElement.textContent = text;
            
            // Controls- und EXP-Container ausblenden
            controlsContainer.classList.add('hidden');
            expContainer.classList.add('hidden');
            
            // Slot-Styling zurücksetzen
            if (slotElement) {
                slotElement.style.backgroundColor = '';
                slotElement.style.borderColor = '';
            }
            
            // Entferne das Pokémon aus der Liste
            this.teamPokemon[index] = null;
        }
        
        // Aktualisiere EXP-Gain für alle Team-Pokémon
        this.updateAllExpGain();
    }

    /**
     * Validiert die Level-Eingabe für Team-Pokémon
     * @param {Event} event - Das Input-Event
     * @param {number} index - Index des Team-Slots
     */
    validateTeamLevel(event, index) {
        const input = event.target;
        const value = parseInt(input.value);
        
        // Speichere den aktuellen Wert als vorherigen Wert
        if (!input.hasAttribute('data-prev-value')) {
            input.setAttribute('data-prev-value', input.value || this.DEFAULT_LEVEL.toString());
        }
        
        // Überprüfe, ob der Wert eine Zahl zwischen 1 und 100 ist
        if (isNaN(value) || value < 1 || value > 100) {
            // Wenn ungültig, stelle den vorherigen Wert wieder her
            input.value = input.getAttribute('data-prev-value');
        } else {
            // Wenn gültig, aktualisiere den vorherigen Wert
            input.setAttribute('data-prev-value', value);
            
            // Passe Farben des Input-Felds basierend auf Level an
            this.updateLevelInputStyling(input, value);
        }
    }
    
    /**
     * Aktualisiert das Styling des Level-Inputs basierend auf dem Wert
     * @param {HTMLElement} input - Das Level-Input-Element
     * @param {number} level - Der Level-Wert
     */
    updateLevelInputStyling(input, level) {
        // Entferne bestehende Styling-Klassen
        input.classList.remove('level-low', 'level-medium', 'level-high');
        
        // Füge passende Klasse basierend auf dem Level hinzu
        if (level <= 10) {
            input.style.color = '#3b5ca8'; // Standard-Blau
            input.style.backgroundColor = '';
        } else if (level <= 50) {
            input.style.color = '#2a9d45'; // Grün
            input.style.backgroundColor = 'rgba(42, 157, 69, 0.05)';
        } else {
            input.style.color = '#d55e00'; // Orange-Rot
            input.style.backgroundColor = 'rgba(213, 94, 0, 0.05)';
        }
    }

    /**
     * Aktualisiert den EXP-Gain für alle Team-Pokémon
     */
    updateAllExpGain() {
        // Zähle aktive Team-Pokémon
        const activeTeamPokemon = this.teamPokemon.filter(id => id).length;
        if (activeTeamPokemon === 0) {
            // Aktualisiere die Zusammenfassung für 0 Pokémon
            this.updateTeamSummary(0, 0, 0);
            return; // Keine aktiven Team-Pokémon
        }
        
        // Hole alle Pokémon-Slots aus der Hauptanwendung
        const mainSlots = this.getMainPokemonSlots();
        if (mainSlots.length === 0) {
            // Aktualisiere die Zusammenfassung für 0 Hauptpokémon
            this.updateTeamSummary(activeTeamPokemon, 0, 0);
            return; // Keine aktiven Hauptpokémon
        }
        
        let totalTeamExp = 0;
        let totalTeamLevel = 0;
        
        // Für jedes Team-Pokémon
        for (let i = 0; i < this.TEAM_SIZE; i++) {
            if (!this.teamPokemon[i]) continue; // Überspringe leere Slots
            
            const teamPokemonLevel = parseInt(document.getElementById(`team-level-${i}`).value);
            totalTeamLevel += teamPokemonLevel;
            
            let totalExp = 0;
            
            // Berechne EXP von jedem Hauptpokémon
            mainSlots.forEach(slot => {
                const expGain = this.calculateExpGainForTeamPokemon(slot, teamPokemonLevel, activeTeamPokemon);
                totalExp += expGain;
            });
            
            // Aktualisiere den EXP-Wert
            const expValueElement = document.getElementById(`team-exp-value-${i}`);
            // Formatiere EXP-Wert mit Information zu Level-Anpassungen
            expValueElement.textContent = this.formatExpValueWithInfo(totalExp, teamPokemonLevel, mainSlots);
            
            // Visuelle Hervorhebung basierend auf dem EXP-Wert
            this.updateExpValueVisualization(expValueElement, totalExp);
            
            // Addiere zum Gesamt-EXP
            totalTeamExp += totalExp;
        }
        
        // Berechne Durchschnittslevel (gerundet auf 1 Nachkommastelle)
        const avgLevel = activeTeamPokemon > 0 ? (totalTeamLevel / activeTeamPokemon).toFixed(1) : 0;
        
        // Aktualisiere die Team-Zusammenfassung
        this.updateTeamSummary(activeTeamPokemon, avgLevel, totalTeamExp);
    }
    
    /**
     * Aktualisiert die Team-Zusammenfassung
     * @param {number} activeCount - Anzahl aktiver Team-Pokémon
     * @param {number} avgLevel - Durchschnittliches Level
     * @param {number} totalExp - Gesamt-EXP
     */
    updateTeamSummary(activeCount, avgLevel, totalExp) {
        // Aktualisiere Anzahl aktiver Pokémon
        const activeCountElement = document.getElementById('team-active-count');
        if (activeCountElement) {
            activeCountElement.textContent = activeCount.toString();
        }
        
        // Aktualisiere durchschnittliches Level
        const avgLevelElement = document.getElementById('team-avg-level');
        if (avgLevelElement) {
            avgLevelElement.textContent = activeCount > 0 ? avgLevel.toString() : '-';
        }
        
        // Aktualisiere Gesamt-EXP
        const totalExpElement = document.getElementById('team-total-exp');
        if (totalExpElement) {
            totalExpElement.textContent = totalExp.toString();
            
            // Visuelle Hervorhebung basierend auf dem Gesamt-EXP-Wert
            totalExpElement.classList.remove('exp-very-low', 'exp-low', 'exp-medium', 'exp-high');
            
            if (totalExp > 0) {
                if (totalExp < 200) {
                    totalExpElement.classList.add('exp-very-low');
                } else if (totalExp < 500) {
                    totalExpElement.classList.add('exp-low');
                } else if (totalExp < 1000) {
                    totalExpElement.classList.add('exp-medium');
                } else {
                    totalExpElement.classList.add('exp-high');
                }
            }
        }
    }
    
    /**
     * Aktualisiert die visuelle Darstellung des EXP-Werts
     * @param {HTMLElement} element - Das EXP-Wert-Element
     * @param {number} expValue - Der EXP-Wert
     */
    updateExpValueVisualization(element, expValue) {
        // Entferne alle vorherigen Klassen
        element.classList.remove('exp-very-low', 'exp-low', 'exp-medium', 'exp-high');
        
        // Füge Klasse basierend auf dem EXP-Wert hinzu
        if (expValue < 50) {
            element.classList.add('exp-very-low');
        } else if (expValue < 100) {
            element.classList.add('exp-low');
        } else if (expValue < 200) {
            element.classList.add('exp-medium');
        } else {
            element.classList.add('exp-high');
        }
    }

    /**
     * Holt alle aktiven Pokémon-Slots aus der Hauptanwendung
     * @returns {Array} - Array der aktiven Slot-Daten
     */
    getMainPokemonSlots() {
        const slots = [];
        
        // Gehe durch alle Slots in der Hauptanwendung
        for (let i = 0; i < this.app.currentSlotCount; i++) {
            const pokemonSelect = document.getElementById(`pokemon-select-${i}`);
            if (!pokemonSelect) continue;
            
            const pokemonId = pokemonSelect.getAttribute('data-value');
            if (!pokemonId) continue; // Überspringe leere Slots
            
            const pokemonLevel = parseInt(document.getElementById(`pokemon-level-${i}`).value);
            const expGain = parseInt(document.getElementById(`exp-gain-${i}`).value);
            
            slots.push({
                id: pokemonId,
                level: pokemonLevel,
                expGain: expGain
            });
        }
        
        return slots;
    }

    /**
     * Berechnet den EXP-Gain eines Hauptpokémon für ein Team-Pokémon
     * @param {Object} mainPokemon - Daten des Hauptpokémon
     * @param {number} teamPokemonLevel - Level des Team-Pokémon
     * @param {number} activeTeamPokemon - Anzahl der aktiven Team-Pokémon
     * @returns {number} - Berechneter EXP-Gain
     */
    calculateExpGainForTeamPokemon(mainPokemon, teamPokemonLevel, activeTeamPokemon) {
        // Teile den EXP-Gain durch die Anzahl der Team-Pokémon (aufgerundet)
        let expGain = Math.ceil(mainPokemon.expGain / activeTeamPokemon);
        
        // Berechne den Levelunterschied
        const levelDiff = mainPokemon.level - teamPokemonLevel;
        
        if (levelDiff > 0) {
            // Hauptpokémon hat höheres Level: +10% pro Level Unterschied (max 200%)
            const multiplier = Math.min(1 + (levelDiff * 0.1), 2);
            expGain = Math.ceil(expGain * multiplier);
        } else if (levelDiff < 0) {
            // Hauptpokémon hat niedrigeres Level: -10% pro Level Unterschied (min 10%)
            const multiplier = Math.max(1 + (levelDiff * 0.1), 0.1);
            expGain = Math.ceil(expGain * multiplier);
        }
        
        return expGain;
    }
    
    /**
     * Formatiert den EXP-Wert mit Zusatzinfo über Level-Anpassungen
     * @param {number} expValue - Der EXP-Wert
     * @param {number} teamPokemonLevel - Level des Team-Pokémon
     * @param {Array} mainPokemonSlots - Alle Hauptpokémon-Slots
     * @returns {string} - Formatierter EXP-Wert mit Info
     */
    formatExpValueWithInfo(expValue, teamPokemonLevel, mainPokemonSlots) {
        let info = '';
        
        // Prüfe, ob es Levelunterschiede gibt
        const hasHigherLevelPokemon = mainPokemonSlots.some(slot => slot.level > teamPokemonLevel);
        const hasLowerLevelPokemon = mainPokemonSlots.some(slot => slot.level < teamPokemonLevel);
        
        if (hasHigherLevelPokemon && hasLowerLevelPokemon) {
            info = ' (Level-Anpassungen: ±)';
        } else if (hasHigherLevelPokemon) {
            info = ' (Level-Bonus)';
        } else if (hasLowerLevelPokemon) {
            info = ' (Level-Abzug)';
        }
        
        return expValue + info;
    }
}
