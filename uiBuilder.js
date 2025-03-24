/**
 * Klasse zur Erstellung und Verwaltung von UI-Elementen
 */
class UIBuilder {
    /**
     * Konstruktor
     * @param {PokemonTeamBuilder} app - Referenz auf die Hauptanwendung
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Erstellt einen einzelnen Pokémon-Slot
     * @param {number} index - Slot-Index
     * @returns {HTMLElement} - Der erstellte Slot
     */
    createPokemonSlot(index) {
        const slot = createElement('div', { class: 'pokemon-slot' });
    
        // Die Slot-Überschrift ("Slot X") wird entfernt
        
        // Erstelle benutzerdefinierten Dropdown statt select
        const selectContainer = createElement('div', { 
            class: 'custom-select-container',
            'data-slot': index
        });
        
        const selectSelected = createElement('div', { 
            class: 'custom-select-selected',
            id: `pokemon-select-${index}` 
        });
        selectSelected.textContent = 'Wähle ein Pokémon';
        
        const selectOptions = createElement('div', { 
            class: 'custom-select-options',
            id: `pokemon-options-${index}`
        });
        
        selectContainer.appendChild(selectSelected);
        selectContainer.appendChild(selectOptions);
        
        // Event-Listener für das Öffnen/Schließen des Dropdowns
        selectSelected.addEventListener('click', () => this.app.toggleDropdown(index));
        
        // Bild und Typen Container - angepasstes Layout
        const imageTypeContainer = createElement('div', { class: 'pokemon-image-container compressed' });
        const imageContainer = createElement('div', { class: 'pokemon-image', id: `pokemon-image-${index}` });
        const typesContainer = createElement('div', { class: 'pokemon-types', id: `pokemon-types-${index}` });
        imageTypeContainer.appendChild(imageContainer);
        imageTypeContainer.appendChild(typesContainer);
        
        // Container für Details (Name, Würfel und Level-Eingabe) - angepasstes Layout
        const detailsContainer = createElement('div', { class: 'pokemon-details-container compressed' });
        
        // Linke Seite: Name (ohne Nummer) und Würfel
        const infoContainer = createElement('div', { class: 'pokemon-info' });
        const pokemonName = createElement('div', { class: 'pokemon-name', id: `pokemon-name-${index}` });
        const diceContainer = createElement('div', { 
            class: 'pokemon-dice', 
            id: `pokemon-dice-${index}` 
        });
        infoContainer.appendChild(pokemonName);
        infoContainer.appendChild(diceContainer);
        
        // Rechte Seite: Level-Eingabe - nach oben verschoben
        const levelContainer = createElement('div', { class: 'pokemon-level-container hidden compressed' });
        const levelLabel = createElement('div', { class: 'pokemon-level-label' });
        levelLabel.textContent = 'Level';
        const levelInput = createElement('input', { 
            type: 'text',
            class: 'pokemon-level-input',
            id: `pokemon-level-${index}`,
            value: '5'
        });
        levelContainer.appendChild(levelLabel);
        levelContainer.appendChild(levelInput);
        
        // Event-Listener für die Level-Eingabe
        levelInput.addEventListener('change', (event) => {
            this.app.validateLevel(event, index);
            // Aktualisiere die Stats nach Leveländerung, falls ein Pokémon ausgewählt ist
            const pokemonId = document.getElementById(`pokemon-select-${index}`).getAttribute('data-value');
            if (pokemonId) {
                const pokemon = this.app.pokemonService.getPokemonById(Number(pokemonId));
                if (pokemon) {
                    this.app.updatePokemonStats(index, pokemon, parseInt(levelInput.value));
                    // EXP-Gain auch aktualisieren
                    this.app.updateExpGain(index, pokemon, parseInt(levelInput.value));
                }
            }
        });
        levelInput.addEventListener('blur', (event) => this.app.validateLevel(event, index));
        
        // Füge alles zum Details-Container hinzu
        detailsContainer.appendChild(infoContainer);
        detailsContainer.appendChild(levelContainer);
        
        // Stats-Container für die Statuswerte
        const statsContainer = createElement('div', { 
            class: 'pokemon-stats-container hidden compressed', 
            id: `pokemon-stats-${index}` 
        });
        
        // Attacken-Container für die Attacken hinzufügen
        const movesContainer = this.createMovesContainer(index);
        movesContainer.classList.add('hidden'); // Verstecken, bis ein Pokémon ausgewählt ist
        movesContainer.classList.add('compressed'); // Komprimiertes Layout
        
        // EXP-Gain Container hinzufügen - angepasstes Layout für die Buttons
        const expGainContainer = this.createExpGainSection(index);
        
        // Füge alles zum Slot hinzu - angepasste Reihenfolge
        slot.appendChild(selectContainer);
        slot.appendChild(imageTypeContainer);
        slot.appendChild(detailsContainer);
        slot.appendChild(statsContainer);
        slot.appendChild(expGainContainer);
        slot.appendChild(movesContainer);

        const abilitiesContainer = this.createAbilitiesContainer(index);
        slot.appendChild(abilitiesContainer);
        
        return slot;
    }

