/**
 * Service zum Laden und Verarbeiten von Pokémon-Attacken
 */
class MoveService {
    constructor() {
        this.movesMap = new Map();
        this.germanMovesMap = new Map();
        this.allMoves = [];
        this.tmMoves = new Map(); // TM/VM Nummern zu Move IDs
    }

    /**
     * Lädt alle Attackendaten
     * @returns {Promise<Array>} - Liste aller Attacken
     */
    async loadAllMoveData() {
        try {
            // Lade Basis-Attacken-Liste
            const response = await fetch('https://pokeapi.co/api/v2/move?limit=850');
            const data = await response.json();
            
            // Lade TM/VM Daten
            await this.loadTMMoveData();
            
            // Lade detaillierte Attackendaten
            await this.loadMoveDetails(data.results);
            
            // Sortiere nach ID und gib zurück
            this.allMoves = Array.from(this.movesMap.values()).sort((a, b) => a.id - b.id);
            return this.allMoves;
        } catch (error) {
            console.error('Fehler beim Laden der Attackendaten:', error);
            throw error;
        }
    }

    /**
     * Lädt TM/VM Nummern für Attacken - vereinfachte Version ohne Nummern
     */
    async loadTMMoveData() {
        // In dieser vereinfachten Version machen wir nichts,
        // da wir keine TM/VM-Nummern mehr anzeigen müssen
        console.log("TM/VM-Daten werden ignoriert - vereinfachte Anzeige ohne Nummern wird verwendet");
        
        // Leere Map, da wir keine TM/VM-Informationen mehr verfolgen
        this.tmMoves = new Map();
    }

    /**
     * Erstellt Fallback-Daten für häufig verwendete TMs/VMs
     * Diese Daten werden verwendet, wenn das Laden aus der API fehlschlägt
     */
    setupFallbackTMMoves() {
        // Einige wichtige TMs mit ihren Move-IDs
        const commonTMs = [
            { moveId: 5, type: 'tm', number: 1 },    // Megahieb
            { moveId: 53, type: 'tm', number: 3 },   // Gifthieb
            { moveId: 14, type: 'tm', number: 6 },   // Toxin
            { moveId: 34, type: 'tm', number: 8 },   // Bodyslam
            { moveId: 89, type: 'tm', number: 26 },  // Erdbeben
            { moveId: 94, type: 'tm', number: 13 },  // Eisstrahl
            { moveId: 59, type: 'tm', number: 15 },  // Hyperstrahl
            { moveId: 63, type: 'tm', number: 24 },  // Donnerblitz
            { moveId: 76, type: 'tm', number: 35 },  // Metronom
            { moveId: 70, type: 'tm', number: 38 },  // Feuerblitz
        ];

        // Einige wichtige VMs mit ihren Move-IDs
        const commonHMs = [
            { moveId: 15, type: 'hm', number: 1 },   // Zerschneider
            { moveId: 19, type: 'hm', number: 2 },   // Fliegen
            { moveId: 57, type: 'hm', number: 3 },   // Surfer
            { moveId: 70, type: 'hm', number: 4 },   // Stärke
            { moveId: 148, type: 'hm', number: 5 },  // Blitz
        ];

        // Füge TMs hinzu
        commonTMs.forEach(tm => {
            this.tmMoves.set(tm.moveId, { type: tm.type, number: tm.number });
        });

        // Füge VMs hinzu
        commonHMs.forEach(hm => {
            this.tmMoves.set(hm.moveId, { type: hm.type, number: hm.number });
        });

        console.log(`Fallback-Daten erstellt: ${this.tmMoves.size} Einträge`);
    }

    /**
     * Lädt die detaillierten Daten für alle Attacken
     * @param {Array} moveList - Liste der Attacken
     */
    async loadMoveDetails(moveList) {
        try {
            // Begrenze die Anzahl der gleichzeitigen Anfragen, um Rate-Limiting zu vermeiden
            const batchSize = 50;
            for (let i = 0; i < moveList.length; i += batchSize) {
                const batch = moveList.slice(i, i + batchSize);
                await this.loadMoveBatch(batch);
            }
        } catch (error) {
            console.error('Fehler beim Laden der Attacken-Details:', error);
            throw error;
        }
    }

