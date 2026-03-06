// ========================================
// SCRIPT DI INIZIALIZZAZIONE DATABASE
// Web App Organizzazione Viaggi di Gruppo
// ========================================

// Seleziona/crea il database
use viaggi_gruppo;

// Elimina collezioni esistenti (per reset completo)
db.users.drop();
db.trips.drop();

// ========================================
// COLLEZIONE: users
// ========================================

db.users.insertMany([
  {
    username: "mario_rossi",
    email: "mario.rossi@email.com",
    password: "password123",  // In produzione: usare hash bcrypt
    nome: "Mario",
    cognome: "Rossi",
    created_at: new Date("2024-01-15")
  },
  {
    username: "laura_bianchi",
    email: "laura.bianchi@email.com",
    password: "password123",
    nome: "Laura",
    cognome: "Bianchi",
    created_at: new Date("2024-01-20")
  },
  {
    username: "giuseppe_verdi",
    email: "giuseppe.verdi@email.com",
    password: "password123",
    nome: "Giuseppe",
    cognome: "Verdi",
    created_at: new Date("2024-02-01")
  },
  {
    username: "francesca_neri",
    email: "francesca.neri@email.com",
    password: "password123",
    nome: "Francesca",
    cognome: "Neri",
    created_at: new Date("2024-02-10")
  },
  {
    username: "luca_ferrari",
    email: "luca.ferrari@email.com",
    password: "password123",
    nome: "Luca",
    cognome: "Ferrari",
    created_at: new Date("2024-02-15")
  }
]);

// Recupera gli ID degli utenti per i riferimenti
const users = db.users.find().toArray();
const mario_id = users[0]._id;
const laura_id = users[1]._id;
const giuseppe_id = users[2]._id;
const francesca_id = users[3]._id;
const luca_id = users[4]._id;

// ========================================
// COLLEZIONE: trips
// ========================================

