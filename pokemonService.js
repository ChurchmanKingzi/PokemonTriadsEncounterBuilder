/**
 * Service zum Laden und Verarbeiten von Pokémon-Daten
 */
class PokemonService {
    constructor() {
        this.pokemonMap = new Map();
        this.germanNamesMap = new Map();
        this.legendaryMythicalMap = new Map();
        this.evolutionMap = new Map();
        this.specialFormsMap = new Map();
    }

    async loadAllPokemonData() {
        try {
            // Lade Basis-Pokémon-Liste (Original-Pokémon)
            const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
            const data = await response.json();
            
            // Lade deutsche Namen und Legendary/Mythical Status für Original-Pokémon
            await this.loadSpeciesData(data.results);
            
            // Lade detaillierte Pokémon-Daten für Original-Pokémon
            await this.loadPokemonDetails(data.results);
            
            // Zweite Ladephase: Lade Pokémon mit IDs 10001-10277 (regionale Formen, etc.)
            const additionalPokemon = [];
            for (let id = 10001; id <= 10277; id++) {
                additionalPokemon.push({
                    name: `pokemon-form-${id}`,
                    url: `https://pokeapi.co/api/v2/pokemon/${id}/`
                });
            }
            
            console.log(`Lade ${additionalPokemon.length} zusätzliche Pokémon-Formen...`);
            
            // Lade deutsche Namen und Legendary/Mythical Status für zusätzliche Pokémon
            await this.loadSpeciesData(additionalPokemon, true);
            
            // Lade detaillierte Pokémon-Daten für zusätzliche Pokémon
            await this.loadPokemonDetails(additionalPokemon, true);
            
            // Sortiere nach ID und gib zurück
            // GEÄNDERT: Zeige nun ALLE Pokémon, inklusive Spezialformen
            return Array.from(this.pokemonMap.values()).sort((a, b) => {
                // Sortiere zuerst nach der Basis-ID (reguläre Pokémon zuerst)
                const aBaseId = a.baseId || a.id;
                const bBaseId = b.baseId || b.id;
                
                if (aBaseId !== bBaseId) {
                    return aBaseId - bBaseId;
                }
                
                // Bei gleichem Basis-Pokémon: Zeige Originalformen vor Spezialformen
                // und sortiere Spezialformen nach ihrer eigentlichen ID
                if (a.id < 10000 && b.id >= 10000) return -1;
                if (a.id >= 10000 && b.id < 10000) return 1;
                return a.id - b.id;
            });
        } catch (error) {
            console.error('Fehler beim Laden der Pokémon-Daten:', error);
            throw error;
        }
    }

