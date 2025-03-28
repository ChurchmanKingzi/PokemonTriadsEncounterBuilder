# Pokémon Team Builder

Eine Webanwendung zur Erstellung und Visualisierung von Pokémon-Teams mit benutzerdefinierten Statistiken und Würfeln für RPG-Anwendungen.

## Funktionen

- Auswahl von über 1000 Pokémon mit deutschen und englischen Namen
- Automatische Berechnung von Würfeltypen basierend auf Pokémon-Eigenschaften
- Anpassbare Statuswerte und Level für jedes Pokémon
- Suchfunktion in der Dropdown-Liste (Tastatur-Navigation)
- Tastatur-Unterstützung (Enter zum Auswählen)
- Responsive Design

## Aufbau des Projekts

Das Projekt ist in mehrere Module aufgeteilt:

### Kern-Komponenten

- `app.js`: Die Hauptanwendung, koordiniert alle anderen Komponenten
- `pokemonService.js`: Lädt und verwaltet Pokémon-Daten von der PokéAPI
- `statCalculator.js`: Berechnet Statuswerte der Pokémon basierend auf Level und Basiswerten
- `diceCalculator.js`: Bestimmt Würfeltypen basierend auf Pokémon-Eigenschaften
- `uiBuilder.js`: Erstellt und verwaltet UI-Elemente
- `eventHandler.js`: Verwaltet globale Event-Listener und Benutzerinteraktionen
- `utils.js`: Hilfsfunktionen

### Statistische Berechnungen

Die Statuswerte werden wie folgt berechnet:

- GENA: 6 + Evolutionsstufe (20 für legendäre/mystische Pokémon)
- PA: Hälfte von GENA, aufgerundet
- KP: (Basis-KP-Formel) × 3
- Andere Werte: Basierend auf der Standard-Formel aus den Spielen

### Würfeltypen

Würfel werden nach folgenden Regeln zugewiesen:

- Legendäre und mystische Pokémon: 2W100
- BST ≥ 600: 1W20
- BST ≥ 550: 2W8
- BST ≥ 500: 2W6
- BST ≥ 450: 1W12
- BST ≥ 400: 1W10
- Voll entwickelte Pokémon: 1W10
- Pokémon, die sich genau einmal entwickeln können: 1W8
- Pokémon mit BST < 300: 1W4
- Pokémon, die sich noch mehrmals entwickeln können: 1W4
- Andere: 1W6

## Installation und Nutzung

1. Klone das Repository oder lade die Dateien herunter
2. Öffne `index.html` in deinem Web-Browser
3. Die Anwendung lädt Pokémon-Daten von der PokéAPI beim Start

## Technologien

- HTML5, CSS3, JavaScript (ES6+)
- PokéAPI für Pokémon-Daten

## Hinweise

Die Anwendung benötigt eine aktive Internetverbindung beim ersten Start, um die Pokémon-Daten zu laden.
