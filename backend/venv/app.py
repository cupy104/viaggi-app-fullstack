"""
Backend Flask per Web App Organizzazione Viaggi di Gruppo
Gestisce API RESTful per CRUD viaggi, autenticazione, gestione partecipanti,
attività, spese e generazione PDF.
"""

import os
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

# ========================================
# CONFIGURAZIONE FLASK E MONGODB
# ========================================

app = Flask(__name__)
CORS(app)  # Abilita CORS per permettere richieste dal frontend

# Lettura variabili d'ambiente
MONGODB_URI = os.environ.get('MONGODB_URI')
MONGODB_DB_NAME = os.environ.get('MONGODB_DB_NAME')

if not MONGODB_URI or not MONGODB_DB_NAME:
    raise ValueError("⚠️  ERRORE: Variabili MONGODB_URI e MONGODB_DB_NAME devono essere definite nel file .env")

# Connessione a MongoDB Atlas
try:
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    # Test connessione
    client.server_info()
    print(f"✅ Connesso a MongoDB: database '{MONGODB_DB_NAME}'")
except Exception as e:
    print(f"❌ Errore connessione MongoDB: {e}")
    raise

# Riferimenti alle collezioni
users_collection = db.users
trips_collection = db.trips

# ========================================
# UTILITY FUNCTIONS
# ========================================

def serialize_doc(doc):
    """
    Converte un documento MongoDB in formato JSON-serializable.
    Trasforma ObjectId in stringhe.
    """
    if doc is None:
        return None
    
    doc['_id'] = str(doc['_id'])
    
    # Converti ObjectId nei partecipanti
    if 'partecipanti' in doc and isinstance(doc['partecipanti'], list):
        doc['partecipanti'] = [str(p) if isinstance(p, ObjectId) else p for p in doc['partecipanti']]
    
    # Converti ObjectId in attività
    if 'attivita' in doc and isinstance(doc['attivita'], list):
        for att in doc['attivita']:
            if '_id' in att:
                att['_id'] = str(att['_id'])
    
    # Converti ObjectId in spese
    if 'spese' in doc and isinstance(doc['spese'], list):
        for spesa in doc['spese']:
            if '_id' in spesa:
                spesa['_id'] = str(spesa['_id'])
            if 'pagato_da' in spesa and isinstance(spesa['pagato_da'], ObjectId):
                spesa['pagato_da'] = str(spesa['pagato_da'])
    
    # Converti created_by
    if 'created_by' in doc and isinstance(doc['created_by'], ObjectId):
        doc['created_by'] = str(doc['created_by'])
    
    # Converti date in stringhe ISO
    if 'data_inizio' in doc and doc['data_inizio']:
        doc['data_inizio'] = doc['data_inizio'].isoformat()
    if 'data_fine' in doc and doc['data_fine']:
        doc['data_fine'] = doc['data_fine'].isoformat()
    if 'created_at' in doc and doc['created_at']:
        doc['created_at'] = doc['created_at'].isoformat()
    if 'updated_at' in doc and doc['updated_at']:
        doc['updated_at'] = doc['updated_at'].isoformat()
    
    return doc

def validate_object_id(id_string):
    """
    Valida e converte una stringa in ObjectId.
    Restituisce l'ObjectId o None se non valido.
    """
    try:
        return ObjectId(id_string)
    except (InvalidId, TypeError):
        return None

# ========================================
# ROUTE: AUTENTICAZIONE
# ========================================

@app.route('/api/login', methods=['POST'])
def login():
    """
    Endpoint per login utente.
    Body: { "username": "...", "password": "..." }
    Restituisce dati utente (esclusa password) se credenziali corrette.
    """
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "Username e password sono obbligatori"}), 400
        
        # Cerca utente nel database
        user = users_collection.find_one({"username": username, "password": password})
        
        if not user:
            return jsonify({"error": "Credenziali non valide"}), 401
        
        # Rimuovi password dalla risposta
        user.pop('password', None)
        return jsonify(serialize_doc(user)), 200
        
    except Exception as e:
        return jsonify({"error": f"Errore durante il login: {str(e)}"}), 500

# ========================================
# ROUTE: UTENTI
# ========================================

@app.route('/api/users', methods=['GET'])
def get_users():
    """
    Restituisce elenco di tutti gli utenti (senza password).
    Utile per popolare select di partecipanti.
    """
    try:
        users = list(users_collection.find({}, {"password": 0}))
        return jsonify([serialize_doc(u) for u in users]), 200
    except Exception as e:
        return jsonify({"error": f"Errore nel recupero utenti: {str(e)}"}), 500