    /**
     * Lädt die Spezies-Daten für alle Pokémon (deutsche Namen, legendary/mythical Status)
     * @param {Array} pokemonList - Liste der Pokémon
     * @param {boolean} isSpecialForm - Handelt es sich um Spezialformen (IDs 10001+)
     */
    async loadSpeciesData(pokemonList, isSpecialForm = false) {
        try {
            const speciesPromises = pokemonList.map(pokemon => {
                // Extrahiere die ID aus der URL, um zu prüfen, ob es sich um eine spezielle Form handelt
                const urlParts = pokemon.url.split('/');
                const idFromUrl = parseInt(urlParts[urlParts.length - 2]);
                
                if (!isSpecialForm && idFromUrl < 10001) {
                    // Standard-Pokémon (IDs 1-1025): Verwende pokemon-species direkt
                    return fetch(pokemon.url.replace('/pokemon/', '/pokemon-species/'))
                        .then(res => res.json())
                        .catch(err => {
                            console.error(`Fehler beim Laden der Pokémon-Spezies für ${pokemon.name}:`, err);
                            return null;
                        });
                } else {
                    // Spezielle Formen (IDs 10001+): Holen zuerst die Pokémon-Daten, dann die Spezies
                    return fetch(pokemon.url)
                        .then(res => res.json())
                        .then(pokemonData => {
                            if (pokemonData && pokemonData.species && pokemonData.species.url) {
                                // Speichere die Verknüpfung zwischen Spezialform und Basis-Pokémon
                                if (isSpecialForm) {
                                    const speciesUrlParts = pokemonData.species.url.split('/');
                                    const speciesId = parseInt(speciesUrlParts[speciesUrlParts.length - 2]);
                                    
                                    this.specialFormsMap.set(idFromUrl, {
                                        baseId: speciesId,
                                        formName: this.extractFormName(pokemonData)
                                    });
                                }
                                
                                return fetch(pokemonData.species.url)
                                    .then(res => res.json());
                            }
                            return null;
                        })
                        .catch(err => {
                            console.error(`Fehler beim Laden der Pokémon-Spezies für Form ${pokemon.name}:`, err);
                            return null;
                        });
                }
            });
            
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
     * Extrahiert den Formnamen aus den Pokémon-Daten
     * @param {Object} pokemonData - Die Pokémon-Daten
     * @returns {string} - Der extrahierte Formname
     */
     extractFormName(pokemonData) {
        // Versuche, den Formnamen aus verschiedenen Quellen zu extrahieren
        
        // 1. Versuche es mit forms.form.name
        if (pokemonData.forms && pokemonData.forms[0] && pokemonData.forms[0].form && pokemonData.forms[0].form.name) {
            return this.formatFormName(pokemonData.forms[0].form.name);
        }
        
        // 2. Versuche es mit forms.name
        if (pokemonData.forms && pokemonData.forms[0] && pokemonData.forms[0].name) {
            const formName = pokemonData.forms[0].name;
            // Wenn der Formname mit dem Pokémon-Namen beginnt, extrahiere nur den Form-Teil
            if (formName.includes('-')) {
                const parts = formName.split('-');
                return this.formatFormName(parts.slice(1).join('-'));
            }
            return this.formatFormName(formName);
        }
        
        // 3. Versuche es mit dem Pokémon-Namen selbst
        if (pokemonData.name && pokemonData.name.includes('-')) {
            const parts = pokemonData.name.split('-');
            return this.formatFormName(parts.slice(1).join('-'));
        }
        
        // Fallback: Standardform
        return 'Form';
    }
    
     /**
     * Formatiert einen Formnamen für die Anzeige
     * @param {string} formName - Der zu formatierende Formname
     * @returns {string} - Der formatierte Formname
     */
     formatFormName(formName) {
        // Entferne spezielle Zeichen und ersetze Bindestriche durch Leerzeichen
        formName = formName.replace(/-/g, ' ');
        
        // Bekannte Formen in deutsche Bezeichnungen übersetzen
        const formTranslations = {
            'alola': 'Alola',
            'galar': 'Galar',
            'hisui': 'Hisui',
            'mega': 'Mega',
            'gmax': 'Gigadynamax',
            'primal': 'Proto',
            'origin': 'Urform',
            'therian': 'Tiergeistform',
            'incarnate': 'Inkarnationsform',
            'black': 'Schwarz',
            'white': 'Weiß',
            'attack': 'Angriffsform',
            'defense': 'Verteidigungsform',
            'speed': 'Initiativeform',
            'plant': 'Pflanzenumhang',
            'sandy': 'Sandumhang',
            'trash': 'Lumpenumhang',
            'sunshine': 'Sonnenform',
            'rain': 'Regenform',
            'snow': 'Schneeform',
            'heat': 'Hitzeform',
            'wash': 'Waschform',
            'frost': 'Frostform',
            'fan': 'Rotationsform',
            'mow': 'Schneidform',
            'sky': 'Zenitform',
            'land': 'Landform',
            'altered': 'Wandelform',
            'blade': 'Klingenform',
            'shield': 'Schildform',
            'small': 'Klein',
            'large': 'Groß',
            'super': 'Supergroß',
            'average': 'Durchschnitt',
            'paldea': 'Paldea',
            'paldea solitary': 'Paldea (einzeln)',
            'paldea four': 'Paldea (vier)',
            'dusk': 'Dämmerungsform',
            'dawn': 'Morgendämmerungsform',
            'midday': 'Tagform',
            'midnight': 'Nachtform',
            'school': 'Schwarmform',
            'solo': 'Einzelform',
            'pau': 'Pau-Stil',
            'sensu': 'Sensu-Stil',
            'baile': 'Flamenco-Stil',
            'pompom': 'Cheerleading-Stil',
            'dawn wings': 'Morgenlichtflügel',
            'dusk mane': 'Abendmähnenlicht',
            'ultra': 'Ultra',
            'female': 'Weiblich',
            'male': 'Männlich',
            'eternamax': 'Eternamax',
            'zen': 'Zen-Modus',
            'galar zen': 'Galar Zen-Modus',
            'crowned': 'Gekrönt',
            'crowned sword': 'Gekröntes Schwert',
            'crowned shield': 'Gekrönter Schild',
            'ice rider': 'Eisreiter',
            'shadow rider': 'Schattenreiter',
            'rapid strike': 'Reiherform',
            'single strike': 'Dunkelmähnenform'
        };
        
        // Wörter im Formnamen kapitalisieren
        let formattedName = formName.split(' ').map(word => {
            // Übersetze bekannte Formen
            if (formTranslations[word.toLowerCase()]) {
                return formTranslations[word.toLowerCase()];
            }
            // Kapitalisiere das erste Zeichen jedes Wortes
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
        
        // Überprüfe auch auf zusammengesetzte Formnamen
        Object.keys(formTranslations).forEach(key => {
            if (formName.toLowerCase().includes(key)) {
                formattedName = formattedName.replace(
                    new RegExp(key, 'gi'), 
                    formTranslations[key]
                );
            }
        });
        
        return formattedName;
    }
    
    /**
     * Lädt Evolutionsdaten für ein Pokémon - aktualisierte Version mit Level-Informationen
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
            
            // Neue Funktion zum Extrahieren der Level-Informationen aus einer Evolution
            const extractEvolutionLevel = (evolution) => {
                // Standard-Trigger ist "level-up", aber wir suchen speziell nach min_level
                let minLevel = 0;
                
                if (evolution && evolution.evolution_details && evolution.evolution_details.length > 0) {
                    const details = evolution.evolution_details[0]; // Nehme den ersten Eintrag
                    if (details.min_level) {
                        minLevel = details.min_level;
                    } else if (details.trigger && details.trigger.name === "level-up") {
                        // Wenn es ein Level-Up-Trigger ist, aber kein min_level angegeben ist,
                        // setze ein Standard-Level (z.B. 20)
                        minLevel = 20;
                    }
                    // Andere Trigger wie Items, Tausch usw. bleiben bei 0
                }
                
                return minLevel;
            };
            
            // Erweiterte rekursive Funktion, um zu finden, wo ein Pokémon in der Evolutionskette steht
            // und wie viele Evolutionen es noch vor sich hat, sowie die Level-Anforderungen
            const findPokemonInChain = (chain, currentLevel = 0, path = [], evolutionLevels = []) => {
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
                        evolutionPath: path,                  // Pfad in der Evolutionskette
                        firstEvolutionLevel: evolutionLevels[0] || 0,  // Level der ersten Evolution
                        secondEvolutionLevel: evolutionLevels[1] || 0   // Level der zweiten Evolution
                    };
                }
                
                // Suche in allen Evolutionen
                for (const evolution of chain.evolves_to) {
                    // Extrahiere das Level für diese Evolution
                    const evolutionLevel = extractEvolutionLevel(evolution);
                    
                    // Kopiere die evolutionLevels und füge das neue Level hinzu
                    const updatedLevels = [...evolutionLevels, evolutionLevel];
                    
                    const result = findPokemonInChain(evolution, currentLevel + 1, [...path], updatedLevels);
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
     * @param {boolean} isSpecialForm - Handelt es sich um Spezialformen (IDs 10001+)
     */
    async loadPokemonDetails(pokemonList, isSpecialForm = false) {
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
                if (pokemon) {
                    // Ignoriere id === 0 (oft ein API-Fehler)
                    if (pokemon.id === 0) return;
                    
                    // Spezielle Behandlung für Spezialformen
                    if (isSpecialForm && pokemon.id >= 10001) {
                        const specialFormInfo = this.specialFormsMap.get(pokemon.id);
                        
                        if (specialFormInfo) {
                            // Setze die Basis-ID als direktes Feld
                            pokemon.baseId = specialFormInfo.baseId;
                            
                            // Versuche, den Namen zu generieren
                            const basePokemonName = this.germanNamesMap.get(specialFormInfo.baseId);
                            if (basePokemonName) {
                                pokemon.germanName = `${basePokemonName} (${specialFormInfo.formName})`;
                            } else {
                                // Fallback zum englischen Namen mit Formname
                                const speciesName = pokemon.species ? pokemon.species.name : "Unbekannt";
                                pokemon.germanName = `${speciesName.charAt(0).toUpperCase() + speciesName.slice(1)} (${specialFormInfo.formName})`;
                            }
                        } else {
                            pokemon.germanName = `Form #${pokemon.id}`;
                        }
                    } else {
                        // Reguläre Pokémon-Behandlung
                        // Füge deutsche Namen hinzu
                        pokemon.germanName = this.germanNamesMap.get(pokemon.id);
                    }
                    
                    // Füge Legendary/Mythical Status hinzu
                    const legendaryStatus = this.legendaryMythicalMap.get(pokemon.id) || 
                                           (pokemon.baseId ? this.legendaryMythicalMap.get(pokemon.baseId) : null) ||
                                           { isLegendary: false, isMythical: false };
                    pokemon.isLegendary = legendaryStatus.isLegendary;
                    pokemon.isMythical = legendaryStatus.isMythical;
                    
                    // Berechne Base Stat Total (BST)
                    pokemon.baseStatTotal = this.calculateBST(pokemon);
                    
                    // Füge Evolutionsinformationen hinzu
                    const evolutionInfo = this.evolutionMap.get(pokemon.id) || 
                                         (pokemon.baseId ? this.evolutionMap.get(pokemon.baseId) : null) || 
                                         { 
                                            remainingEvolutions: 0, 
                                            evolutionLevel: 0,
                                            firstEvolutionLevel: 0,
                                            secondEvolutionLevel: 0
                                         };
                    
                    pokemon.remainingEvolutions = evolutionInfo.remainingEvolutions;
                    pokemon.evolutionLevel = evolutionInfo.evolutionLevel;
                    // Füge die neuen Level-Informationen hinzu
                    pokemon.firstEvolutionLevel = evolutionInfo.firstEvolutionLevel;
                    pokemon.secondEvolutionLevel = evolutionInfo.secondEvolutionLevel;
                    
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

    getPokemonById(id) {
        return id ? this.pokemonMap.get(Number(id)) : null;
    }

    getAllPokemon() {
        return Array.from(this.pokemonMap.values()).sort((a, b) => {
            // Sortiere zuerst nach der Basis-ID (reguläre Pokémon zuerst)
            const aBaseId = a.baseId || a.id;
            const bBaseId = b.baseId || b.id;
            
            if (aBaseId !== bBaseId) {
                return aBaseId - bBaseId;
            }
            
            // Bei gleichem Basis-Pokémon: Zeige Originalformen vor Spezialformen
            // und sortiere Spezialformen nach ihrer eigentlichen ID
            if (a.id < 10000 && b.id >= 10000) return -1;
            if (a.id >= 10000 && b.id < 10000) return 1;
            return a.id - b.id;
        });
    }

    /**
     * Gibt alle Pokémon zurück, gruppiert nach Basis-Pokémon
     * @returns {Object} - Gruppierte Pokémon-Liste
     */
    getAllPokemonGrouped() {
        const groupedPokemon = new Map();
        
        // Erst alle Basis-Pokémon sammeln
        this.pokemonMap.forEach(pokemon => {
            const baseId = pokemon.baseId || pokemon.id;
            
            if (!groupedPokemon.has(baseId)) {
                groupedPokemon.set(baseId, {
                    base: pokemon.baseId ? null : pokemon, // Nur setzen, wenn es ein Basis-Pokémon ist
                    forms: []
                });
            }
            
            // Wenn es eine Spezialform ist, zur forms-Liste hinzufügen
            if (pokemon.baseId) {
                const group = groupedPokemon.get(baseId);
                group.forms.push(pokemon);
            }
        });
        
        // Sortiere die Formen innerhalb jeder Gruppe
        groupedPokemon.forEach(group => {
            group.forms.sort((a, b) => a.id - b.id);
        });
        
        return groupedPokemon;
    }
}