    /**
     * Lädt einen Batch von Attackendaten
     * @param {Array} batch - Batch von Attacken
     */
    async loadMoveBatch(batch) {
        const movePromises = batch.map(move => 
            fetch(move.url)
                .then(res => res.json())
                .then(moveData => {
                    // Verarbeite die Namen direkt hier
                    if (moveData && moveData.names) {
                        // Versuche, den deutschen Namen zu finden
                        const germanName = moveData.names.find(name => name.language.name === 'de');
                        if (germanName) {
                            moveData.germanName = germanName.name;
                            this.germanMovesMap.set(moveData.id, germanName.name);
                        } else {
                            // Wenn kein deutscher Name gefunden wird, verwende den englischen Namen
                            moveData.germanName = moveData.name;
                        }
                    } else {
                        // Fallback zum englischen Namen
                        moveData.germanName = moveData.name;
                    }
                    return moveData;
                })
                .catch(err => {
                    console.error(`Fehler beim Laden der Attackendaten für ${move.name}:`, err);
                    return null;
                })
        );
        
        const moveData = await Promise.all(movePromises);
        
        moveData.forEach(move => {
            if (move && move.id) {
                // Füge TM/VM Informationen hinzu
                const tmInfo = this.tmMoves.get(move.id);
                if (tmInfo) {
                    move.tmInfo = tmInfo;
                }
                
                this.movesMap.set(move.id, move);
            }
        });
    }

    /**
     * Gibt alle Attacken zurück
     * @returns {Array} - Liste aller Attacken
     */
    getAllMoves() {
        return this.allMoves;
    }

    /**
     * Gibt eine Attacke anhand ihrer ID zurück
     * @param {number} id - Attacken-ID
     * @returns {Object|null} - Attackendaten oder null
     */
    getMoveById(id) {
        return id ? this.movesMap.get(Number(id)) : null;
    }