# ========================================
# ROUTE: VIAGGI - CRUD BASE
# ========================================

@app.route('/api/trips', methods=['GET'])
def get_trips():
    """
    Restituisce elenco di tutti i viaggi.
    Query params opzionali:
    - completato=true/false : filtra per stato
    """
    try:
        query = {}
        
        # Filtro per stato completato
        completato_param = request.args.get('completato')
        if completato_param is not None:
            query['completato'] = completato_param.lower() == 'true'
        
        trips = list(trips_collection.find(query).sort('data_inizio', -1))
        return jsonify([serialize_doc(t) for t in trips]), 200
        
    except Exception as e:
        return jsonify({"error": f"Errore nel recupero viaggi: {str(e)}"}), 500

@app.route('/api/trips/<trip_id>', methods=['GET'])
def get_trip(trip_id):
    """
    Restituisce dettaglio completo di un singolo viaggio.
    Include informazioni popolate sui partecipanti.
    """
    try:
        obj_id = validate_object_id(trip_id)
        if not obj_id:
            return jsonify({"error": "ID viaggio non valido"}), 400
        
        trip = trips_collection.find_one({"_id": obj_id})
        
        if not trip:
            return jsonify({"error": "Viaggio non trovato"}), 404
        
        # Popola informazioni partecipanti
        if 'partecipanti' in trip and trip['partecipanti']:
            partecipanti_ids = [ObjectId(p) if isinstance(p, str) else p for p in trip['partecipanti']]
            partecipanti_docs = list(users_collection.find(
                {"_id": {"$in": partecipanti_ids}},
                {"password": 0}
            ))
            trip['partecipanti_dettagli'] = [serialize_doc(p) for p in partecipanti_docs]
        
        return jsonify(serialize_doc(trip)), 200
        
    except Exception as e:
        return jsonify({"error": f"Errore nel recupero viaggio: {str(e)}"}), 500

@app.route('/api/trips', methods=['POST'])
def create_trip():
    """
    Crea un nuovo viaggio.
    Body: { titolo, destinazione, coordinate, data_inizio, data_fine, 
            descrizione, completato, partecipanti, note, created_by }
    """
    try:
        data = request.get_json()
        
        # Validazione campi obbligatori
        required_fields = ['titolo', 'destinazione']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Campo '{field}' obbligatorio"}), 400
        
        # Costruisci documento viaggio
        new_trip = {
            "titolo": data['titolo'],
            "destinazione": data['destinazione'],
            "coordinate": data.get('coordinate', {"lat": 0, "lng": 0}),
            "data_inizio": datetime.fromisoformat(data['data_inizio']) if 'data_inizio' in data else None,
            "data_fine": datetime.fromisoformat(data['data_fine']) if 'data_fine' in data else None,
            "descrizione": data.get('descrizione', ''),
            "completato": data.get('completato', False),
            "partecipanti": [ObjectId(p) for p in data.get('partecipanti', [])],
            "attivita": [],
            "spese": [],
            "note": data.get('note', ''),
            "created_at": datetime.utcnow(),
            "created_by": ObjectId(data['created_by']) if 'created_by' in data else None,
            "updated_at": datetime.utcnow()
        }
        
        result = trips_collection.insert_one(new_trip)
        new_trip['_id'] = result.inserted_id
        
        return jsonify(serialize_doc(new_trip)), 201
        
    except Exception as e:
        return jsonify({"error": f"Errore nella creazione viaggio: {str(e)}"}), 500