    /**
     * Erstellt eine Pokémon-Option für ein Dropdown-Menü
     * @param {Object} pokemon - Pokémon-Daten
     * @param {number} slotIndex - Slot-Index
     * @returns {HTMLElement} - Die erstellte Option
     */
    createPokemonOption(pokemon, slotIndex) {
        const option = createElement('div', { 
            class: 'custom-select-option',
            'data-value': pokemon.id,
            'data-name': (pokemon.germanName || pokemon.name).toLowerCase() // Für die Suche
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
            this.app.selectPokemon(slotIndex, pokemon.id, `#${pokemon.id} ${pokemonName}`, pokemon.sprites.front_default);
            this.app.closeAllDropdowns();
            this.app.displayPokemonDetails(slotIndex, pokemon);
        });
        
        return option;
    }
    
    /**
     * Hebt eine Option im Dropdown hervor und scrollt zu ihr
     * @param {HTMLElement} option - Die hervorzuhebende Option
     * @param {HTMLElement} container - Der Container des Dropdowns
     */
    highlightOption(option, container) {
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
    
    /**
     * Erstellt die Statusanzeige für ein Pokémon
     * @param {HTMLElement} container - Der Container für die Statusanzeige
     * @param {Object} stats - Die Statuswerte des Pokémon
     * @param {number} slot - Slot-Index
     */
    createStatsDisplay(container, stats, slot) {
        // Erstelle die Zeile mit zwei Spalten
        const statsRow = createElement('div', { class: 'stats-row' });
        
        // Linke Spalte
        const leftColumn = createElement('div', { class: 'stats-column' });
        
        // GENA
        leftColumn.appendChild(this.createStatEntry('GENA', stats.gena, `gena-${slot}`));
        
        // KP
        leftColumn.appendChild(this.createStatEntry('KP', stats.hp, `hp-${slot}`));
        
        // ANG
        leftColumn.appendChild(this.createStatEntry('ANG', stats.attack, `attack-${slot}`));
        
        // SP ANG
        leftColumn.appendChild(this.createStatEntry('SP ANG', stats.specialAttack, `specialAttack-${slot}`));
        
        // Rechte Spalte
        const rightColumn = createElement('div', { class: 'stats-column' });
        
        // PA
        rightColumn.appendChild(this.createStatEntry('PA', stats.pa, `pa-${slot}`));
        
        // INIT
        rightColumn.appendChild(this.createStatEntry('INIT', stats.speed, `speed-${slot}`));
        
        // VERT
        rightColumn.appendChild(this.createStatEntry('VERT', stats.defense, `defense-${slot}`));
        
        // SP VERT
        rightColumn.appendChild(this.createStatEntry('SP VERT', stats.specialDefense, `specialDefense-${slot}`));
        
        // Füge alles zusammen
        statsRow.appendChild(leftColumn);
        statsRow.appendChild(rightColumn);
        container.appendChild(statsRow);
        
        // Füge Validierung für alle Eingabefelder hinzu
        const statInputs = container.querySelectorAll('.stat-value-input');
        statInputs.forEach(input => {
            input.setAttribute('data-prev-value', input.value);
            input.addEventListener('change', this.app.statCalculator.validateStatInput);
            input.addEventListener('blur', this.app.statCalculator.validateStatInput);
        });
    }
    
    /**
     * Erstellt einen einzelnen Statuseintrag
     * @param {string} name - Name des Status
     * @param {number} value - Wert des Status
     * @param {string} id - ID für das Eingabefeld
     * @returns {HTMLElement} - Der erstellte Statuseintrag
     */
    createStatEntry(name, value, id) {
        const entry = createElement('div', { class: 'stat-entry' });
        const statName = createElement('span', { class: 'stat-name' });
        statName.textContent = name;
        const statInput = createElement('input', { 
            type: 'text',
            class: 'stat-value-input',
            id: id,
            value: value
        });
        entry.appendChild(statName);
        entry.appendChild(statInput);
        return entry;
    }


    /**
     * Erstellt Container für die Attacken eines Pokémon
     * @param {number} index - Slot-Index 
     * @returns {HTMLElement} - Container für Attacken
     */
    createMovesContainer(index) {
        const movesContainer = createElement('div', {
            class: 'pokemon-moves-container',
            id: `pokemon-moves-${index}`
        });
        
        // Header mit Titel und Button
        const movesHeader = createElement('div', { class: 'moves-header' });
        
        const movesTitle = createElement('div', { class: 'moves-title' });
        movesTitle.textContent = 'Attacken';
        
        // "Neues Moveset" Button erstellen
        const newMovesetButton = createElement('button', {
            class: 'new-moveset-button centered-button disabled',
            id: `new-moveset-${index}`
        });
        newMovesetButton.textContent = 'Neues Moveset';
        
        // Event-Listener für den Button
        newMovesetButton.addEventListener('click', (event) => {
            // Prüfe, ob ein Pokémon ausgewählt ist
            const pokemonId = document.getElementById(`pokemon-select-${index}`).getAttribute('data-value');
            if (!pokemonId || newMovesetButton.classList.contains('disabled')) {
                return;
            }
            
            // Hole Pokémon-Daten
            const pokemonData = this.app.pokemonService.getPokemonById(Number(pokemonId));
            if (!pokemonData) return;
            
            // Generiere neues Moveset
            this.app.assignRandomMoves(index, pokemonData);
        });
        
        // Header zusammenbauen
        movesHeader.appendChild(movesTitle);
        movesHeader.appendChild(newMovesetButton);
        
        const movesList = createElement('div', { class: 'moves-list' });
        
        // Erstelle 4 Attacken-Slots
        for (let i = 0; i < 4; i++) {
            const moveSlot = this.createMoveSlot(index, i);
            movesList.appendChild(moveSlot);
        }
        
        movesContainer.appendChild(movesHeader);
        movesContainer.appendChild(movesList);
        
        return movesContainer;
    }

    /**
     * Erstellt einen einzelnen Attacken-Slot
     * @param {number} pokemonIndex - Index des Pokémon-Slots
     * @param {number} moveIndex - Index des Attacken-Slots
     * @returns {HTMLElement} - Attacken-Slot-Element
     */
    createMoveSlot(pokemonIndex, moveIndex) {
        const moveSlot = createElement('div', { class: 'move-slot' });
        
        // Erstelle benutzerdefinierten Dropdown für Attacken
        const moveSelectContainer = createElement('div', { 
            class: 'custom-select-container move-select-container',
            'data-pokemon': pokemonIndex,
            'data-move': moveIndex
        });
        
        const moveSelectSelected = createElement('div', { 
            class: 'custom-select-selected move-select-selected',
            id: `move-select-${pokemonIndex}-${moveIndex}` 
        });
        moveSelectSelected.textContent = 'Wähle eine Attacke';
        
        const moveSelectOptions = createElement('div', { 
            class: 'custom-select-options move-select-options',
            id: `move-options-${pokemonIndex}-${moveIndex}`
        });
        
        moveSelectContainer.appendChild(moveSelectSelected);
        moveSelectContainer.appendChild(moveSelectOptions);
        
        // Event-Listener für das Öffnen/Schließen des Dropdowns
        moveSelectSelected.addEventListener('click', () => this.app.toggleMoveDropdown(pokemonIndex, moveIndex));
        
        moveSlot.appendChild(moveSelectContainer);
        
        return moveSlot;
    }

    /**
     * Erstellt eine Attacken-Option für ein Dropdown-Menü
     * @param {Object} move - Attackendaten
     * @param {number} pokemonIndex - Index des Pokémon-Slots
     * @param {number} moveIndex - Index des Attacken-Slots
     * @param {string} category - Kategorie der Attacke (Level-Up, Zucht, etc.)
     * @returns {HTMLElement} - Die erstellte Option
     */
    createMoveOption(move, pokemonIndex, moveIndex, category) {
        const option = createElement('div', { 
            class: 'custom-select-option move-select-option',
            'data-value': move.id,
            'data-name': move.germanName.toLowerCase(), // Für die Suche
            'data-category': category
        });
        
        // Text hinzufügen
        const optionText = createElement('span', { class: 'option-text' });
        
        // Zeige den Attackennamen und wie sie gelernt wird
        let learnMethodText = '';
        if (category === 'level-up') {
            learnMethodText = `(Level ${move.levelLearned})`;
        } else if (category === 'egg') {
            learnMethodText = '(Zucht)';
        } else if (category === 'tm') {
            // Vereinfachte Anzeige ohne Nummern
            learnMethodText = '(TM/VM)';
        } else if (category === 'same-type') {
            learnMethodText = `(${move.type})`;
        } else if (move.learnMethod === 'Universell') {
            // Für universelle Attacken, die standardmäßig nicht erlernbar sind
            learnMethodText = '(Universell)';
        } else {
            learnMethodText = '(Andere)';
        }
        
        optionText.textContent = `${move.germanName} ${learnMethodText}`;
        
        // Styling je nach Attackentyp
        option.classList.add(`move-type-${move.type}`);
        
        // Für universelle Attacken ein spezielles Styling
        if (move.learnMethod === 'Universell') {
            option.classList.add('universal-move');
        }
        
        option.appendChild(optionText);
        
        // Event-Listener für die Auswahl
        option.addEventListener('click', () => {
            this.app.selectMove(pokemonIndex, moveIndex, move.id, move.germanName, move.type);
            this.app.closeAllDropdowns();
        });
        
        return option;
    }

    /**
     * Erstellt eine Trennlinie für die Attacken-Kategorien
     * @param {string} text - Text für die Trennlinie
     * @returns {HTMLElement} - Trennlinien-Element
     */
    createMoveDivider(text) {
        const divider = createElement('div', { class: 'move-divider' });
        divider.textContent = text;
        return divider;
    }

    /**
     * Befüllt ein Attacken-Dropdown mit Optionen
     * @param {number} pokemonIndex - Index des Pokémon-Slots
     * @param {number} moveIndex - Index des Attacken-Slots
     * @param {Object} categorizedMoves - Kategorisierte Attacken
     */
    populateMoveDropdown(pokemonIndex, moveIndex, categorizedMoves) {
        const optionsContainer = document.getElementById(`move-options-${pokemonIndex}-${moveIndex}`);
        
        // Leere den Container
        optionsContainer.innerHTML = '';
        
        // Leere Option hinzufügen
        const emptyOption = createElement('div', { 
            class: 'custom-select-option move-select-option', 
            'data-value': '' 
        });
        emptyOption.textContent = 'Keine Attacke';
        optionsContainer.appendChild(emptyOption);
        
        // Klick-Handler für die leere Option
        emptyOption.addEventListener('click', () => {
            this.app.selectMove(pokemonIndex, moveIndex, '', 'Wähle eine Attacke');
            this.app.closeAllDropdowns();
        });
        
        // Level-Up Attacken hinzufügen
        if (categorizedMoves.levelUpMoves.length > 0) {
            const levelUpDivider = this.createMoveDivider('Durch Level-Up erlernt');
            optionsContainer.appendChild(levelUpDivider);
            
            categorizedMoves.levelUpMoves.forEach(move => {
                const option = this.createMoveOption(move, pokemonIndex, moveIndex, 'level-up');
                optionsContainer.appendChild(option);
            });
        }
        
        // Zucht-Attacken hinzufügen
        if (categorizedMoves.eggMoves.length > 0) {
            const eggDivider = this.createMoveDivider('Durch Zucht erlernt');
            optionsContainer.appendChild(eggDivider);
            
            categorizedMoves.eggMoves.forEach(move => {
                const option = this.createMoveOption(move, pokemonIndex, moveIndex, 'egg');
                optionsContainer.appendChild(option);
            });
        }
        
        // TM/VM-Attacken hinzufügen
        if (categorizedMoves.tmMoves.length > 0) {
            const tmDivider = this.createMoveDivider('Durch TM/VM erlernt');
            optionsContainer.appendChild(tmDivider);
            
            categorizedMoves.tmMoves.forEach(move => {
                const option = this.createMoveOption(move, pokemonIndex, moveIndex, 'tm');
                optionsContainer.appendChild(option);
            });
        }
        
        // Attacken des gleichen Typs hinzufügen
        if (categorizedMoves.sameTypeMoves.length > 0) {
            const sameTypeDivider = this.createMoveDivider('Gleicher Typ');
            optionsContainer.appendChild(sameTypeDivider);
            
            categorizedMoves.sameTypeMoves.forEach(move => {
                const option = this.createMoveOption(move, pokemonIndex, moveIndex, 'same-type');
                optionsContainer.appendChild(option);
            });
        }
        
        // Andere Attacken hinzufügen (mit spezieller Markierung für den Divider)
        if (categorizedMoves.otherMoves.length > 0) {
            const otherDivider = this.createMoveDivider('Alle verfügbaren Attacken');
            otherDivider.classList.add('other-moves-divider'); // Zusatzklasse für Styling
            optionsContainer.appendChild(otherDivider);
            
            categorizedMoves.otherMoves.forEach(move => {
                const option = this.createMoveOption(move, pokemonIndex, moveIndex, 'other');
                optionsContainer.appendChild(option);
            });
        }
    }

    /**
     * Erstellt Container für die Attacken eines Pokémon
     * @param {number} index - Slot-Index 
     * @returns {HTMLElement} - Container für Attacken
     */
    createMovesContainer(index) {
        const movesContainer = createElement('div', {
            class: 'pokemon-moves-container',
            id: `pokemon-moves-${index}`
        });
        
        // Header mit Titel und Button
        const movesHeader = createElement('div', { class: 'moves-header' });
        
        const movesTitle = createElement('div', { class: 'moves-title' });
        movesTitle.textContent = 'Attacken';
        
        // "Neues Moveset" Button erstellen
        const newMovesetButton = createElement('button', {
            class: 'new-moveset-button disabled',
            id: `new-moveset-${index}`
        });
        newMovesetButton.textContent = 'Neues Moveset';
        
        // Event-Listener für den Button
        newMovesetButton.addEventListener('click', (event) => {
            // Prüfe, ob ein Pokémon ausgewählt ist
            const pokemonId = document.getElementById(`pokemon-select-${index}`).getAttribute('data-value');
            if (!pokemonId || newMovesetButton.classList.contains('disabled')) {
                return;
            }
            
            // Hole Pokémon-Daten
            const pokemonData = this.app.pokemonService.getPokemonById(Number(pokemonId));
            if (!pokemonData) return;
            
            // Generiere neues Moveset
            this.app.assignRandomMoves(index, pokemonData);
        });
        
        // Header zusammenbauen
        movesHeader.appendChild(movesTitle);
        movesHeader.appendChild(newMovesetButton);
        
        const movesList = createElement('div', { class: 'moves-list' });
        
        // Erstelle 4 Attacken-Slots
        for (let i = 0; i < 4; i++) {
            const moveSlot = this.createMoveSlot(index, i);
            movesList.appendChild(moveSlot);
        }
        
        movesContainer.appendChild(movesHeader);
        movesContainer.appendChild(movesList);
        
        return movesContainer;
    }

    /**
     * Erstellt einen Container für EXP Gain
     * @param {number} pokemonIndex - Index des Pokémon-Slots
     * @returns {HTMLElement} - Container für EXP Gain
     */
    createExpGainSection(pokemonIndex) {
        const expGainContainer = createElement('div', {
            class: 'exp-gain-container hidden compressed',
            id: `exp-gain-container-${pokemonIndex}`
        });
        
        // Überschrift und Button-Container
        const expHeader = createElement('div', { class: 'exp-header compressed' });
        
        // Button-Container - Angepasst für rechtsbündige Ausrichtung
        const buttonContainer = createElement('div', { class: 'button-container right-aligned' });
        
        // Randomize Stats-Button hinzufügen
        const randomizeButton = createElement('button', {
            class: 'randomize-button',
            id: `randomize-btn-${pokemonIndex}`,
            title: 'Statuswerte zufällig neu verteilen'
        });
        randomizeButton.textContent = 'Randomize Stats';
        
        // Event-Listener für den Randomize Stats-Button
        randomizeButton.addEventListener('click', () => {
            this.app.randomizeStats(pokemonIndex);
        });
        
        // Duplizieren-Button hinzufügen - Angepasst für neue Position
        const duplicateButton = createElement('button', {
            class: 'duplicate-button right-aligned',
            id: `duplicate-btn-${pokemonIndex}`,
            title: 'Pokémon in den nächsten freien Slot duplizieren'
        });
        duplicateButton.textContent = 'Duplizieren';
        
        // Event-Listener für den Duplizieren-Button
        duplicateButton.addEventListener('click', () => {
            this.app.duplicatePokemon(pokemonIndex);
        });
        
        // Buttons zum Container hinzufügen 
        buttonContainer.appendChild(duplicateButton);
        buttonContainer.appendChild(randomizeButton);
        
        // Header zusammenbauen - Nur die Buttons
        expHeader.appendChild(buttonContainer);
        
        // Eingabefeld und Label im horizontalen Layout
        const expInputContainer = createElement('div', { class: 'exp-input-container' });
        
        // EXP Gain Label (jetzt im Input-Container)
        const expGainLabel = createElement('div', { class: 'exp-gain-label' });
        expGainLabel.textContent = 'EXP Gain:';
        
        const expGainInput = createElement('input', {
            type: 'text',
            class: 'exp-gain-input',
            id: `exp-gain-${pokemonIndex}`,
            value: '0'
        });
        
        // Verstecktes Feld für den ursprünglichen Wert (wird für Zurücksetzung benötigt)
        const originalExpInput = createElement('input', {
            type: 'hidden',
            id: `exp-gain-original-${pokemonIndex}`,
            value: '0'
        });
        
        // Füge zuerst das Label, dann den Input zum Container hinzu
        expInputContainer.appendChild(expGainLabel);
        expInputContainer.appendChild(expGainInput);
        expInputContainer.appendChild(originalExpInput);
        
        // Button-Container für Multiplikatoren - ANGEPASST für eine Reihe
        const expMultiplierContainer = createElement('div', { class: 'exp-multiplier-container single-row' });
        
        // Trainer-Button (x1.5)
        const trainerButton = createElement('button', {
            class: 'exp-multiplier-button',
            id: `exp-trainer-${pokemonIndex}`,
            'data-multiplier': '1.5',
            'data-active': 'false'
        });
        trainerButton.textContent = 'Trainer (x1.5)';
        
        // Arena-Button (x2) - Text geändert von "Arena und co" zu "Arena"
        const arenaButton = createElement('button', {
            class: 'exp-multiplier-button',
            id: `exp-arena-${pokemonIndex}`,
            'data-multiplier': '2',
            'data-active': 'false'
        });
        arenaButton.textContent = 'Arena (x2)';
        
        // Boss-Button (x3)
        const bossButton = createElement('button', {
            class: 'exp-multiplier-button',
            id: `exp-boss-${pokemonIndex}`,
            'data-multiplier': '3',
            'data-active': 'false'
        });
        bossButton.textContent = 'Boss (x3)';
        
        expMultiplierContainer.appendChild(trainerButton);
        expMultiplierContainer.appendChild(arenaButton);
        expMultiplierContainer.appendChild(bossButton);
        
        // Füge alles zum Container hinzu
        expGainContainer.appendChild(expHeader);         // Buttons zuerst
        expGainContainer.appendChild(expInputContainer); // EXP Gain Label und Input als zweites
        expGainContainer.appendChild(expMultiplierContainer); // Multiplikatoren als letztes
        
        return expGainContainer;
    }

    createAbilitiesContainer(index) {
        const abilitiesContainer = createElement('div', {
            class: 'pokemon-abilities-container hidden compressed',
            id: `pokemon-abilities-${index}`
        });
        
        // Header mit Titel
        const abilitiesHeader = createElement('div', { class: 'abilities-header' });
        
        const abilitiesTitle = createElement('div', { class: 'abilities-title' });
        abilitiesTitle.textContent = 'Fähigkeiten';
        
        // Header zusammenbauen
        abilitiesHeader.appendChild(abilitiesTitle);
        
        // Container für die drei Fähigkeiten
        const abilitiesList = createElement('div', { class: 'abilities-list' });
        
        // Wir erstellen 3 Fähigkeiten-Slots (entsprechend dem Array aus abilityService.js)
        for (let i = 0; i < 3; i++) {
            const abilitySlot = createElement('div', { 
                class: 'ability-slot',
                id: `ability-slot-${index}-${i}`
            });
            abilitiesList.appendChild(abilitySlot);
        }
        
        abilitiesContainer.appendChild(abilitiesHeader);
        abilitiesContainer.appendChild(abilitiesList);
        
        return abilitiesContainer;
    };

    createAbilityTooltips() {        
        // Initialisiere die Tooltips für alle vorhandenen Fähigkeiten
        this.setupAbilityTooltips();
    };
    
    setupAbilityTooltips() {
        // Warten auf das vollständige Laden des DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeAbilityTooltips();
            });
        } else {
            this.initializeAbilityTooltips();
        }
        
        // Beobachte DOM-Änderungen, um neue Fähigkeiten-Badges zu erkennen
        const observer = new MutationObserver((mutations) => {
            let hasNewAbilities = false;
            
            mutations.forEach(mutation => {
                // Prüfe, ob neue Fähigkeits-Badges hinzugefügt wurden
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.classList && node.classList.contains('ability-badge')) {
                                hasNewAbilities = true;
                            } else if (node.querySelectorAll) {
                                const badges = node.querySelectorAll('.ability-badge');
                                if (badges.length > 0) {
                                    hasNewAbilities = true;
                                }
                            }
                        }
                    });
                }
            });
            
            if (hasNewAbilities) {
                this.initializeAbilityTooltips();
            }
        });
        
        // Starte die Beobachtung des gesamten Dokuments für Änderungen
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    };

    initializeAbilityTooltips() {
        // Selektiere alle Fähigkeits-Badges im Dokument
        const abilityBadges = document.querySelectorAll('.ability-badge');
        
        abilityBadges.forEach(badge => {
            // Prüfe, ob das Badge bereits einen Tooltip hat
            if (!badge.hasAttribute('data-tooltip') && badge.textContent.trim() !== 'Leer') {
                const abilityName = badge.textContent.trim();
                
                // Hole die Beschreibung der Fähigkeit mit der getAbilityDescription-Funktion
                let description = '';
                try {
                    if (typeof getAbilityDescription === 'function') {
                        description = getAbilityDescription(abilityName);
                    } else if (typeof window.getAbilityDescription === 'function') {
                        description = window.getAbilityDescription(abilityName);
                    }
                    console.log(description);
                } catch (error) {
                    console.error(`Fehler beim Abrufen der Beschreibung für ${abilityName}:`, error);
                    description = 'Keine Beschreibung verfügbar.';
                }
                
                // Setze den Tooltip-Text
                if (description && description !== '') {
                    badge.setAttribute('data-tooltip', description);
                } else {
                    badge.setAttribute('data-tooltip', 'Keine Beschreibung verfügbar.');
                }
                
                // Entferne bestehende Event-Listener durch Klonen des Elements
                const newBadge = badge.cloneNode(true);
                badge.parentNode.replaceChild(newBadge, badge);
                
                // Füge die Event-Listener zum neuen Element hinzu
                newBadge.addEventListener('mouseenter', () => {
                    // Warte einen Moment, bis der Tooltip sichtbar ist
                    setTimeout(() => {
                        // Prüfe die Position des Tooltips
                        const badgeRect = newBadge.getBoundingClientRect();
                        const tooltipText = newBadge.getAttribute('data-tooltip') || '';
                        
                        // Berechne die erwartete Position des Tooltips basierend auf der Textlänge
                        const viewportWidth = window.innerWidth;
                        const badgeCenter = badgeRect.left + (badgeRect.width / 2);
                        
                        // Bestimme die Breite des Tooltips basierend auf der Textlänge
                        // Kürzere Texte verwenden den tatsächlichen Platzbedarf, längere bekommen die maximale Breite
                        let tooltipWidth;
                        
                        if (tooltipText.length < 50) {
                            // Für kurze Texte: Berechne die ungefähre Breite
                            tooltipWidth = Math.min(tooltipText.length * 7 + 24, 300); // 7px pro Zeichen + Padding
                        } else {
                            // Für lange Texte: Verwende die maximale Breite
                            tooltipWidth = 300; // Maximale Breite aus CSS
                        }
                        
                        // Stelle sicher, dass für sehr lange Texte die Maximale Breite verwendet wird
                        if (tooltipText.length > 100) {
                            tooltipWidth = 300;
                        }
                        
                        // Überprüfe, ob der Tooltip links oder rechts über den Viewport hinausragen würde
                        // Links
                        if (badgeCenter - (tooltipWidth / 2) < 10) {
                            // Wenn der Tooltip links über den Bildschirmrand hinausragt
                            newBadge.style.setProperty('--tooltip-left', '0');
                            newBadge.style.setProperty('--tooltip-right', 'auto');
                            newBadge.style.setProperty('--tooltip-transform', 'translateX(0)');
                        }
                        // Rechts
                        else if (badgeCenter + (tooltipWidth / 2) > viewportWidth - 10) {
                            // Wenn der Tooltip rechts über den Bildschirmrand hinausragt
                            newBadge.style.setProperty('--tooltip-left', 'auto');
                            newBadge.style.setProperty('--tooltip-right', '0');
                            newBadge.style.setProperty('--tooltip-transform', 'translateX(0)');
                        }
                        // In der Mitte (Standard)
                        else {
                            // Standard zentrierte Position
                            newBadge.style.setProperty('--tooltip-left', '50%');
                            newBadge.style.setProperty('--tooltip-right', 'auto');
                            newBadge.style.setProperty('--tooltip-transform', 'translateX(-50%)');
                        }
                    }, 10);
                });
                
                // Zurücksetzen beim Verlassen des Elements
                newBadge.addEventListener('mouseleave', () => {
                    // Setze die Variablen zurück zu den Standardwerten
                    newBadge.style.removeProperty('--tooltip-left');
                    newBadge.style.removeProperty('--tooltip-right');
                    newBadge.style.removeProperty('--tooltip-transform');
                });
            }
        });
        
        console.log(`Tooltips für ${abilityBadges.length} Fähigkeits-Badges initialisiert`);
    };
}