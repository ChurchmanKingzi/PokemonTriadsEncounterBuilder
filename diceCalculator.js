/**
 * Klasse zur Berechnung und Bestimmung von Würfeltypen
 */
class DiceCalculator {
    // Statischer Cache für bereits berechnete Würfelklassen
    static diceTypeCache = new Map();
    
    /**
     * Bestimmt den Würfel-Typ für ein Pokémon basierend auf BST und anderen Kriterien
     * @param {Object} pokemonData - Pokémon-Daten
     * @param {boolean} isRecursiveCall - Gibt an, ob es sich um einen rekursiven Aufruf handelt
     * @returns {Object} - Würfel-Typ und Tooltip-Text
     */
    static determineDiceType(pokemonData, isRecursiveCall = false) {
        if (!pokemonData) return null;
        
        // Wenn im Cache, dann direkt zurückgeben (aber nur wenn kein rekursiver Aufruf)
        if (!isRecursiveCall && this.diceTypeCache.has(pokemonData.id)) {
            return this.diceTypeCache.get(pokemonData.id);
        }
        
        // Daten aus dem pokemonData-Objekt extrahieren
        const bst = pokemonData.baseStatTotal;
        const isLegendaryOrMythical = pokemonData.isLegendary || pokemonData.isMythical;
        const evolutionLevel = pokemonData.evolutionLevel || 0;
        const remainingEvolutions = pokemonData.remainingEvolutions || 0;
        const firstEvolutionLevel = pokemonData.firstEvolutionLevel || 0;
        const secondEvolutionLevel = pokemonData.secondEvolutionLevel || 0;
        
        // Log für Debugging-Zwecke
        console.log(`Pokemon ${pokemonData.name} (ID: ${pokemonData.id}):`);
        console.log(`  BST: ${bst}, Evolution Level: ${evolutionLevel}, Remaining Evolutions: ${remainingEvolutions}`);
        console.log(`  First Evolution Level: ${firstEvolutionLevel}, Second Evolution Level: ${secondEvolutionLevel}`);
        console.log(`  Is Legendary/Mythical: ${isLegendaryOrMythical}`);
        
        // Definiere die möglichen Würfelklassen in Reihenfolge
        const diceClasses = ['1W4', '1W6', '1W8', '1W10', '1W12', '2W6', '2W8', '2W10', '2W12', '2W100'];
        
        // Wenn legendär oder mystisch, direkt 2W100 zurückgeben
        if (isLegendaryOrMythical) {
            const result = {
                diceType: '2W100',
                tooltipText: 'Legendäres/Mystisches Pokémon: 2W100',
                isLegendaryOrMythical
            };
            
            // Im Cache speichern, falls kein rekursiver Aufruf
            if (!isRecursiveCall) {
                this.diceTypeCache.set(pokemonData.id, result);
            }
            
            return result;
        }
        
        // Basistyp anhand des BST bestimmen
        let diceType;
        if (bst <= 299) {
            diceType = '1W4';
        } else if (bst <= 400) {
            diceType = '1W6';
        } else if (bst <= 450) {
            diceType = '1W8';
        } else if (bst <= 500) {
            diceType = '1W10';
        } else if (bst <= 550) {
            diceType = '1W12';
        } else {
            diceType = '2W6';
        }
        
        let tooltipText = `Basis BST: ${bst} - ${diceType}`;
        let adjustments = [];
        let finalDiceClass = diceClasses.indexOf(diceType);
        
        // Sonderregeln für die Würfelklassen-Anpassung
        
        // Regel 1: Pokemon, die sich gar nicht entwickeln können und noch nicht entwickelt haben
        const isBaseFormWithoutEvolution = evolutionLevel === 0 && remainingEvolutions === 0;
        if (isBaseFormWithoutEvolution) {
            const baseIndex = diceClasses.indexOf(diceType);
            const compareToIndex = diceClasses.indexOf('1W10');
            
            if (baseIndex < compareToIndex) {
                // Aufwertung um eine Klasse
                finalDiceClass = Math.min(finalDiceClass + 1, diceClasses.length - 2); // Nicht 2W100 (reserviert für Legendäre)
                adjustments.push('Basisform ohne Entwicklung (Aufwertung)');
            } else if (baseIndex > compareToIndex) {
                // Abwertung um eine Klasse
                finalDiceClass = Math.max(finalDiceClass - 1, 0);
                adjustments.push('Basisform ohne Entwicklung (Abwertung)');
            }
        }
        
        // Regel 2: Pokemon, die sich bereits zweimal entwickelt haben
        const hasTwoEvolutions = evolutionLevel === 2;
        if (hasTwoEvolutions) {
            finalDiceClass = Math.min(finalDiceClass + 1, diceClasses.length - 2); // Nicht 2W100
            adjustments.push('Zweimal entwickelt (Aufwertung)');
        }
        
        // Regel 3 & 4: Level-Entwicklungs-Boni
        // Pokemon, die mindestens einmal entwickelt wurden
        const hasEvolved = evolutionLevel >= 1;
        if (hasEvolved) {
            // Prüfen auf Entwicklung bei Lv 32+
            if (firstEvolutionLevel >= 32) {
                finalDiceClass = Math.min(finalDiceClass + 1, diceClasses.length - 2);
                adjustments.push(`Erste Entwicklung ab Level ${firstEvolutionLevel} (Aufwertung)`);
                
                // Zusätzlicher Bonus für Lv 42+
                if (firstEvolutionLevel >= 42) {
                    finalDiceClass = Math.min(finalDiceClass + 1, diceClasses.length - 2);
                    adjustments.push('Erste Entwicklung ab Level 42+ (zusätzliche Aufwertung)');
                }
            }
            
            // Regel 5: Entwicklung auf Level 50+
            if (firstEvolutionLevel >= 50 || (evolutionLevel >= 2 && secondEvolutionLevel >= 50)) {
                finalDiceClass = Math.min(finalDiceClass + 1, diceClasses.length - 2);
                adjustments.push('Entwicklung ab Level 50+ (Aufwertung)');
            }
        }
        
        // Endgültigen Würfeltyp bestimmen
        let finalDiceType = diceClasses[finalDiceClass];
        
        // Tooltip-Text mit Anpassungsinformationen aktualisieren
        if (adjustments.length > 0) {
            tooltipText += ` → ${finalDiceType} (${adjustments.join(', ')})`;
        } else {
            tooltipText += ` (keine Anpassungen)`;
        }
        
        // Ergebnis erstellen
        const result = { 
            diceType: finalDiceType,
            diceClass: finalDiceClass, // Speichere die Würfelklasse für Vergleiche
            tooltipText, 
            isLegendaryOrMythical 
        };
        
        // Im Cache speichern, falls kein rekursiver Aufruf
        if (!isRecursiveCall) {
            this.diceTypeCache.set(pokemonData.id, result);
            
            // NEUE REGEL: Vergleiche mit Vorentwicklung
            // Wenn das Pokémon eine Vorentwicklung hat (evolutionLevel > 0)
            if (evolutionLevel > 0) {
                this.compareWithPreEvolution(pokemonData, result, adjustments, diceClasses);
            }
        }
        
        return result;
    }
    