@app.route('/api/trips/<trip_id>', methods=['PUT'])
def update_trip(trip_id):
    """
    Aggiorna informazioni generali di un viaggio.
    Body: campi da aggiornare (titolo, destinazione, date, ecc.)
    """
    try:
        obj_id = validate_object_id(trip_id)
        if not obj_id:
            return jsonify({"error": "ID viaggio non valido"}), 400
        
        data = request.get_json()
        
        # Costruisci update document
        update_doc = {"updated_at": datetime.utcnow()}
        
        # Campi aggiornabili
        updatable_fields = ['titolo', 'destinazione', 'coordinate', 'descrizione', 
                           'completato', 'note']
        for field in updatable_fields:
            if field in data:
                update_doc[field] = data[field]
        
        # Gestione date
        if 'data_inizio' in data and data['data_inizio']:
            update_doc['data_inizio'] = datetime.fromisoformat(data['data_inizio'])
        if 'data_fine' in data and data['data_fine']:
            update_doc['data_fine'] = datetime.fromisoformat(data['data_fine'])
        
        result = trips_collection.update_one(
            {"_id": obj_id},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Viaggio non trovato"}), 404
        
        # Recupera viaggio aggiornato
        updated_trip = trips_collection.find_one({"_id": obj_id})
        return jsonify(serialize_doc(updated_trip)), 200
        
    except Exception as e:
        return jsonify({"error": f"Errore nell'aggiornamento viaggio: {str(e)}"}), 500

@app.route('/api/trips/<trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    """
    Elimina un viaggio.
    """
    try:
        obj_id = validate_object_id(trip_id)
        if not obj_id:
            return jsonify({"error": "ID viaggio non valido"}), 400
        
        result = trips_collection.delete_one({"_id": obj_id})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Viaggio non trovato"}), 404
        
        return jsonify({"message": "Viaggio eliminato con successo"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Errore nell'eliminazione viaggio: {str(e)}"}), 500

# ========================================
# ROUTE: GESTIONE PARTECIPANTI
# ========================================

@app.route('/api/trips/<trip_id>/participants', methods=['PUT'])
def update_participants(trip_id):
    """
    Aggiorna elenco partecipanti di un viaggio.
    Body: { "partecipanti": ["user_id1", "user_id2", ...] }
    """
    try:
        obj_id = validate_object_id(trip_id)
        if not obj_id:
            return jsonify({"error": "ID viaggio non valido"}), 400
        
        data = request.get_json()
        partecipanti_ids = data.get('partecipanti', [])
        
        # Converti in ObjectId
        partecipanti_obj = [ObjectId(p) for p in partecipanti_ids]
        
        result = trips_collection.update_one(
            {"_id": obj_id},
            {"$set": {"partecipanti": partecipanti_obj, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Viaggio non trovato"}), 404
        
        return jsonify({"message": "Partecipanti aggiornati con successo"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Errore nell'aggiornamento partecipanti: {str(e)}"}), 500

# ========================================
# ROUTE: GESTIONE ATTIVITÀ
# ========================================

@app.route('/api/trips/<trip_id>/activities', methods=['POST'])
def add_activity(trip_id):
    """
    Aggiunge un'attività a un viaggio.
    Body: { "titolo", "descrizione", "data", "luogo", "note" }
    """
    try:
        obj_id = validate_object_id(trip_id)
        if not obj_id:
            return jsonify({"error": "ID viaggio non valido"}), 400
        
        data = request.get_json()
        
        # Validazione
        if 'titolo' not in data:
            return jsonify({"error": "Campo 'titolo' obbligatorio"}), 400
        
        # Crea documento attività
        new_activity = {
            "_id": ObjectId(),
            "titolo": data['titolo'],
            "descrizione": data.get('descrizione', ''),
            "data": datetime.fromisoformat(data['data']) if 'data' in data and data['data'] else None,
            "luogo": data.get('luogo', ''),
            "note": data.get('note', '')
        }
        
        result = trips_collection.update_one(
            {"_id": obj_id},
            {
                "$push": {"attivita": new_activity},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Viaggio non trovato"}), 404
        
        new_activity['_id'] = str(new_activity['_id'])
        if new_activity['data']:
            new_activity['data'] = new_activity['data'].isoformat()
        
        return jsonify(new_activity), 201
        
    except Exception as e:
        return jsonify({"error": f"Errore nell'aggiunta attività: {str(e)}"}), 500

@app.route('/api/trips/<trip_id>/activities/<activity_id>', methods=['PUT'])
def update_activity(trip_id, activity_id):
    """
    Aggiorna un'attività specifica.
    Body: campi da aggiornare
    """
    try:
        obj_id = validate_object_id(trip_id)
        act_id = validate_object_id(activity_id)
        
        if not obj_id or not act_id:
            return jsonify({"error": "ID non valido"}), 400
        
        data = request.get_json()
        
        # Costruisci update per campi nested
        update_fields = {}
        if 'titolo' in data:
            update_fields['attivita.$.titolo'] = data['titolo']
        if 'descrizione' in data:
            update_fields['attivita.$.descrizione'] = data['descrizione']
        if 'data' in data:
            update_fields['attivita.$.data'] = datetime.fromisoformat(data['data']) if data['data'] else None
        if 'luogo' in data:
            update_fields['attivita.$.luogo'] = data['luogo']
        if 'note' in data:
            update_fields['attivita.$.note'] = data['note']
        
        update_fields['updated_at'] = datetime.utcnow()
        
        result = trips_collection.update_one(
            {"_id": obj_id, "attivita._id": act_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Viaggio o attività non trovati"}), 404
        
        return jsonify({"message": "Attività aggiornata con successo"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Errore nell'aggiornamento attività: {str(e)}"}), 500

@app.route('/api/trips/<trip_id>/activities/<activity_id>', methods=['DELETE'])
def delete_activity(trip_id, activity_id):
    """
    Elimina un'attività da un viaggio.
    """
    try:
        obj_id = validate_object_id(trip_id)
        act_id = validate_object_id(activity_id)
        
        if not obj_id or not act_id:
            return jsonify({"error": "ID non valido"}), 400
        
        result = trips_collection.update_one(
            {"_id": obj_id},
            {
                "$pull": {"attivita": {"_id": act_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Viaggio non trovato"}), 404
        
        return jsonify({"message": "Attività eliminata con successo"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Errore nell'eliminazione attività: {str(e)}"}), 500

# ========================================
# ROUTE: GESTIONE SPESE
# ========================================

@app.route('/api/trips/<trip_id>/expenses', methods=['POST'])
def add_expense(trip_id):
    """
    Aggiunge una spesa a un viaggio.
    Body: { "descrizione", "importo", "categoria", "pagato_da", "data" }
    """
    try:
        obj_id = validate_object_id(trip_id)
        if not obj_id:
            return jsonify({"error": "ID viaggio non valido"}), 400
        
        data = request.get_json()
        
        # Validazione
        required = ['descrizione', 'importo']
        for field in required:
            if field not in data:
                return jsonify({"error": f"Campo '{field}' obbligatorio"}), 400
        
        # Crea documento spesa
        new_expense = {
            "_id": ObjectId(),
            "descrizione": data['descrizione'],
            "importo": float(data['importo']),
            "categoria": data.get('categoria', 'Altro'),
            "pagato_da": ObjectId(data['pagato_da']) if 'pagato_da' in data else None,
            "data": datetime.fromisoformat(data['data']) if 'data' in data and data['data'] else datetime.utcnow()
        }
        
        result = trips_collection.update_one(
            {"_id": obj_id},
            {
                "$push": {"spese": new_expense},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Viaggio non trovato"}), 404
        
        new_expense['_id'] = str(new_expense['_id'])
        if new_expense['pagato_da']:
            new_expense['pagato_da'] = str(new_expense['pagato_da'])
        new_expense['data'] = new_expense['data'].isoformat()
        
        return jsonify(new_expense), 201
        
    except Exception as e:
        return jsonify({"error": f"Errore nell'aggiunta spesa: {str(e)}"}), 500

@app.route('/api/trips/<trip_id>/expenses/summary', methods=['GET'])
def get_expenses_summary(trip_id):
    """
    Restituisce riepilogo delle spese di un viaggio.
    Calcola totale generale e totale per categoria.
    """
    try:
        obj_id = validate_object_id(trip_id)
        if not obj_id:
            return jsonify({"error": "ID viaggio non valido"}), 400
        
        trip = trips_collection.find_one({"_id": obj_id})
        
        if not trip:
            return jsonify({"error": "Viaggio non trovato"}), 404
        
        spese = trip.get('spese', [])
        
        # Calcola totale
        totale = sum(s.get('importo', 0) for s in spese)
        
        # Calcola totale per categoria
        categorie = {}
        for spesa in spese:
            cat = spesa.get('categoria', 'Altro')
            if cat not in categorie:
                categorie[cat] = 0
            categorie[cat] += spesa.get('importo', 0)
        
        return jsonify({
            "totale": round(totale, 2),
            "per_categoria": {k: round(v, 2) for k, v in categorie.items()},
            "numero_spese": len(spese)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Errore nel calcolo riepilogo spese: {str(e)}"}), 500

# ========================================
# ROUTE: DOWNLOAD PDF
# ========================================

@app.route('/api/trips/<trip_id>/pdf', methods=['GET'])
def download_trip_pdf(trip_id):
    """
    Genera e scarica un file PDF con tutte le informazioni del viaggio.
    """
    try:
        obj_id = validate_object_id(trip_id)
        if not obj_id:
            return jsonify({"error": "ID viaggio non valido"}), 400
        
        trip = trips_collection.find_one({"_id": obj_id})
        
        if not trip:
            return jsonify({"error": "Viaggio non trovato"}), 404
        
        # Crea buffer per PDF
        buffer = io.BytesIO()
        
        # Crea documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Titolo
        title = Paragraph(f"<b>{trip['titolo']}</b>", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))
        
        # Informazioni generali
        info_data = [
            ['Destinazione:', trip.get('destinazione', 'N/D')],
            ['Data inizio:', trip.get('data_inizio').strftime('%d/%m/%Y') if trip.get('data_inizio') else 'N/D'],
            ['Data fine:', trip.get('data_fine').strftime('%d/%m/%Y') if trip.get('data_fine') else 'N/D'],
            ['Stato:', 'Completato' if trip.get('completato') else 'Da fare']
        ]
        
        info_table = Table(info_data, colWidths=[150, 350])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 20))
        
        # Descrizione
        if trip.get('descrizione'):
            elements.append(Paragraph("<b>Descrizione:</b>", styles['Heading2']))
            elements.append(Paragraph(trip['descrizione'], styles['BodyText']))
            elements.append(Spacer(1, 12))
        
        # Partecipanti
        if trip.get('partecipanti'):
            elements.append(Paragraph("<b>Partecipanti:</b>", styles['Heading2']))
            partecipanti_ids = [ObjectId(p) if isinstance(p, str) else p for p in trip['partecipanti']]
            partecipanti_docs = list(users_collection.find({"_id": {"$in": partecipanti_ids}}))
            partecipanti_nomi = [f"{p['nome']} {p['cognome']}" for p in partecipanti_docs]
            elements.append(Paragraph(', '.join(partecipanti_nomi), styles['BodyText']))
            elements.append(Spacer(1, 12))
        
        # Attività
        if trip.get('attivita'):
            elements.append(Paragraph("<b>Attività pianificate:</b>", styles['Heading2']))
            for att in trip['attivita']:
                att_text = f"• <b>{att.get('titolo', 'N/D')}</b>"
                if att.get('data'):
                    att_text += f" - {att['data'].strftime('%d/%m/%Y %H:%M')}"
                if att.get('luogo'):
                    att_text += f" ({att['luogo']})"
                elements.append(Paragraph(att_text, styles['BodyText']))
                if att.get('descrizione'):
                    elements.append(Paragraph(f"  {att['descrizione']}", styles['BodyText']))
                elements.append(Spacer(1, 6))
            elements.append(Spacer(1, 6))
        
        # Spese
        if trip.get('spese'):
            elements.append(Paragraph("<b>Riepilogo spese:</b>", styles['Heading2']))
            
            spese_data = [['Descrizione', 'Categoria', 'Importo (€)']]
            totale = 0
            
            for spesa in trip['spese']:
                importo = spesa.get('importo', 0)
                totale += importo
                spese_data.append([
                    spesa.get('descrizione', 'N/D'),
                    spesa.get('categoria', 'N/D'),
                    f"{importo:.2f}"
                ])
            
            spese_data.append(['', 'TOTALE', f"{totale:.2f}"])
            
            spese_table = Table(spese_data, colWidths=[250, 150, 100])
            spese_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -2), 1, colors.black),
                ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
                ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold')
            ]))
            
            elements.append(spese_table)
            elements.append(Spacer(1, 12))
        
        # Note
        if trip.get('note'):
            elements.append(Paragraph("<b>Note:</b>", styles['Heading2']))
            elements.append(Paragraph(trip['note'], styles['BodyText']))
        
        # Genera PDF
        doc.build(elements)
        
        # Prepara risposta
        buffer.seek(0)
        
        # Nome file sicuro
        filename = f"{trip['titolo'].replace(' ', '_')}.pdf"
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({"error": f"Errore nella generazione PDF: {str(e)}"}), 500

# ========================================
# ROUTE: HOMEPAGE (opzionale)
# ========================================

@app.route('/')
def home():
    """
    Endpoint di test per verificare che il backend sia attivo.
    """
    return jsonify({
        "message": "Backend API Viaggi di Gruppo attivo ✅",
        "endpoints": {
            "login": "POST /api/login",
            "users": "GET /api/users",
            "trips": "GET /api/trips",
            "trip_detail": "GET /api/trips/<id>",
            "create_trip": "POST /api/trips",
            "update_trip": "PUT /api/trips/<id>",
            "delete_trip": "DELETE /api/trips/<id>",
            "participants": "PUT /api/trips/<id>/participants",
            "activities": "POST/PUT/DELETE /api/trips/<id>/activities[/<activity_id>]",
            "expenses": "POST /api/trips/<id>/expenses",
            "expenses_summary": "GET /api/trips/<id>/expenses/summary",
            "download_pdf": "GET /api/trips/<id>/pdf"
        }
    }), 200

# ========================================
# AVVIO SERVER
# ========================================

if __name__ == '__main__':
    # In produzione usare un server WSGI come Gunicorn
    app.run(debug=True, host='0.0.0.0', port=5000)