db.trips.insertMany([
  // VIAGGIO 1: Weekend a Berlino (molto dettagliato, già completato)
  {
    titolo: "Weekend a Berlino",
    destinazione: "Berlino, Germania",
    coordinate: { lat: 52.5200, lng: 13.4050 },
    data_inizio: new Date("2024-10-05"),
    data_fine: new Date("2024-10-08"),
    descrizione: "Weekend lungo per visitare la capitale tedesca, tra storia, cultura e vita notturna. Alloggio in Mitte, vicino alla Porta di Brandeburgo.",
    completato: true,
    partecipanti: [mario_id, laura_id, giuseppe_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "Visita Museo di Pergamo",
        descrizione: "Tour guidato del famoso museo archeologico sull'Isola dei Musei",
        data: new Date("2024-10-05T10:00:00"),
        luogo: "Museumsinsel",
        note: "Biglietti già acquistati online, ingresso ore 10:00"
      },
      {
        _id: new ObjectId(),
        titolo: "East Side Gallery",
        descrizione: "Passeggiata lungo il muro di Berlino con i murales storici",
        data: new Date("2024-10-06T15:00:00"),
        luogo: "Mühlenstraße",
        note: "Portare fotocamera"
      },
      {
        _id: new ObjectId(),
        titolo: "Cena tipica tedesca",
        descrizione: "Ristorante tradizionale con cucina bavarese",
        data: new Date("2024-10-06T20:00:00"),
        luogo: "Zur Letzten Instanz",
        note: "Prenotato tavolo per 3 persone"
      },
      {
        _id: new ObjectId(),
        titolo: "Reichstag - Cupola di vetro",
        descrizione: "Visita al parlamento tedesco con vista panoramica dalla cupola",
        data: new Date("2024-10-07T11:00:00"),
        luogo: "Platz der Republik",
        note: "Necessaria prenotazione online gratuita"
      }
    ],
    spese: [
      {
        _id: new ObjectId(),
        descrizione: "Voli andata/ritorno Milano-Berlino",
        importo: 450.00,
        categoria: "Trasporto",
        pagato_da: mario_id,
        data: new Date("2024-10-05")
      },
      {
        _id: new ObjectId(),
        descrizione: "Alloggio Airbnb 3 notti",
        importo: 360.00,
        categoria: "Alloggio",
        pagato_da: laura_id,
        data: new Date("2024-10-05")
      },
      {
        _id: new ObjectId(),
        descrizione: "Biglietti musei",
        importo: 54.00,
        categoria: "Attività",
        pagato_da: giuseppe_id,
        data: new Date("2024-10-05")
      },
      {
        _id: new ObjectId(),
        descrizione: "Ristoranti e cibo",
        importo: 180.00,
        categoria: "Cibo",
        pagato_da: mario_id,
        data: new Date("2024-10-06")
      },
      {
        _id: new ObjectId(),
        descrizione: "Trasporti pubblici (Berlin Pass)",
        importo: 45.00,
        categoria: "Trasporto",
        pagato_da: laura_id,
        data: new Date("2024-10-05")
      }
    ],
    note: "Viaggio fantastico! Berlino è molto più bella di quanto ci aspettassimo. Da ripetere in primavera.",
    created_at: new Date("2024-09-01"),
    created_by: mario_id,
    updated_at: new Date("2024-10-10")
  },

  // VIAGGIO 2: Gita al Lago di Como (minimale, da fare)
  {
    titolo: "Gita al Lago di Como",
    destinazione: "Como, Italia",
    coordinate: { lat: 45.8081, lng: 9.0852 },
    data_inizio: new Date("2026-04-12"),
    data_fine: new Date("2026-04-12"),
    descrizione: "Giornata al lago con pranzo in riva.",
    completato: false,
    partecipanti: [mario_id, francesca_id],
    attivita: [],
    spese: [],
    note: "Portare crema solare e costume se fa caldo",
    created_at: new Date("2026-03-05"),
    created_by: francesca_id,
    updated_at: new Date("2026-03-05")
  },

  // VIAGGIO 3: Barcellona (dettagliato, da fare)
  {
    titolo: "Viaggio a Barcellona",
    destinazione: "Barcellona, Spagna",
    coordinate: { lat: 41.3851, lng: 2.1734 },
    data_inizio: new Date("2026-06-15"),
    data_fine: new Date("2026-06-20"),
    descrizione: "Cinque giorni nella capitale catalana: Gaudí, spiagge, tapas e movida. Alloggio nel quartiere Gotico.",
    completato: false,
    partecipanti: [mario_id, laura_id, giuseppe_id, luca_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "Sagrada Familia",
        descrizione: "Visita guidata alla basilica incompiuta di Gaudí",
        data: new Date("2026-06-16T09:30:00"),
        luogo: "Carrer de Mallorca",
        note: "Biglietti online obbligatori, acquistare con anticipo"
      },
      {
        _id: new ObjectId(),
        titolo: "Park Güell",
        descrizione: "Parco pubblico con architetture moderniste di Gaudí",
        data: new Date("2026-06-16T15:00:00"),
        luogo: "Carrer d'Olot",
        note: "Zona monumentale a pagamento, resto del parco gratis"
      },
      {
        _id: new ObjectId(),
        titolo: "Las Ramblas e Mercato della Boqueria",
        descrizione: "Passeggiata sul viale principale e visita al mercato coperto",
        data: new Date("2026-06-17T11:00:00"),
        luogo: "La Rambla",
        note: "Attenzione ai borseggiatori"
      },
      {
        _id: new ObjectId(),
        titolo: "Spiaggia Barceloneta",
        descrizione: "Pomeriggio relax in spiaggia",
        data: new Date("2026-06-18T14:00:00"),
        luogo: "Barceloneta",
        note: "Portare asciugamani e protezione solare"
      },
      {
        _id: new ObjectId(),
        titolo: "Montjuïc e Fontana Magica",
        descrizione: "Salita alla collina per vista panoramica e spettacolo serale della fontana",
        data: new Date("2026-06-19T19:00:00"),
        luogo: "Montjuïc",
        note: "Fontana con giochi d'acqua e luci"
      }
    ],
    spese: [
      {
        _id: new ObjectId(),
        descrizione: "Voli andata/ritorno Milano-Barcellona (preventivo)",
        importo: 600.00,
        categoria: "Trasporto",
        pagato_da: mario_id,
        data: new Date("2026-03-10")
      },
      {
        _id: new ObjectId(),
        descrizione: "Appartamento Airbnb (acconto 50%)",
        importo: 300.00,
        categoria: "Alloggio",
        pagato_da: laura_id,
        data: new Date("2026-03-15")
      },
      {
        _id: new ObjectId(),
        descrizione: "Biglietti Sagrada Familia (4 persone)",
        importo: 104.00,
        categoria: "Attività",
        pagato_da: giuseppe_id,
        data: new Date("2026-04-01")
      }
    ],
    note: "Budget stimato totale: circa 500€ a persona. Valutare card turistica Barcelona Card per risparmiare su trasporti e ingressi.",
    created_at: new Date("2026-03-05"),
    created_by: laura_id,
    updated_at: new Date("2026-04-01")
  },

  // VIAGGIO 4: Amsterdam (medio dettaglio, completato)
  {
    titolo: "Weekend ad Amsterdam",
    destinazione: "Amsterdam, Paesi Bassi",
    coordinate: { lat: 52.3676, lng: 4.9041 },
    data_inizio: new Date("2024-05-10"),
    data_fine: new Date("2024-05-13"),
    descrizione: "Tre giorni nella Venezia del Nord: canali, musei, biciclette e tulipani.",
    completato: true,
    partecipanti: [laura_id, francesca_id, luca_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "Museo Van Gogh",
        descrizione: "Collezione più grande al mondo di opere di Van Gogh",
        data: new Date("2024-05-11T10:00:00"),
        luogo: "Museumplein",
        note: "Biglietti prenotati online"
      },
      {
        _id: new ObjectId(),
        titolo: "Giro in barca sui canali",
        descrizione: "Tour di un'ora lungo i canali storici",
        data: new Date("2024-05-11T16:00:00"),
        luogo: "Partenza vicino Centraal Station",
        note: "Romantico al tramonto"
      },
      {
        _id: new ObjectId(),
        titolo: "Mercato dei fiori galleggiante",
        descrizione: "Bloemenmarkt - mercato storico dei fiori",
        data: new Date("2024-05-12T11:00:00"),
        luogo: "Singel",
        note: "Acquistare bulbi di tulipano da portare a casa"
      }
    ],
    spese: [
      {
        _id: new ObjectId(),
        descrizione: "Voli Milano-Amsterdam",
        importo: 420.00,
        categoria: "Trasporto",
        pagato_da: laura_id,
        data: new Date("2024-05-10")
      },
      {
        _id: new ObjectId(),
        descrizione: "Hotel centro 2 notti",
        importo: 450.00,
        categoria: "Alloggio",
        pagato_da: francesca_id,
        data: new Date("2024-05-10")
      },
      {
        _id: new ObjectId(),
        descrizione: "Musei e tour",
        importo: 150.00,
        categoria: "Attività",
        pagato_da: luca_id,
        data: new Date("2024-05-11")
      },
      {
        _id: new ObjectId(),
        descrizione: "Ristoranti",
        importo: 210.00,
        categoria: "Cibo",
        pagato_da: laura_id,
        data: new Date("2024-05-12")
      }
    ],
    note: "Consiglio: noleggiare biciclette per girare come veri olandesi!",
    created_at: new Date("2024-04-01"),
    created_by: laura_id,
    updated_at: new Date("2024-05-15")
  },

  // VIAGGIO 5: Cinque Terre (medio, completato)
  {
    titolo: "Trekking alle Cinque Terre",
    destinazione: "Cinque Terre, Italia",
    coordinate: { lat: 44.1275, lng: 9.7090 },
    data_inizio: new Date("2025-09-07"),
    data_fine: new Date("2025-09-10"),
    descrizione: "Tre giorni di trekking lungo il sentiero azzurro tra i borghi delle Cinque Terre.",
    completato: true,
    partecipanti: [mario_id, giuseppe_id, luca_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "Sentiero Monterosso-Vernazza",
        descrizione: "Prima tappa del trekking, 3.5 km",
        data: new Date("2025-09-08T08:00:00"),
        luogo: "Monterosso al Mare",
        note: "Livello medio, portare acqua"
      },
      {
        _id: new ObjectId(),
        titolo: "Vernazza-Corniglia",
        descrizione: "Seconda tappa, 4 km con panorami mozzafiato",
        data: new Date("2025-09-08T14:00:00"),
        luogo: "Vernazza",
        note: "Pranzo con focaccia ligure a Vernazza"
      },
      {
        _id: new ObjectId(),
        titolo: "Manarola al tramonto",
        descrizione: "Visita al borgo e foto al tramonto",
        data: new Date("2025-09-09T18:30:00"),
        luogo: "Manarola",
        note: "Punto fotografico più iconico delle Cinque Terre"
      }
    ],
    spese: [
      {
        _id: new ObjectId(),
        descrizione: "Treno Milano-La Spezia A/R",
        importo: 180.00,
        categoria: "Trasporto",
        pagato_da: mario_id,
        data: new Date("2025-09-07")
      },
      {
        _id: new ObjectId(),
        descrizione: "B&B Monterosso 3 notti",
        importo: 270.00,
        categoria: "Alloggio",
        pagato_da: giuseppe_id,
        data: new Date("2025-09-07")
      },
      {
        _id: new ObjectId(),
        descrizione: "Cinque Terre Card (trekking + treni)",
        importo: 90.00,
        categoria: "Attività",
        pagato_da: luca_id,
        data: new Date("2025-09-07")
      }
    ],
    note: "Esperienza bellissima! Faticoso ma ne è valsa la pena.",
    created_at: new Date("2025-08-01"),
    created_by: giuseppe_id,
    updated_at: new Date("2025-09-12")
  },

  // VIAGGIO 6: Praga (da fare, medio dettaglio)
  {
    titolo: "Praga Capitale Boema",
    destinazione: "Praga, Repubblica Ceca",
    coordinate: { lat: 50.0755, lng: 14.4378 },
    data_inizio: new Date("2026-11-02"),
    data_fine: new Date("2026-11-05"),
    descrizione: "Quattro giorni nella città delle cento torri, tra castelli, ponti storici e birra ceca.",
    completato: false,
    partecipanti: [mario_id, laura_id, francesca_id, giuseppe_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "Castello di Praga",
        descrizione: "Visita al complesso del castello e Cattedrale di San Vito",
        data: new Date("2026-11-03T09:00:00"),
        luogo: "Hradčany",
        note: "Castello più grande del mondo, serve mezza giornata"
      },
      {
        _id: new ObjectId(),
        titolo: "Ponte Carlo",
        descrizione: "Passeggiata sul ponte storico con statue barocche",
        data: new Date("2026-11-03T15:00:00"),
        luogo: "Karlův most",
        note: "Bellissimo al tramonto"
      },
      {
        _id: new ObjectId(),
        titolo: "Orologio Astronomico",
        descrizione: "Spettacolo dell'orologio medievale in Piazza della Città Vecchia",
        data: new Date("2026-11-04T12:00:00"),
        luogo: "Staroměstské náměstí",
        note: "Ogni ora i 12 apostoli si muovono"
      }
    ],
    spese: [
      {
        _id: new ObjectId(),
        descrizione: "Voli andata/ritorno (preventivo)",
        importo: 520.00,
        categoria: "Trasporto",
        pagato_da: mario_id,
        data: new Date("2026-03-01")
      }
    ],
    note: "Periodo autunnale, portare vestiti pesanti. La birra ceca è economica e ottima!",
    created_at: new Date("2026-02-28"),
    created_by: giuseppe_id,
    updated_at: new Date("2026-03-01")
  },

  // VIAGGIO 7: Parigi (completato, dettagliato)
  {
    titolo: "Weekend romantico a Parigi",
    destinazione: "Parigi, Francia",
    coordinate: { lat: 48.8566, lng: 2.3522 },
    data_inizio: new Date("2025-02-14"),
    data_fine: new Date("2025-02-17"),
    descrizione: "San Valentino nella Città dell'Amore: Torre Eiffel, Louvre, croissant e macarons.",
    completato: true,
    partecipanti: [mario_id, laura_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "Torre Eiffel al tramonto",
        descrizione: "Salita fino al secondo piano per vista panoramica",
        data: new Date("2025-02-14T17:00:00"),
        luogo: "Champ de Mars",
        note: "Prenotare biglietti online, evita code infinite"
      },
      {
        _id: new ObjectId(),
        titolo: "Museo del Louvre",
        descrizione: "Visita alla Gioconda e opere principali",
        data: new Date("2025-02-15T10:00:00"),
        luogo: "Rue de Rivoli",
        note: "Museo enorme, concentrarsi su sezioni principali"
      },
      {
        _id: new ObjectId(),
        titolo: "Crociera sulla Senna",
        descrizione: "Tour serale in battello con cena",
        data: new Date("2025-02-15T20:00:00"),
        luogo: "Pont de l'Alma",
        note: "Romantico! Torre Eiffel illuminata vista dal fiume"
      },
      {
        _id: new ObjectId(),
        titolo: "Montmartre e Sacré-Cœur",
        descrizione: "Quartiere degli artisti e basilica",
        data: new Date("2025-02-16T11:00:00"),
        luogo: "Montmartre",
        note: "Salire gli scalini per vista panoramica"
      }
    ],
    spese: [
      {
        _id: new ObjectId(),
        descrizione: "Voli Milano-Parigi",
        importo: 380.00,
        categoria: "Trasporto",
        pagato_da: mario_id,
        data: new Date("2025-02-14")
      },
      {
        _id: new ObjectId(),
        descrizione: "Hotel quartiere Marais 3 notti",
        importo: 480.00,
        categoria: "Alloggio",
        pagato_da: mario_id,
        data: new Date("2025-02-14")
      },
      {
        _id: new ObjectId(),
        descrizione: "Musei e attrazioni",
        importo: 120.00,
        categoria: "Attività",
        pagato_da: laura_id,
        data: new Date("2025-02-15")
      },
      {
        _id: new ObjectId(),
        descrizione: "Ristoranti e bistrot",
        importo: 320.00,
        categoria: "Cibo",
        pagato_da: mario_id,
        data: new Date("2025-02-16")
      },
      {
        _id: new ObjectId(),
        descrizione: "Crociera sulla Senna con cena",
        importo: 160.00,
        categoria: "Attività",
        pagato_da: laura_id,
        data: new Date("2025-02-15")
      }
    ],
    note: "Viaggio indimenticabile per San Valentino ❤️ Parigi è magica in inverno!",
    created_at: new Date("2024-12-10"),
    created_by: mario_id,
    updated_at: new Date("2025-02-20")
  },

  // VIAGGIO 8: Napoli (da fare, poco dettaglio)
  {
    titolo: "Napoli e pizza",
    destinazione: "Napoli, Italia",
    coordinate: { lat: 40.8518, lng: 14.2681 },
    data_inizio: new Date("2026-07-20"),
    data_fine: new Date("2026-07-22"),
    descrizione: "Weekend per mangiare la vera pizza napoletana e visitare il centro storico.",
    completato: false,
    partecipanti: [giuseppe_id, luca_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "Pizzeria Da Michele",
        descrizione: "La pizza più famosa di Napoli",
        data: new Date("2026-07-21T13:00:00"),
        luogo: "Via Cesare Sersale",
        note: "Solo margherita e marinara, aspetta in fila ne vale la pena"
      }
    ],
    spese: [],
    note: "Valutare anche gita a Pompei se c'è tempo",
    created_at: new Date("2026-03-05"),
    created_by: giuseppe_id,
    updated_at: new Date("2026-03-05")
  },

  // VIAGGIO 9: Londra (da fare, medio dettaglio)
  {
    titolo: "Londra Calling",
    destinazione: "Londra, Regno Unito",
    coordinate: { lat: 51.5074, lng: -0.1278 },
    data_inizio: new Date("2026-08-15"),
    data_fine: new Date("2026-08-19"),
    descrizione: "Cinque giorni nella capitale britannica: musei gratuiti, mercati, tea time e pub storici.",
    completato: false,
    partecipanti: [mario_id, laura_id, francesca_id, luca_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "British Museum",
        descrizione: "Museo gratuito con collezioni da tutto il mondo",
        data: new Date("2026-08-16T10:00:00"),
        luogo: "Great Russell St",
        note: "Gratis! Donazione suggerita"
      },
      {
        _id: new ObjectId(),
        titolo: "Camden Market",
        descrizione: "Mercato alternativo con cibo street food",
        data: new Date("2026-08-16T15:00:00"),
        luogo: "Camden Town",
        note: "Perfetto per pranzo e shopping vintage"
      },
      {
        _id: new ObjectId(),
        titolo: "Tower of London",
        descrizione: "Fortezza storica e gioielli della Corona",
        data: new Date("2026-08-17T09:30:00"),
        luogo: "Tower Hill",
        note: "Biglietti costosi ma ne vale la pena"
      },
      {
        _id: new ObjectId(),
        titolo: "Cambio della Guardia",
        descrizione: "Cerimonia tradizionale a Buckingham Palace",
        data: new Date("2026-08-18T11:00:00"),
        luogo: "Buckingham Palace",
        note: "Arrivare presto per posto in prima fila"
      }
    ],
    spese: [
      {
        _id: new ObjectId(),
        descrizione: "Voli andata/ritorno (preventivo)",
        importo: 640.00,
        categoria: "Trasporto",
        pagato_da: mario_id,
        data: new Date("2026-03-05")
      },
      {
        _id: new ObjectId(),
        descrizione: "Ostello zona 2 (acconto)",
        importo: 200.00,
        categoria: "Alloggio",
        pagato_da: francesca_id,
        data: new Date("2026-04-10")
      }
    ],
    note: "Ricordarsi di portare adattatore per prese inglesi! La Oyster Card conviene per metro e bus.",
    created_at: new Date("2026-03-02"),
    created_by: laura_id,
    updated_at: new Date("2026-04-10")
  },

  // VIAGGIO 10: Budapest (completato, medio)
  {
    titolo: "Terme di Budapest",
    destinazione: "Budapest, Ungheria",
    coordinate: { lat: 47.4979, lng: 19.0402 },
    data_inizio: new Date("2025-03-20"),
    data_fine: new Date("2025-03-24"),
    descrizione: "Quattro giorni nella Perla del Danubio: terme storiche, ruin bar, Parlamento illuminato e cucina ungherese.",
    completato: true,
    partecipanti: [laura_id, francesca_id, giuseppe_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "Terme Széchenyi",
        descrizione: "Complesso termale più grande d'Europa",
        data: new Date("2025-03-21T10:00:00"),
        luogo: "Állatkerti krt.",
        note: "Portare costume e ciabatte. Piscine esterne anche d'inverno!"
      },
      {
        _id: new ObjectId(),
        titolo: "Parlamento Ungherese",
        descrizione: "Visita guidata al maestoso edificio neogotico",
        data: new Date("2025-03-22T11:00:00"),
        luogo: "Kossuth Lajos tér",
        note: "Prenotazione obbligatoria online"
      },
      {
        _id: new ObjectId(),
        titolo: "Ruin Bar Szimpla Kert",
        descrizione: "Serata nel più famoso ruin bar della città",
        data: new Date("2025-03-22T21:00:00"),
        luogo: "Kazinczy utca",
        note: "Locale unico ricavato da edificio abbandonato"
      },
      {
        _id: new ObjectId(),
        titolo: "Bastione dei Pescatori",
        descrizione: "Terrazza panoramica con vista sul Danubio",
        data: new Date("2025-03-23T16:00:00"),
        luogo: "Szentháromság tér",
        note: "Gratis all'alba e al tramonto, piccolo costo di giorno"
      }
    ],
    spese: [
      {
        _id: new ObjectId(),
        descrizione: "Voli Milano-Budapest",
        importo: 360.00,
        categoria: "Trasporto",
        pagato_da: laura_id,
        data: new Date("2025-03-20")
      },
      {
        _id: new ObjectId(),
        descrizione: "Appartamento centro 4 notti",
        importo: 320.00,
        categoria: "Alloggio",
        pagato_da: francesca_id,
        data: new Date("2025-03-20")
      },
      {
        _id: new ObjectId(),
        descrizione: "Terme e attrazioni",
        importo: 90.00,
        categoria: "Attività",
        pagato_da: giuseppe_id,
        data: new Date("2025-03-21")
      },
      {
        _id: new ObjectId(),
        descrizione: "Ristoranti e ruin bar",
        importo: 180.00,
        categoria: "Cibo",
        pagato_da: laura_id,
        data: new Date("2025-03-22")
      }
    ],
    note: "Budapest è economica e bellissima! Il goulash tradizionale è da provare assolutamente.",
    created_at: new Date("2025-02-01"),
    created_by: francesca_id,
    updated_at: new Date("2025-03-26")
  },

  // VIAGGIO 11: Vienna (da fare, ricco di dettagli)
  {
    titolo: "Vienna Imperiale",
    destinazione: "Vienna, Austria",
    coordinate: { lat: 48.2082, lng: 16.3738 },
    data_inizio: new Date("2026-12-15"),
    data_fine: new Date("2026-12-19"),
    descrizione: "Cinque giorni nella capitale austriaca durante il periodo natalizio: mercatini, palazzi imperiali, caffè storici e concerti di musica classica.",
    completato: false,
    partecipanti: [mario_id, laura_id, giuseppe_id, francesca_id, luca_id],
    attivita: [
      {
        _id: new ObjectId(),
        titolo: "Palazzo Schönbrunn",
        descrizione: "Residenza estiva degli Asburgo con giardini monumentali",
        data: new Date("2026-12-16T10:00:00"),
        luogo: "Schönbrunner Schloßstraße",
        note: "Grand Tour con 40 stanze. Giardini illuminati per Natale"
      },
      {
        _id: new ObjectId(),
        titolo: "Mercatini di Natale",
        descrizione: "Tour dei mercatini: Rathausplatz, Belvedere, Stephansplatz",
        data: new Date("2026-12-16T17:00:00"),
        luogo: "Centro storico",
        note: "Assaggiare vin brulé (Glühwein) e dolci tipici"
      },
      {
        _id: new ObjectId(),
        titolo: "Hofburg e Museo Sissi",
        descrizione: "Palazzo Imperiale e appartamenti dell'Imperatrice Elisabetta",
        data: new Date("2026-12-17T09:30:00"),
        luogo: "Michaelerkuppel",
        note: "Biglietto combinato Hofburg + Museo Sissi + Argenteria Imperiale"
      },
      {
        _id: new ObjectId(),
        titolo: "Concerto di Mozart",
        descrizione: "Concerto serale nella Sala d'Oro del Musikverein",
        data: new Date("2026-12-17T20:00:00"),
        luogo: "Musikvereinsplatz",
        note: "Biglietti da prenotare in anticipo, dress code elegante"
      },
      {
        _id: new ObjectId(),
        titolo: "Caffè Sacher e Sacher Torte originale",
        descrizione: "Colazione nel caffè storico con la torta al cioccolato più famosa",
        data: new Date("2026-12-18T10:00:00"),
        luogo: "Philharmoniker Str.",
        note: "La ricetta della torta è segreta dal 1832"
      },
      {
        _id: new ObjectId(),
        titolo: "Belvedere e Klimt",
        descrizione: "Museo con 'Il Bacio' di Klimt e altre opere",
        data: new Date("2026-12-18T14:00:00"),
        luogo: "Prinz Eugen-Straße",
        note: "Due palazzi: Superiore (museo) e Inferiore (mostre temporanee)"
      }
    ],
    spese: [
      {
        _id: new ObjectId(),
        descrizione: "Voli andata/ritorno Milano-Vienna (preventivo)",
        importo: 750.00,
        categoria: "Trasporto",
        pagato_da: mario_id,
        data: new Date("2026-05-10")
      },
      {
        _id: new ObjectId(),
        descrizione: "Appartamento Airbnb zona Ring (acconto)",
        importo: 400.00,
        categoria: "Alloggio",
        pagato_da: laura_id,
        data: new Date("2026-06-15")
      },
      {
        _id: new ObjectId(),
        descrizione: "Vienna Card 72h + trasporti (5 persone)",
        importo: 125.00,
        categoria: "Trasporto",
        pagato_da: giuseppe_id,
        data: new Date("2026-07-01")
      }
    ],
    note: "Vienna a Natale è un sogno! Temperature rigide, portare cappotto pesante e sciarpa. Budget giornaliero stimato: 80-100€ a persona (escl. alloggio).",
    created_at: new Date("2026-05-05"),
    created_by: francesca_id,
    updated_at: new Date("2026-07-01")
  }
]);

