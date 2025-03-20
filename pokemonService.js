/**
 * Service zum Laden und Verarbeiten von Pokémon-Daten
 */
class PokemonService {
    constructor() {
        this.pokemonMap = new Map();
        this.germanNamesMap = new Map();
        this.legendaryMythicalMap = new Map();
        this.evolutionMap = new Map();
    }

    /**
     * Lädt alle benötigten Pokémon-Daten
     * @returns {Promise<Array>} - Sortierte Liste aller Pokémon
     */
    async loadAllPokemonData() {
        try {
            // Lade Basis-Pokémon-Liste
            const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
            const data = await response.json();
            
            // Lade deutsche Namen und Legendary/Mythical Status
            await this.loadSpeciesData(data.results);
            
            // Lade detaillierte Pokémon-Daten
            await this.loadPokemonDetails(data.results);
            
            // Sortiere nach ID und gib zurück
            return Array.from(this.pokemonMap.values()).sort((a, b) => a.id - b.id);
        } catch (error) {
            console.error('Fehler beim Laden der Pokémon-Daten:', error);
            throw error;
        }
    }

    /**
     * Lädt die Spezies-Daten für alle Pokémon (deutsche Namen, legendary/mythical Status)
     * @param {Array} pokemonList - Liste der Pokémon
     */
    async loadSpeciesData(pokemonList) {
        try {
            const speciesPromises = pokemonList.map(pokemon => 
                fetch(pokemon.url.replace('/pokemon/', '/pokemon-species/'))
                    .then(res => res.json())
                    .catch(err => {
                        console.error(`Fehler beim Laden der Pokémon-Spezies für ${pokemon.name}:`, err);
                        return null;
                    })
            );
            
            const speciesData = await Promise.all(speciesPromises);
            
            speciesData.forEach(species => {
                if (species && species.id) {
                    // Deutsche Namen
                    if (species.names) {
                        const germanName = species.names.find(name => name.language.name === 'de');
                        if (germanName) {
                            this.germanNamesMap.set(species.id, germanName.name);
                        }
                    }
                    
                    // Legendary/Mythical Status
                    this.legendaryMythicalMap.set(species.id, {
                        isLegendary: species.is_legendary || false,
                        isMythical: species.is_mythical || false
                    });
                    
                    // Evolution Chain Information
                    if (species.evolution_chain && species.evolution_chain.url) {
                        // Extrahiere die Evolution Chain ID aus der URL
                        const evolutionChainId = species.evolution_chain.url.split('/').filter(Boolean).pop();
                        this.loadEvolutionData(evolutionChainId, species.id);
                    }
                }
            });
        } catch (error) {
            console.error('Fehler beim Laden der Spezies-Daten:', error);
            throw error;
        }
    }
    
    /**
     * Lädt Evolutionsdaten für ein Pokémon
     * @param {string} chainId - ID der Evolutionskette
     * @param {number} pokemonId - ID des Pokémons
     */
    async loadEvolutionData(chainId, pokemonId) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/evolution-chain/${chainId}/`);
            const data = await response.json();
            
            // Analysiere die gesamte Evolutionskette, um die maximale Tiefe zu ermitteln
            const getMaxEvolutionDepth = (chain) => {
                if (!chain || !chain.evolves_to || chain.evolves_to.length === 0) {
                    return 0;
                }
                
                const depths = chain.evolves_to.map(evolution => 1 + getMaxEvolutionDepth(evolution));
                return Math.max(...depths);
            };
            
            const totalEvolutionStages = 1 + getMaxEvolutionDepth(data.chain); // +1 für die Basis-Form
            
            // Rekursive Funktion, um zu finden, wo ein Pokémon in der Evolutionskette steht
            // und wie viele Evolutionen es noch vor sich hat
            const findPokemonInChain = (chain, currentLevel = 0, path = []) => {
                if (!chain) return null;
                
                const speciesId = parseInt(chain.species.url.split('/').filter(Boolean).pop());
                path.push(speciesId);
                
                // Wenn wir das gesuchte Pokémon gefunden haben
                if (speciesId === pokemonId) {
                    // Finde die maximale Tiefe von diesem Punkt aus
                    const remainingLevels = getMaxEvolutionDepth(chain);
                    
                    return {
                        evolutionLevel: currentLevel,         // Aktuelle Evolutionsstufe
                        remainingEvolutions: remainingLevels, // Verbleibende Evolutionsstufen
                        evolutionChainLength: totalEvolutionStages, // Gesamtlänge der Kette
                        evolutionPath: path                  // Pfad in der Evolutionskette
                    };
                }
                
                // Suche in allen Evolutionen
                for (const evolution of chain.evolves_to) {
                    const result = findPokemonInChain(evolution, currentLevel + 1, [...path]);
                    if (result) return result;
                }
                
                return null;
            };
            
            const evolutionInfo = findPokemonInChain(data.chain);
            
            if (evolutionInfo) {
                this.evolutionMap.set(pokemonId, evolutionInfo);
            }
        } catch (error) {
            console.error(`Fehler beim Laden der Evolutionsdaten für Pokémon ${pokemonId}:`, error);
        }
    }

    /**
     * Lädt die detaillierten Daten für alle Pokémon
     * @param {Array} pokemonList - Liste der Pokémon
     */
    async loadPokemonDetails(pokemonList) {
        try {
            const pokemonPromises = pokemonList.map(pokemon => 
                fetch(pokemon.url)
                    .then(res => res.json())
                    .catch(err => {
                        console.error(`Fehler beim Laden der Pokémon-Daten für ${pokemon.name}:`, err);
                        return null;
                    })
            );
            
            const pokemonData = await Promise.all(pokemonPromises);
            
            pokemonData.forEach(pokemon => {
                if (pokemon && pokemon.id <= 1025) {
                    // Füge deutsche Namen hinzu
                    pokemon.germanName = this.germanNamesMap.get(pokemon.id);
                    
                    // Füge Legendary/Mythical Status hinzu
                    const legendaryStatus = this.legendaryMythicalMap.get(pokemon.id) || { isLegendary: false, isMythical: false };
                    pokemon.isLegendary = legendaryStatus.isLegendary;
                    pokemon.isMythical = legendaryStatus.isMythical;
                    
                    // Berechne Base Stat Total (BST)
                    pokemon.baseStatTotal = this.calculateBST(pokemon);
                    
                    // Füge Evolutionsinformationen hinzu
                    const evolutionInfo = this.evolutionMap.get(pokemon.id) || { remainingEvolutions: 0, evolutionLevel: 0 };
                    pokemon.remainingEvolutions = evolutionInfo.remainingEvolutions;
                    pokemon.evolutionLevel = evolutionInfo.evolutionLevel;
                    
                    this.pokemonMap.set(pokemon.id, pokemon);
                }
            });
        } catch (error) {
            console.error('Fehler beim Laden der Pokémon-Details:', error);
            throw error;
        }
    }

    /**
     * Berechnet den Base Stat Total (BST) eines Pokémon
     * @param {Object} pokemon - Pokémon-Daten
     * @returns {number} - Base Stat Total
     */
    calculateBST(pokemon) {
        if (!pokemon || !pokemon.stats) return 0;
        
        return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
    }

    /**
     * Gibt ein Pokémon anhand seiner ID zurück
     * @param {number} id - Pokémon-ID
     * @returns {Object|null} - Pokémon-Daten oder null
     */
    getPokemonById(id) {
        return id ? this.pokemonMap.get(Number(id)) : null;
    }

    getAllPokemon() {
        return Array.from(this.pokemonMap.values()).sort((a, b) => a.id - b.id);
    }
}