    /**
     * Kategorisiert und sortiert Attacken für ein bestimmtes Pokémon
     * @param {Object} pokemonData - Pokémon-Daten
     * @returns {Object} - Kategorisierte und sortierte Attacken
     */
    categorizeMoves(pokemonData) {
        if (!pokemonData) {
            return {
                levelUpMoves: [],
                eggMoves: [],
                tmMoves: [],
                sameTypeMoves: [],
                otherMoves: []
            };
        }

        // Extrahiere die Typen des Pokémon
        const pokemonTypes = pokemonData.types ? 
            pokemonData.types.map(t => t.type.name) : [];

        // Kategorisiere Attacken
        const levelUpMoves = [];
        const eggMoves = [];
        const tmMoves = [];
        const sameTypeMoves = [];
        const otherMoves = [];

        // Set für alle bereits kategorisierten Attacken
        const categorizedMoveIds = new Set();
        
        // Erst die regulären Attacken des Pokémon kategorisieren
        if (pokemonData.moves) {
            pokemonData.moves.forEach(moveEntry => {
                const moveId = parseInt(moveEntry.move.url.split('/').filter(Boolean).pop());
                const moveData = this.getMoveById(moveId);
                
                if (!moveData) return;

                // Bestimme, wie die Attacke gelernt wird
                let learnMethod = 'Andere';
                let levelLearned = 0;
                
                // Suche nach der neuesten Methode, wie die Attacke gelernt wird
                if (moveEntry.version_group_details && moveEntry.version_group_details.length > 0) {
                    // Sortiere nach Version (neueste zuerst)
                    const versionDetails = [...moveEntry.version_group_details].sort((a, b) => {
                        const versionA = a.version_group.name;
                        const versionB = b.version_group.name;
                        return versionB.localeCompare(versionA);
                    });
                    
                    // Nehme die neueste Version
                    const latestVersion = versionDetails[0];
                    const methodName = latestVersion.move_learn_method.name;
                    
                    if (methodName === 'level-up') {
                        learnMethod = 'Level-Up';
                        levelLearned = latestVersion.level_learned_at;
                    } else if (methodName === 'egg') {
                        learnMethod = 'Zucht';
                    } else if (methodName === 'machine') {
                        learnMethod = 'TM/VM';
                    } else if (methodName === 'tutor') {
                        learnMethod = 'Tutor';
                    }
                }
                
                // Füge Attackeninformationen für die Anzeige hinzu
                const moveInfo = {
                    id: moveData.id,
                    name: moveData.name,
                    germanName: moveData.germanName || moveData.name,
                    type: moveData.type ? moveData.type.name : 'normal',
                    learnMethod: learnMethod,
                    levelLearned: levelLearned
                };
                
                // Kategorisiere nach Lernmethode
                if (learnMethod === 'Level-Up') {
                    levelUpMoves.push(moveInfo);
                    categorizedMoveIds.add(moveData.id);
                } else if (learnMethod === 'Zucht') {
                    eggMoves.push(moveInfo);
                    categorizedMoveIds.add(moveData.id);
                } else if (learnMethod === 'TM/VM') {
                    tmMoves.push(moveInfo);
                    categorizedMoveIds.add(moveData.id);
                } else if (pokemonTypes.includes(moveInfo.type)) {
                    // Wenn der Attackentyp mit einem der Pokémon-Typen übereinstimmt
                    sameTypeMoves.push(moveInfo);
                    categorizedMoveIds.add(moveData.id);
                } else {
                    // Andere Attacken, die das Pokémon normal lernen kann
                    otherMoves.push(moveInfo);
                    categorizedMoveIds.add(moveData.id);
                }
            });
        }

        // Jetzt alle anderen verfügbaren Attacken hinzufügen
        // Hole alle existierenden Attacken aus der moveMap
        const allExistingMoves = Array.from(this.movesMap.values());
        
        // Füge alle Attacken, die das Pokémon noch nicht kennt, zur "Andere"-Kategorie hinzu
        allExistingMoves.forEach(moveData => {
            // Wenn die Attacke noch nicht kategorisiert wurde
            if (!categorizedMoveIds.has(moveData.id)) {
                const moveInfo = {
                    id: moveData.id,
                    name: moveData.name,
                    germanName: moveData.germanName || moveData.name,
                    type: moveData.type ? moveData.type.name : 'normal',
                    learnMethod: 'Universell', // Kennzeichnung für universelle Attacken
                    levelLearned: 0
                };
                
                // Füge zur "Andere"-Kategorie hinzu
                otherMoves.push(moveInfo);
            }
        });

        // Sortiere die Attacken
        levelUpMoves.sort((a, b) => a.levelLearned - b.levelLearned);
        eggMoves.sort((a, b) => a.germanName.localeCompare(b.germanName));
        tmMoves.sort((a, b) => a.germanName.localeCompare(b.germanName));
        sameTypeMoves.sort((a, b) => a.germanName.localeCompare(b.germanName));
        otherMoves.sort((a, b) => a.germanName.localeCompare(b.germanName));

        return {
            levelUpMoves,
            eggMoves,
            tmMoves,
            sameTypeMoves,
            otherMoves
        };
    }

    /**
     * Gibt den lokalisierten Namen einer Attacke zurück
     * @param {string} moveName - Englischer Attackenname
     * @returns {string} - Deutscher Attackenname
     */
    getLocalizedMoveName(moveName) {
        // Suche nach der Attacke in der Map
        const moveEntry = Array.from(this.movesMap.values()).find(move => move.name === moveName);
        if (moveEntry && moveEntry.germanName) {
            return moveEntry.germanName;
        }
        return moveName;
    }
}