// ========================================
// CREAZIONE INDICI
// ========================================

// Indici su collezione users
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

// Indici su collezione trips
db.trips.createIndex({ titolo: 1 });
db.trips.createIndex({ destinazione: 1 });
db.trips.createIndex({ data_inizio: -1 });  // -1 = descending (più recenti prima)
db.trips.createIndex({ completato: 1 });
db.trips.createIndex({ "coordinate.lat": 1, "coordinate.lng": 1 }); // per ricerche geografiche

// Indice text search opzionale per ricerca full-text
db.trips.createIndex({ titolo: "text", destinazione: "text", descrizione: "text" });

// ========================================
// VERIFICA INSERIMENTI
// ========================================

print("\n========================================");
print("DATABASE INIZIALIZZATO CON SUCCESSO!");
print("========================================\n");

print("Utenti inseriti: " + db.users.countDocuments());
print("Viaggi inseriti: " + db.trips.countDocuments());
print("\nElenco utenti:");
db.users.find({}, {username: 1, email: 1, nome: 1, cognome: 1}).forEach(printjson);

print("\nElenco viaggi:");
db.trips.find({}, {titolo: 1, destinazione: 1, completato: 1, "partecipanti": 1}).forEach(function(doc) {
  print("- " + doc.titolo + " (" + doc.destinazione + ") - " + (doc.completato ? "COMPLETATO" : "DA FARE"));
});

print("\n========================================");
print("Indici creati:");
print("========================================");
print("users:");
db.users.getIndexes().forEach(printjson);
print("\ntrips:");
db.trips.getIndexes().forEach(printjson);

print("\n✅ Inizializzazione completata!");
print("Puoi iniziare a usare il database 'viaggi_gruppo'");
