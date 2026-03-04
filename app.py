from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import json

app = Flask(__name__)
CORS(app)  # Permette richieste dal frontend

# Connessione a MongoDB locale
client = MongoClient ("mongodb+srv://cupardofederico")
db = client['spa_viaggi']
users_collection = db['users']
trips_collection = db['trips']

def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    if doc and 'participants' in doc:
        for p in doc['participants']:
            if 'userId' in p and isinstance(p['userId'], ObjectId):
                p['userId'] = str(p['userId'])
    return doc

# A) Popolare database (non obbligatorio se usi setup_db.py)
@app.route('/api/setup', methods=['POST'])
def setup_database():
    try:
        users_collection.delete_many({})
        trips_collection.delete_many({})

        with open('../database/users.json', 'r', encoding='utf-8') as f:
            users_data = json.load(f)
        with open('../database/trips.json', 'r', encoding='utf-8') as f:
            trips_data = json.load(f)

        for user in users_data:
            if '_id' in user and '$oid' in user['_id']:
                user['_id'] = ObjectId(user['_id']['$oid'])
        for trip in trips_data:
            if '_id' in trip and '$oid' in trip['_id']:
                trip['_id'] = ObjectId(trip['_id']['$oid'])

        users_collection.insert_many(users_data)
        trips_collection.insert_many(trips_data)

        return jsonify({
            'success': True,
            'message': f'Database popolato: {len(users_data)} utenti, {len(trips_data)} viaggi'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# B) LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username e password richiesti'}), 400

    user = users_collection.find_one({'username': username, 'password': password})
    if user:
        return jsonify({
            'success': True,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'nome': user.get('nome', ''),
                'cognome': user.get('cognome', '')
            }
        }), 200
    else:
        return jsonify({'success': False, 'message': 'Credenziali non valide'}), 401

# C) ELENCO VIAGGI
@app.route('/api/trips', methods=['GET'])
def get_trips():
    trips = list(trips_collection.find())
    trips = [serialize_doc(trip) for trip in trips]
    return jsonify({'success': True, 'trips': trips}), 200

# D) DETTAGLIO VIAGGIO
@app.route('/api/trips/<trip_id>', methods=['GET'])
def get_trip(trip_id):
    try:
        trip = trips_collection.find_one({'_id': ObjectId(trip_id)})
        if trip:
            return jsonify({'success': True, 'trip': serialize_doc(trip)}), 200
        else:
            return jsonify({'success': False, 'message': 'Viaggio non trovato'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# E) NUOVO VIAGGIO
@app.route('/api/trips', methods=['POST'])
def create_trip():
    try:
        data = request.json
        new_trip = {
            'title': data.get('title'),
            'destination': data.get('destination'),
            'startDate': data.get('startDate'),
            'endDate': data.get('endDate'),
            'description': data.get('description', ''),
            'status': data.get('status', 'planned'),
            'lat': data.get('lat', 0),
            'lng': data.get('lng', 0),
            'participants': data.get('participants', []),
            'activities': data.get('activities', []),
            'expenses': data.get('expenses', []),
            'notes': data.get('notes', '')
        }
        result = trips_collection.insert_one(new_trip)
        new_trip['_id'] = str(result.inserted_id)
        return jsonify({'success': True, 'trip': new_trip}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# F) PARTECIPANTI
@app.route('/api/trips/<trip_id>/participants', methods=['PUT'])
def update_participants(trip_id):
    try:
        data = request.json
        participants = data.get('participants', [])
        result = trips_collection.update_one(
            {'_id': ObjectId(trip_id)},
            {'$set': {'participants': participants}}
        )
        if result.modified_count > 0:
            return jsonify({'success': True, 'message': 'Partecipanti aggiornati'}), 200
        else:
            return jsonify({'success': False, 'message': 'Nessuna modifica'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# G) ATTIVITÀ
@app.route('/api/trips/<trip_id>/activities', methods=['PUT'])
def update_activities(trip_id):
    try:
        data = request.json
        activities = data.get('activities', [])
        result = trips_collection.update_one(
            {'_id': ObjectId(trip_id)},
            {'$set': {'activities': activities}}
        )
        if result.modified_count > 0:
            return jsonify({'success': True, 'message': 'Attività aggiornate'}), 200
        else:
            return jsonify({'success': False, 'message': 'Nessuna modifica'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# H) SPESE
@app.route('/api/trips/<trip_id>/expenses', methods=['PUT'])
def update_expenses(trip_id):
    try:
        data = request.json
        expenses = data.get('expenses', [])
        result = trips_collection.update_one(
            {'_id': ObjectId(trip_id)},
            {'$set': {'expenses': expenses}}
        )
        if result.modified_count > 0:
            return jsonify({'success': True, 'message': 'Spese aggiornate'}), 200
        else:
            return jsonify({'success': False, 'message': 'Nessuna modifica'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# H) RIEPILOGO SPESE
@app.route('/api/trips/<trip_id>/summary', methods=['GET'])
def get_expenses_summary(trip_id):
    try:
        trip = trips_collection.find_one({'_id': ObjectId(trip_id)})
        if not trip:
            return jsonify({'success': False, 'message': 'Viaggio non trovato'}), 404
        expenses = trip.get('expenses', [])
        total = sum(exp.get('amount', 0) for exp in expenses)
        return jsonify({
            'success': True,
            'summary': {
                'total': total,
                'currency': 'EUR',
                'count': len(expenses)
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# I) MAPPA
@app.route('/api/trips/map', methods=['GET'])
def get_trips_map():
    trips = list(trips_collection.find(
        {'lat': {'$exists': True}, 'lng': {'$exists': True}}
    ))
    map_data = []
    for trip in trips:
        map_data.append({
            'id': str(trip['_id']),
            'title': trip['title'],
            'destination': trip['destination'],
            'lat': trip['lat'],
            'lng': trip['lng'],
            'status': trip.get('status', 'planned')
        })
    return jsonify({'success': True, 'trips': map_data}), 200

if __name__ == '__main__':
    print("🚀 Server Flask avviato su http://localhost:5000")
    app.run(debug=True, port=5000)
