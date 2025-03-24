/**
 * Erstellt ein HTML-Element mit Attributen
 * @param {string} tag - HTML-Tag
 * @param {Object} attributes - Attribute für das Element
 * @returns {HTMLElement} - Erstelltes Element
 */
function createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    return element;
}

/**
 * Berechnet den Erfahrungswert basierend auf BST und Evolutionsstatus
 * @param {Object} pokemonData - Pokémon-Daten
 * @param {number} level - Level des Pokémon
 * @returns {number} - Berechneter Erfahrungswert
 */
function calculateExpGain(pokemonData, level) {
    if (!pokemonData || !pokemonData.baseStatTotal) return 0;
    
    // Basiswert basierend auf BST berechnen
    let baseExp = 4; // Grundwert für BST <= 300
    
    if (pokemonData.baseStatTotal > 300) {
        // Für jeden 50-Punkte-Bereich über 300 werden 2 Punkte hinzugefügt
        const bstRanges = Math.floor((pokemonData.baseStatTotal - 301) / 50) + 1;
        baseExp += bstRanges * 2;
    }
    
    // Multiplikator basierend auf Evolutionsstatus
    let evolutionMultiplier = 1;
    
    // Wenn vollständig entwickelt (keine weiteren Evolutionen mehr und nicht das Basis-Pokémon)
    if (pokemonData.remainingEvolutions === 0 && pokemonData.evolutionLevel > 0) {
        evolutionMultiplier = 2; // Verdoppeln
    } 
    // Wenn teilweise entwickelt (mindestens eine Evolution durchgeführt, aber noch weitere möglich)
    else if (pokemonData.evolutionLevel > 0 && pokemonData.remainingEvolutions > 0) {
        evolutionMultiplier = 1.5; // 50% mehr
    }
    
    // Basis-Erfahrungswert mit Evolutionsmultiplikator berechnen
    const adjustedBaseExp = Math.ceil(baseExp * evolutionMultiplier);
    
    // Mit Level multiplizieren
    return adjustedBaseExp * level;
}

/**
 * Validiert die Eingabe des EXP-Wertes
 * @param {Event} event - Das Input-Event
 */
function validateExpInput(event) {
    const input = event.target;
    const value = parseInt(input.value);
    
    // Speichere den aktuellen Wert als vorherigen Wert
    if (!input.hasAttribute('data-prev-value')) {
        input.setAttribute('data-prev-value', input.value);
    }
    
    // Überprüfe, ob der Wert eine positive Zahl ist
    if (isNaN(value) || value < 0) {
        // Wenn ungültig, stelle den vorherigen Wert wieder her
        input.value = input.getAttribute('data-prev-value');
    } else {
        // Wenn gültig, aktualisiere den vorherigen Wert
        input.setAttribute('data-prev-value', value);
    }
}

/**
 * Prüft, ob ein Element am unteren Rand des Viewports liegt
 */
function isNearBottomOfViewport(element) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Wenn das Element im unteren Drittel des Viewports liegt
    return rect.bottom > viewportHeight * 0.5;
  }
  
  /**
   * Positioniert ein Dropdown-Menü je nach Position im Viewport
   */
  function positionDropdown(dropdown, container) {
    // Entferne vorherige Positionierungen
    dropdown.style.bottom = '';
    dropdown.style.top = '';
    
    if (isNearBottomOfViewport(container)) {
      // Wenn der Container nahe am unteren Rand ist, positioniere das Dropdown über dem Container
      dropdown.style.bottom = container.offsetHeight + 'px';
      dropdown.style.top = 'auto';
      dropdown.classList.add('dropdown-upward');
    } else {
      // Ansonsten zeige es unterhalb an (Standard)
      dropdown.style.top = container.offsetHeight + 'px';
      dropdown.style.bottom = 'auto';
      dropdown.classList.remove('dropdown-upward');
    }
}

/**
 * Richtet die korrekte Positionierung der Tooltips ein
 * Diese Funktion wird aufgerufen, wenn neue Würfel hinzugefügt werden
 */
/**
 * Richtet die korrekte Positionierung der Tooltips ein
 * Diese Funktion wird aufgerufen, wenn neue Würfel hinzugefügt werden
 */
function setupTooltipPositioning() {
    // Selektiere alle Elemente mit dice-tooltip Klasse
    const tooltipElements = document.querySelectorAll('.dice-tooltip');
    
    tooltipElements.forEach(tooltip => {
        // Entferne bestehende Event-Listener durch Klonen des Elements
        const newTooltip = tooltip.cloneNode(true);
        tooltip.parentNode.replaceChild(newTooltip, tooltip);
        
        // Füge die Event-Listener zum neuen Element hinzu
        newTooltip.addEventListener('mouseenter', () => {
            // Warte einen Moment, bis der Tooltip sichtbar ist
            setTimeout(() => {
                // Prüfe die Position des Tooltips
                const tooltipRect = newTooltip.getBoundingClientRect();
                const tooltipText = newTooltip.getAttribute('data-tooltip') || '';
                
                // Berechne die erwartete Position des Tooltips basierend auf der Textlänge
                const viewportWidth = window.innerWidth;
                const tooltipCenter = tooltipRect.left + (tooltipRect.width / 2);
                
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
                if (tooltipCenter - (tooltipWidth / 2) < 10) {
                    // Wenn der Tooltip links über den Bildschirmrand hinausragt
                    newTooltip.style.setProperty('--tooltip-left', '0');
                    newTooltip.style.setProperty('--tooltip-right', 'auto');
                    newTooltip.style.setProperty('--tooltip-transform', 'translateX(0)');
                }
                // Rechts
                else if (tooltipCenter + (tooltipWidth / 2) > viewportWidth - 10) {
                    // Wenn der Tooltip rechts über den Bildschirmrand hinausragt
                    newTooltip.style.setProperty('--tooltip-left', 'auto');
                    newTooltip.style.setProperty('--tooltip-right', '0');
                    newTooltip.style.setProperty('--tooltip-transform', 'translateX(0)');
                }
                // In der Mitte (Standard)
                else {
                    // Standard zentrierte Position
                    newTooltip.style.setProperty('--tooltip-left', '50%');
                    newTooltip.style.setProperty('--tooltip-right', 'auto');
                    newTooltip.style.setProperty('--tooltip-transform', 'translateX(-50%)');
                }
            }, 10);
        });
        
        // Zurücksetzen beim Verlassen des Elements
        newTooltip.addEventListener('mouseleave', () => {
            // Setze die Variablen zurück zu den Standardwerten
            newTooltip.style.removeProperty('--tooltip-left');
            newTooltip.style.removeProperty('--tooltip-right');
            newTooltip.style.removeProperty('--tooltip-transform');
        });
    });
    
    console.log(`Tooltip-Positionierung für ${tooltipElements.length} Würfel-Tooltips eingerichtet`);
}