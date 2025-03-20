/**
 * Klasse zur Berechnung von Pokémon-Statuswerten
 */
class StatCalculator {
    constructor() {
        // Bindung von Methoden an den Klassenkontext
        this.validateStatInput = this.validateStatInput.bind(this);
    }
    
    /**
     * Berechnet den GENA und PA Wert für ein Pokémon
     * @param {Object} pokemonData - Pokémon-Daten
     * @returns {Object} - GENA und PA-Wert
     */
    calculateGenaPA(pokemonData) {
        if (pokemonData.isLegendary || pokemonData.isMythical) {
            return {
                gena: 100,
                pa: 100
            };
        }
        
        // Basiswert ist 6, +1 für jede durchgeführte Evolution
        const gena = 6 + (pokemonData.evolutionLevel || 0);
        // PA ist die Hälfte (aufgerundet) von GENA
        const pa = gena;
        
        return { gena, pa };
    }
    
    /**
     * Berechnet die Statuswerte eines Pokémon basierend auf Level und Basiswerten
     * @param {Object} pokemonData - Pokémon-Daten
     * @param {number} level - Level des Pokémon
     * @returns {Object} - Berechnete Statuswerte
     */
    calculatePokemonStats(pokemonData, level) {
        if (!pokemonData || !pokemonData.stats) return null;
        
        // Extrahiere die Basiswerte
        const baseStats = {};
        pokemonData.stats.forEach(stat => {
            switch (stat.stat.name) {
                case 'hp':
                    baseStats.hp = stat.base_stat;
                    break;
                case 'attack':
                    baseStats.attack = stat.base_stat;
                    break;
                case 'defense':
                    baseStats.defense = stat.base_stat;
                    break;
                case 'special-attack':
                    baseStats.specialAttack = stat.base_stat;
                    break;
                case 'special-defense':
                    baseStats.specialDefense = stat.base_stat;
                    break;
                case 'speed':
                    baseStats.speed = Math.ceil(stat.base_stat / 2);
                    break;
            }
        });
        
        // GENA und PA berechnen
        const { gena, pa } = this.calculateGenaPA(pokemonData);
        
        // Berechne die tatsächlichen Statuswerte auf dem gegebenen Level
        // Formel: Für KP: (Math.floor((2 * Basis + 0 + 0) * Level / 100) + Level + 10) * 3
        // Für andere: Math.floor((2 * Basis + 0 + 0) * Level / 100) + 5
        const hp = (Math.floor((2 * baseStats.hp * level) / 100) + level + 10) * 3; // KP verdreifacht
        const attack = Math.floor((2 * baseStats.attack * level) / 100) + 5;
        const defense = Math.floor((2 * baseStats.defense * level) / 100) + 5;
        const specialAttack = Math.floor((2 * baseStats.specialAttack * level) / 100) + 5;
        const specialDefense = Math.floor((2 * baseStats.specialDefense * level) / 100) + 5;
        const speed = Math.floor((2 * baseStats.speed * level) / 100) + 5;

        if (pokemonData.isLegendary || pokemonData.isMythical) {
            return {
                gena: gena,
                hp: hp*10,
                attack: attack*10,
                specialAttack: specialAttack*10,
                pa: pa,
                speed: speed*3,
                defense: defense*10,
                specialDefense: specialDefense*10
            };
        }else{
            return {
                gena: gena,
                hp: hp,
                attack: attack,
                specialAttack: specialAttack,
                pa: pa,
                speed: speed,
                defense: defense,
                specialDefense: specialDefense
            };
        }
    }
    
    /**
     * Validiert die Eingabe eines Statuswertes
     * @param {Event} event - Das Input-Event
     */
    validateStatInput(event) {
        const input = event.target;
        const value = parseInt(input.value);
        
        // Speichere den aktuellen Wert als vorherigen Wert
        if (!input.hasAttribute('data-prev-value')) {
            input.setAttribute('data-prev-value', input.value);
        }
        
        // Überprüfe, ob der Wert eine positive Zahl ist
        if (isNaN(value) || value < 1) {
            // Wenn ungültig, stelle den vorherigen Wert wieder her
            input.value = input.getAttribute('data-prev-value');
        } else {
            // Wenn gültig, aktualisiere den vorherigen Wert
            input.setAttribute('data-prev-value', value);
        }
    }
}