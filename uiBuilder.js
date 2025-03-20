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
        
        const slotTitle = createElement('div');
        slotTitle.textContent = `Slot ${index + 1}`;
        
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
        
        // Bild und Typen Container
        const imageTypeContainer = createElement('div', { class: 'pokemon-image-container' });
        const imageContainer = createElement('div', { class: 'pokemon-image', id: `pokemon-image-${index}` });
        const typesContainer = createElement('div', { class: 'pokemon-types', id: `pokemon-types-${index}` });
        imageTypeContainer.appendChild(imageContainer);
        imageTypeContainer.appendChild(typesContainer);
        
        // Container für Details (Name, Würfel und Level-Eingabe)
        const detailsContainer = createElement('div', { class: 'pokemon-details-container' });
        
        // Linke Seite: Name und Würfel
        const infoContainer = createElement('div', { class: 'pokemon-info' });
        const pokemonName = createElement('div', { class: 'pokemon-name', id: `pokemon-name-${index}` });
        const diceContainer = createElement('div', { 
            class: 'pokemon-dice', 
            id: `pokemon-dice-${index}` 
        });
        infoContainer.appendChild(pokemonName);
        infoContainer.appendChild(diceContainer);
        
        // Rechte Seite: Level-Eingabe
        const levelContainer = createElement('div', { class: 'pokemon-level-container hidden' });
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
            class: 'pokemon-stats-container hidden', 
            id: `pokemon-stats-${index}` 
        });
        
        // Attacken-Container für die Attacken hinzufügen
        const movesContainer = this.createMovesContainer(index);
        movesContainer.classList.add('hidden'); // Verstecken, bis ein Pokémon ausgewählt ist
        
        // EXP-Gain Container hinzufügen
        const expGainContainer = this.createExpGainSection(index);
        
        // Füge alles zum Slot hinzu
        slot.appendChild(slotTitle);
        slot.appendChild(selectContainer);
        slot.appendChild(imageTypeContainer);
        slot.appendChild(detailsContainer);
        slot.appendChild(statsContainer);
        slot.appendChild(expGainContainer);
        slot.appendChild(movesContainer);
        
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
            class: 'exp-gain-container hidden',
            id: `exp-gain-container-${pokemonIndex}`
        });
        
        // Überschrift und Button-Container
        const expHeader = createElement('div', { class: 'exp-header' });
        
        // Button-Container (Reihenfolge umgekehrt: Randomize links, Duplizieren rechts)
        const buttonContainer = createElement('div', { class: 'button-container' });
        
        // Randomize Stats-Button hinzufügen (jetzt zuerst, erscheint rechts wegen flex-direction: row-reverse)
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
        
        // Duplizieren-Button hinzufügen (jetzt als zweites, erscheint links wegen flex-direction: row-reverse)
        const duplicateButton = createElement('button', {
            class: 'duplicate-button',
            id: `duplicate-btn-${pokemonIndex}`,
            title: 'Pokémon in den nächsten freien Slot duplizieren'
        });
        duplicateButton.textContent = 'Duplizieren';
        
        // Event-Listener für den Duplizieren-Button
        duplicateButton.addEventListener('click', () => {
            this.app.duplicatePokemon(pokemonIndex);
        });
        
        // Buttons zum Container hinzufügen (Randomize zuerst, Duplizieren danach)
        buttonContainer.appendChild(randomizeButton);
        buttonContainer.appendChild(duplicateButton);
        
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
        
        // Button-Container für Multiplikatoren
        const expMultiplierContainer = createElement('div', { class: 'exp-multiplier-container' });
        
        // Trainer-Button (x1.5)
        const trainerButton = createElement('button', {
            class: 'exp-multiplier-button',
            id: `exp-trainer-${pokemonIndex}`,
            'data-multiplier': '1.5',
            'data-active': 'false'
        });
        trainerButton.textContent = 'Trainer (x1.5)';
        
        // Arena-Button (x2)
        const arenaButton = createElement('button', {
            class: 'exp-multiplier-button',
            id: `exp-arena-${pokemonIndex}`,
            'data-multiplier': '2',
            'data-active': 'false'
        });
        arenaButton.textContent = 'Arena und co (x2)';
        
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
    
}