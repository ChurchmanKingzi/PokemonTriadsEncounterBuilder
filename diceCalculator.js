/**
 * Klasse zur Berechnung und Bestimmung von Würfeltypen
 */
class DiceCalculator {
    /**
     * Bestimmt den Würfel-Typ für ein Pokémon basierend auf BST und anderen Kriterien
     * @param {Object} pokemonData - Pokémon-Daten
     * @returns {Object} - Würfel-Typ und Tooltip-Text
     */
    static determineDiceType(pokemonData) {
        if (!pokemonData) return null;
        
        // BST aus den Pokémon-Daten extrahieren
        const bst = pokemonData.baseStatTotal;
        const isLegendaryOrMythical = pokemonData.isLegendary || pokemonData.isMythical;
        const remainingEvolutions = pokemonData.remainingEvolutions || 0;
        const evolutionChainLength = (pokemonData.evolutionLevel || 0) + remainingEvolutions;
        const canEvolve = remainingEvolutions > 0;
        
        let diceType;
        let tooltipText;
        
        // Regeln für die Würfel-Zuweisung
        if (isLegendaryOrMythical) {
            diceType = '2W100';
            tooltipText = 'Legendäres/Mystisches Pokémon: 2W100';
        } else if (canEvolve && !isLegendaryOrMythical) {
            // NEUE REGEL: Pokémon, die sich noch entwickeln können (außer legendäre/mystische),
            // bekommen maximal einen W8
            if (bst >= 400) {
                diceType = '1W8';
                tooltipText = `BST: ${bst}, Kann sich noch entwickeln - maximal 1W8`;
            } else if (remainingEvolutions >= 2 || (remainingEvolutions === 1 && evolutionChainLength > 2)) {
                // Pokémon, die sich noch zweimal oder mehr entwickeln können
                // ODER Pokémon, die sich noch einmal entwickeln können, aber Teil einer längeren Evolutionskette sind
                diceType = '1W4';
                tooltipText = `BST: ${bst}, Kann sich noch mehrmals entwickeln - 1W4`;
            } else if (remainingEvolutions === 1 && evolutionChainLength <= 2) {
                // Pokémon, die sich genau einmal entwickeln können
                // (und nicht Teil einer 3-stufigen Evolution sind)
                diceType = '1W8';
                tooltipText = `BST: ${bst}, Kann sich noch einmal entwickeln - 1W8`;
            } else {
                diceType = '1W6';
                tooltipText = `BST: ${bst}, Kann sich noch entwickeln - 1W6`;
            }
        } else if (bst >= 600) {
            diceType = '1W20';
            tooltipText = `BST: ${bst} (≥600) - 1W20`;
        } else if (bst >= 550) {
            diceType = '2W8';
            tooltipText = `BST: ${bst} (≥550) - 2W8`;
        } else if (bst >= 500) {
            diceType = '2W6';
            tooltipText = `BST: ${bst} (≥500) - 2W6`;
        } else if (bst >= 450) {
            diceType = '1W12';
            tooltipText = `BST: ${bst} (≥450) - 1W12`;
        } else if (bst >= 400) {
            diceType = '1W10';
            tooltipText = `BST: ${bst} (≥400) - 1W10`;
        } else if (remainingEvolutions === 0 && pokemonData.evolutionLevel > 0) {
            // Pokémon, die sich nicht mehr entwickeln können (und nicht Basis-Pokémon sind)
            diceType = '1W10';
            tooltipText = `BST: ${bst}, Voll entwickelt - 1W10`;
        } else if (bst < 300) {
            diceType = '1W4';
            tooltipText = `BST: ${bst} (<300) - 1W4`;
        } else {
            diceType = '1W6';
            tooltipText = `BST: ${bst} - 1W6`;
        }
        
        return { diceType, tooltipText, isLegendaryOrMythical };
    }
}
