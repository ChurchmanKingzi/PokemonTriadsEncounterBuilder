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
