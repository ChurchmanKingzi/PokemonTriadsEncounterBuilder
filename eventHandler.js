/**
 * Klasse zur Verwaltung von Event-Listenern
 */
class EventHandler {
    /**
     * Konstruktor
     * @param {PokemonTeamBuilder} app - Referenz auf die Hauptanwendung
     */
    constructor(app) {
        this.app = app;
    }
    
    /**
     * Richtet globale Event-Listener ein
     * Diese Methode muss erweitert werden
     */
    setupGlobalEventListeners() {
        // Klick-Handler für Dokument hinzufügen (zum Schließen der Dropdowns)
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.custom-select-container')) {
                this.app.closeAllDropdowns();
            }
        });
        
        // Tastatur-Event-Listener für Suche, Enter-Bestätigung und Delete-Taste
        document.addEventListener('keydown', (event) => {
            // Wenn ein Pokémon-Dropdown aktiv ist
            if (this.app.activeDropdown !== null) {
                if (event.key === 'Enter') {
                    this.handleEnterKey(event);
                }
                else if (event.key === 'Delete' || event.key === 'Backspace') {
                    // Bei Delete/Backspace das Pokémon im aktuellen Slot entfernen
                    this.app.clearSlot(this.app.activeDropdown);
                    event.preventDefault();
                }
                else if ((event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) || 
                        event.key === 'Backspace') {
                    this.handleSearchInput(event);
                }
            }
            else if (this.app.activeMoveDropdown !== null) {
                if (event.key === 'Enter') {
                    this.handleMoveEnterKey(event);
                }
                else if ((event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) || 
                        event.key === 'Backspace') {
                    this.handleMoveSearchInput(event);
                }
            }
        });
    }

    /**
     * Verarbeitet das Drücken der Enter-Taste für Attacken-Dropdowns
     * @param {KeyboardEvent} event - Das Tastatur-Event
     */
    handleMoveEnterKey(event) {
        const { pokemonIndex, moveIndex } = this.app.activeMoveDropdown;
        const optionsContainer = document.getElementById(`move-options-${pokemonIndex}-${moveIndex}`);
        const highlightedOption = optionsContainer.querySelector('.move-select-option.highlighted');
        
        if (highlightedOption) {
            highlightedOption.click();
            event.preventDefault();
        }
    }

    /**
     * Verarbeitet Tastatureingaben für die Attacken-Suche
     * @param {KeyboardEvent} event - Das Tastatur-Event
     */
    handleMoveSearchInput(event) {
        if (event.key === 'Backspace') {
            this.app.searchQuery = this.app.searchQuery.slice(0, -1);
        } else {
            this.app.searchQuery += event.key.toLowerCase();
        }
        
        this.app.searchInMoveDropdown();
        
        clearTimeout(this.app.searchTimeout);
        this.app.searchTimeout = setTimeout(() => {
            this.app.searchQuery = '';
        }, 1500);
    }
    
    /**
     * Verarbeitet das Drücken der Enter-Taste
     * @param {KeyboardEvent} event - Das Tastatur-Event
     */
    handleEnterKey(event) {
        const optionsContainer = document.getElementById(`pokemon-options-${this.app.activeDropdown}`);
        const highlightedOption = optionsContainer.querySelector('.custom-select-option.highlighted');
        
        if (highlightedOption) {
            highlightedOption.click();
            event.preventDefault();
        }
    }
    
    /**
     * Verarbeitet Tastatureingaben für die Suche
     * @param {KeyboardEvent} event - Das Tastatur-Event
     */
    handleSearchInput(event) {
        if (event.key === 'Backspace') {
            this.app.searchQuery = this.app.searchQuery.slice(0, -1);
        } else {
            this.app.searchQuery += event.key.toLowerCase();
        }
        
        this.app.searchInDropdown(this.app.activeDropdown);
        
        clearTimeout(this.app.searchTimeout);
        this.app.searchTimeout = setTimeout(() => {
            this.app.searchQuery = '';
        }, 1500);
    }
}