    /**
     * Vergleicht die Würfelklasse eines Pokémon mit seiner Vorentwicklung
     * und passt die Würfelklasse an, falls nötig
     * @param {Object} pokemonData - Pokémon-Daten
     * @param {Object} result - Berechnetes Würfel-Ergebnis
     * @param {Array} adjustments - Liste der Anpassungen
     * @param {Array} diceClasses - Liste der Würfelklassen
     */
    static compareWithPreEvolution(pokemonData, result, adjustments, diceClasses) {
        try {
            // Zugriff auf das globale pokemonApp-Objekt
            const pokemonApp = window.pokemonApp;
            if (!pokemonApp || !pokemonApp.pokemonService) return;
            
            // Hole Pokémon-Service
            const pokemonService = pokemonApp.pokemonService;
            
            // Hole die Evolutionsinformationen
            const evolutionInfo = pokemonService.evolutionMap.get(pokemonData.id);
            if (!evolutionInfo || !evolutionInfo.evolutionPath || evolutionInfo.evolutionPath.length <= 1) return;
            
            // Hole die ID der direkten Vorentwicklung
            const preEvolutionId = evolutionInfo.evolutionPath[evolutionInfo.evolutionPath.length - 2];
            if (!preEvolutionId) return;
            
            // Hole die Vorentwicklung
            const preEvolution = pokemonService.getPokemonById(preEvolutionId);
            if (!preEvolution) return;
            
            console.log(`Vergleiche ${pokemonData.name} mit Vorentwicklung ${preEvolution.name}`);
            
            // Berechne die Würfelklasse der Vorentwicklung (rekursiver Aufruf)
            const preEvolutionDiceInfo = this.determineDiceType(preEvolution, true);
            if (!preEvolutionDiceInfo) return;
            
            console.log(`Würfelklasse von ${pokemonData.name}: ${result.diceType}, Würfelklasse von ${preEvolution.name}: ${preEvolutionDiceInfo.diceType}`);
            
            // Vergleiche die Würfelklassen
            const currentDiceClass = diceClasses.indexOf(result.diceType);
            const preEvolutionDiceClass = diceClasses.indexOf(preEvolutionDiceInfo.diceType);
            
            // Wenn die aktuelle Würfelklasse kleiner oder gleich der Vorentwicklung ist
            if (currentDiceClass <= preEvolutionDiceClass) {
                // Erhöhe die Würfelklasse um 1 (aber maximal bis 2W12)
                const newDiceClass = Math.min(currentDiceClass + 1, diceClasses.length - 2);
                const newDiceType = diceClasses[newDiceClass];
                
                console.log(`Erhöhe Würfelklasse von ${pokemonData.name} von ${result.diceType} auf ${newDiceType}`);
                
                // Aktualisiere das Ergebnis
                result.diceType = newDiceType;
                result.diceClass = newDiceClass;
                
                // Aktualisiere die Anpassungen
                adjustments.push(`Aufwertung: Vorentwicklung ${preEvolution.germanName || preEvolution.name} hat gleiche/höhere Würfelklasse`);
                
                // Aktualisiere den Tooltip-Text
                result.tooltipText = result.tooltipText.replace(/→ [^\(]+/, `→ ${newDiceType} `);
                
                // Wenn noch keine Anpassungen im Tooltip-Text vorhanden sind, füge sie hinzu
                if (!result.tooltipText.includes('(')) {
                    result.tooltipText = result.tooltipText.replace(' (keine Anpassungen)', ` (${adjustments.join(', ')})`);
                } 
                // Sonst aktualisiere die bestehenden Anpassungen
                else {
                    result.tooltipText = result.tooltipText.replace(/\([^)]+\)/, `(${adjustments.join(', ')})`);
                }
            }
        } catch (error) {
            console.error('Fehler beim Vergleichen mit der Vorentwicklung:', error);
        }
    }
    
    /**
     * Löscht den Cache, um die Würfelklassen neu zu berechnen
     */
    static clearCache() {
        this.diceTypeCache.clear();
    }
}