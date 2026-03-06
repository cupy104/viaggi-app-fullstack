/**
 * Main JavaScript per Web App Viaggi di Gruppo
 * Gestisce tutte le interazioni frontend: login, CRUD viaggi,
 * gestione partecipanti/attività/spese, mappa, download PDF
 */

// ========================================
// CONFIGURAZIONE
// ========================================

const API_BASE_URL = 'http://localhost:5000/api';

// Stato applicazione
let currentUser = null;
let allUsers = [];
let allTrips = [];
let currentTrip = null;
let tripFilter = 'all'; // 'all', 'done', 'upcoming'
let mapInstance = null;

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Mostra/nasconde sezioni
 */
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

/**
 * Mostra/nasconde tab
 */
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

/**
 * Mostra/nasconde modale
 */
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

/**
 * Formatta data per visualizzazione
 */
function formatDate(dateString) {
    if (!dateString) return 'N/D';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/D';
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Mostra messaggio di errore/successo
 */
function showMessage(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = type === 'error' ? 'error-message show' : 'message show ' + type;

    if (type === 'success') {
        setTimeout(() => {
            element.classList.remove('show');
        }, 3000);
    }
}

// ========================================
// API CALLS
// ========================================

/**
 * Chiamata API generica
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Errore nella richiesta');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ========================================
// LOGIN
// ========================================

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const user = await apiCall('/login', 'POST', { username, password });
        currentUser = user;

        // Salva utente in sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        // Vai alla dashboard
        document.getElementById('user-name').textContent = `${user.nome} ${user.cognome}`;
        showSection('dashboard-section');

        // Carica dati iniziali
        await loadUsers();
        await loadTrips();

    } catch (error) {
        showMessage('login-error', error.message);
    }
});

// ========================================
// LOGOUT
// ========================================

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showSection('login-section');
    document.getElementById('login-form').reset();
});

// ========================================
// CARICAMENTO DATI
// ========================================

/**
 * Carica tutti gli utenti
 */
async function loadUsers() {
    try {
        allUsers = await apiCall('/users');
    } catch (error) {
        console.error('Errore caricamento utenti:', error);
    }
}

/**
 * Carica tutti i viaggi
 */
async function loadTrips() {
    try {
        allTrips = await apiCall('/trips');
        renderTrips();
    } catch (error) {
        console.error('Errore caricamento viaggi:', error);
        document.getElementById('trips-container').innerHTML = 
            `<p style="text-align: center; color: var(--danger-color);">Errore nel caricamento dei viaggi</p>`;
    }
}

// ========================================
// RENDER VIAGGI
// ========================================

function renderTrips() {
    const container = document.getElementById('trips-container');

    // Filtra viaggi in base al filtro attivo
    let filteredTrips = allTrips;
    if (tripFilter === 'done') {
        filteredTrips = allTrips.filter(t => t.completato);
    } else if (tripFilter === 'upcoming') {
        filteredTrips = allTrips.filter(t => !t.completato);
    }

    if (filteredTrips.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-medium);">Nessun viaggio trovato</p>';
        return;
    }

    container.innerHTML = filteredTrips.map(trip => `
        <div class="trip-card" onclick="showTripDetail('${trip._id}')">
            <div class="trip-card-header">
                <h3 class="trip-card-title">${trip.titolo}</h3>
                <div class="trip-card-destination">
                    📍 ${trip.destinazione}
                </div>
            </div>
            <div class="trip-card-body">
                <div class="trip-card-info">
                    <div class="info-row">
                        🗓️ ${formatDate(trip.data_inizio)} - ${formatDate(trip.data_fine)}
                    </div>
                    <div class="info-row">
                        👥 ${trip.partecipanti ? trip.partecipanti.length : 0} partecipanti
                    </div>
                    ${trip.descrizione ? `
                        <div class="info-row" style="margin-top: 0.5rem; color: var(--text-medium);">
                            ${trip.descrizione.substring(0, 100)}${trip.descrizione.length > 100 ? '...' : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="trip-card-footer">
                <span class="trip-status ${trip.completato ? 'completed' : 'upcoming'}">
                    ${trip.completato ? '✓ Completato' : '➜ Da fare'}
                </span>
                <span style="font-size: 0.875rem; color: var(--text-light);">
                    ${trip.attivita ? trip.attivita.length : 0} attività
                </span>
            </div>
        </div>
    `).join('');
}

// ========================================
// FILTRI VIAGGI
// ========================================

document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        tripFilter = e.target.dataset.filter;

        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        renderTrips();
    });
});

// ========================================
// DETTAGLIO VIAGGIO
// ========================================

async function showTripDetail(tripId) {
    try {
        currentTrip = await apiCall(`/trips/${tripId}`);

        // Popola contenuto dettaglio
        const content = document.getElementById('trip-detail-content');
        content.innerHTML = `
            <h2 class="detail-title">${currentTrip.titolo}</h2>
            
            <div class="detail-info-grid">
                <div class="detail-info-item">
                    <div class="detail-info-label">Destinazione</div>
                    <div class="detail-info-value">📍 ${currentTrip.destinazione}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">Data Inizio</div>
                    <div class="detail-info-value">🗓️ ${formatDate(currentTrip.data_inizio)}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">Data Fine</div>
                    <div class="detail-info-value">🗓️ ${formatDate(currentTrip.data_fine)}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">Stato</div>
                    <div class="detail-info-value">
                        <span class="trip-status ${currentTrip.completato ? 'completed' : 'upcoming'}">
                            ${currentTrip.completato ? '✓ Completato' : '➜ Da fare'}
                        </span>
                    </div>
                </div>
            </div>

            ${currentTrip.descrizione ? `
                <div style="margin-top: 1.5rem;">
                    <h4 style="color: var(--text-medium); font-size: 0.875rem; margin-bottom: 0.5rem;">Descrizione</h4>
                    <p style="line-height: 1.6;">${currentTrip.descrizione}</p>
                </div>
            ` : ''}

            ${currentTrip.note ? `
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-light); border-radius: var(--radius-md);">
                    <h4 style="color: var(--text-medium); font-size: 0.875rem; margin-bottom: 0.5rem;">Note</h4>
                    <p style="line-height: 1.6;">${currentTrip.note}</p>
                </div>
            ` : ''}
        `;

        // Renderizza partecipanti, attività, spese
        renderParticipants();
        renderActivities();
        await renderExpenses();

        showTab('trip-detail');

    } catch (error) {
        console.error('Errore caricamento dettaglio:', error);
        alert('Errore nel caricamento del viaggio');
    }
}

document.getElementById('back-to-list').addEventListener('click', () => {
    showTab('trips-list');
    currentTrip = null;
});

// ========================================
// PARTECIPANTI
// ========================================

function renderParticipants() {
    const container = document.getElementById('participants-list');

    if (!currentTrip.partecipanti_dettagli || currentTrip.partecipanti_dettagli.length === 0) {
        container.innerHTML = '<p style="color: var(--text-medium);">Nessun partecipante</p>';
        return;
    }

    container.innerHTML = currentTrip.partecipanti_dettagli.map(p => `
        <div class="participant-item">
            <span>👤 ${p.nome} ${p.cognome}</span>
        </div>
    `).join('');
}

document.getElementById('manage-participants-btn').addEventListener('click', () => {
    // Popola checkboxes con tutti gli utenti
    const checkboxesContainer = document.getElementById('participants-checkboxes');

    checkboxesContainer.innerHTML = allUsers.map(user => {
        const isParticipant = currentTrip.partecipanti.includes(user._id);
        return `
            <label class="participant-checkbox">
                <input type="checkbox" value="${user._id}" ${isParticipant ? 'checked' : ''}>
                ${user.nome} ${user.cognome}
            </label>
        `;
    }).join('');

    showModal('participants-modal');
});

document.getElementById('save-participants-btn').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('#participants-checkboxes input:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    try {
        await apiCall(`/trips/${currentTrip._id}/participants`, 'PUT', {
            partecipanti: selectedIds
        });

        // Ricarica dettaglio
        await showTripDetail(currentTrip._id);
        hideModal('participants-modal');

    } catch (error) {
        alert('Errore nell\'aggiornamento dei partecipanti: ' + error.message);
    }
});

// ========================================
// ATTIVITÀ
// ========================================

function renderActivities() {
    const container = document.getElementById('activities-list');

    if (!currentTrip.attivita || currentTrip.attivita.length === 0) {
        container.innerHTML = '<p style="color: var(--text-medium);">Nessuna attività pianificata</p>';
        return;
    }

    container.innerHTML = currentTrip.attivita.map(att => `
        <div class="activity-item">
            <div class="activity-header">
                <span class="activity-title">📍 ${att.titolo}</span>
                <div class="item-actions">
                    <button class="btn-icon" onclick="deleteActivity('${att._id}')">🗑️</button>
                </div>
            </div>
            ${att.descrizione ? `<p style="color: var(--text-medium); font-size: 0.875rem; margin-bottom: 0.5rem;">${att.descrizione}</p>` : ''}
            <div class="activity-meta">
                ${att.data ? `🗓️ ${formatDateTime(att.data)}` : ''}
                ${att.luogo ? `<br>📌 ${att.luogo}` : ''}
                ${att.note ? `<br>📝 ${att.note}` : ''}
            </div>
        </div>
    `).join('');
}

document.getElementById('add-activity-btn').addEventListener('click', () => {
    document.getElementById('activity-modal-title').textContent = 'Aggiungi Attività';
    document.getElementById('activity-form').reset();
    document.getElementById('activity-id').value = '';
    showModal('activity-modal');
});

document.getElementById('save-activity-btn').addEventListener('click', async () => {
    const activityId = document.getElementById('activity-id').value;
    const data = {
        titolo: document.getElementById('activity-title').value,
        descrizione: document.getElementById('activity-description').value,
        data: document.getElementById('activity-date').value || null,
        luogo: document.getElementById('activity-location').value,
        note: document.getElementById('activity-notes').value
    };

    if (!data.titolo) {
        alert('Il titolo è obbligatorio');
        return;
    }

    try {
        if (activityId) {
            // Modifica esistente
            await apiCall(`/trips/${currentTrip._id}/activities/${activityId}`, 'PUT', data);
        } else {
            // Nuova attività
            await apiCall(`/trips/${currentTrip._id}/activities`, 'POST', data);
        }

        await showTripDetail(currentTrip._id);
        hideModal('activity-modal');

    } catch (error) {
        alert('Errore nel salvataggio dell\'attività: ' + error.message);
    }
});

async function deleteActivity(activityId) {
    if (!confirm('Sei sicuro di voler eliminare questa attività?')) return;

    try {
        await apiCall(`/trips/${currentTrip._id}/activities/${activityId}`, 'DELETE');
        await showTripDetail(currentTrip._id);
    } catch (error) {
        alert('Errore nell\'eliminazione: ' + error.message);
    }
}

// ========================================
// SPESE
// ========================================

async function renderExpenses() {
    const listContainer = document.getElementById('expenses-list');
    const summaryContainer = document.getElementById('expenses-summary');

    if (!currentTrip.spese || currentTrip.spese.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-medium);">Nessuna spesa registrata</p>';
        summaryContainer.innerHTML = '';
        return;
    }

    // Recupera riepilogo
    try {
        const summary = await apiCall(`/trips/${currentTrip._id}/expenses/summary`);

        summaryContainer.innerHTML = `
            <div class="summary-total">Totale: €${summary.totale.toFixed(2)}</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">${summary.numero_spese} spese registrate</div>
            <div class="summary-breakdown">
                ${Object.entries(summary.per_categoria).map(([cat, amount]) => `
                    <div class="category-item">${cat}: €${amount.toFixed(2)}</div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Errore riepilogo spese:', error);
    }

    // Renderizza lista spese
    listContainer.innerHTML = currentTrip.spese.map(spesa => {
        const pagatoDa = currentTrip.partecipanti_dettagli?.find(p => p._id === spesa.pagato_da);
        return `
            <div class="expense-item">
                <div class="expense-header">
                    <span class="expense-description">💳 ${spesa.descrizione}</span>
                    <strong style="color: var(--primary-color);">€${spesa.importo.toFixed(2)}</strong>
                </div>
                <div class="expense-meta">
                    🏷️ ${spesa.categoria} 
                    ${pagatoDa ? `• Pagato da ${pagatoDa.nome} ${pagatoDa.cognome}` : ''}
                    ${spesa.data ? `• ${formatDate(spesa.data)}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

document.getElementById('add-expense-btn').addEventListener('click', () => {
    // Popola select utenti
    const select = document.getElementById('expense-paid-by');
    select.innerHTML = '<option value="">Seleziona...</option>' +
        allUsers.map(u => `<option value="${u._id}">${u.nome} ${u.cognome}</option>`).join('');

    document.getElementById('expense-form').reset();
    // Imposta data odierna di default
    document.getElementById('expense-date').valueAsDate = new Date();
    showModal('expense-modal');
});

document.getElementById('save-expense-btn').addEventListener('click', async () => {
    const data = {
        descrizione: document.getElementById('expense-description').value,
        importo: parseFloat(document.getElementById('expense-amount').value),
        categoria: document.getElementById('expense-category').value,
        pagato_da: document.getElementById('expense-paid-by').value || null,
        data: document.getElementById('expense-date').value || null
    };

    if (!data.descrizione || !data.importo) {
        alert('Descrizione e importo sono obbligatori');
        return;
    }

    try {
        await apiCall(`/trips/${currentTrip._id}/expenses`, 'POST', data);
        await showTripDetail(currentTrip._id);
        hideModal('expense-modal');
    } catch (error) {
        alert('Errore nel salvataggio della spesa: ' + error.message);
    }
});

// ========================================
// DOWNLOAD PDF
// ========================================

document.getElementById('download-pdf-btn').addEventListener('click', async () => {
    if (!currentTrip) return;

    try {
        const response = await fetch(`${API_BASE_URL}/trips/${currentTrip._id}/pdf`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentTrip.titolo.replace(/ /g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('Errore nel download del PDF: ' + error.message);
    }
});

// ========================================
// ELIMINA VIAGGIO
// ========================================

document.getElementById('delete-trip-btn').addEventListener('click', async () => {
    if (!currentTrip) return;

    if (!confirm(`Sei sicuro di voler eliminare il viaggio "${currentTrip.titolo}"?`)) return;

    try {
        await apiCall(`/trips/${currentTrip._id}`, 'DELETE');
        await loadTrips();
        showTab('trips-list');
        currentTrip = null;
    } catch (error) {
        alert('Errore nell\'eliminazione: ' + error.message);
    }
});

// ========================================
// NUOVO VIAGGIO
// ========================================

document.getElementById('new-trip-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        titolo: document.getElementById('trip-title').value,
        destinazione: document.getElementById('trip-destination').value,
        data_inizio: document.getElementById('trip-start-date').value || null,
        data_fine: document.getElementById('trip-end-date').value || null,
        coordinate: {
            lat: parseFloat(document.getElementById('trip-lat').value) || 0,
            lng: parseFloat(document.getElementById('trip-lng').value) || 0
        },
        descrizione: document.getElementById('trip-description').value,
        note: document.getElementById('trip-notes').value,
        completato: document.getElementById('trip-completed').checked,
        partecipanti: [],
        created_by: currentUser._id
    };

    try {
        await apiCall('/trips', 'POST', data);
        await loadTrips();
        showMessage('new-trip-message', 'Viaggio creato con successo!', 'success');
        document.getElementById('new-trip-form').reset();

        // Torna alla lista dopo 2 secondi
        setTimeout(() => {
            showTab('trips-list');
        }, 2000);

    } catch (error) {
        showMessage('new-trip-message', 'Errore nella creazione: ' + error.message, 'error');
    }
});

// ========================================
// MAPPA
// ========================================

function initMap() {
    const mapContainer = document.getElementById('map-container');

    // Inizializza mappa centrata sull'Italia
    mapInstance = L.map(mapContainer).setView([42.5, 12.5], 6);

    // Tile layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    renderMapMarkers();
}

function renderMapMarkers() {
    if (!mapInstance) return;

    // Rimuovi marker precedenti
    mapInstance.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            mapInstance.removeLayer(layer);
        }
    });

    // Aggiungi marker per ogni viaggio
    allTrips.forEach(trip => {
        if (!trip.coordinate || !trip.coordinate.lat || !trip.coordinate.lng) return;

        // Icona personalizzata in base allo stato
        const iconColor = trip.completato ? '#ef4444' : '#10b981'; // rosso o verde
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 30px;
                height: 30px;
                background-color: ${iconColor};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([trip.coordinate.lat, trip.coordinate.lng], { icon })
            .addTo(mapInstance);

        // Popup con info viaggio
        const popupContent = `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 0.5rem 0;">${trip.titolo}</h4>
                <p style="margin: 0.25rem 0; font-size: 0.875rem;">
                    📍 ${trip.destinazione}
                </p>
                <p style="margin: 0.25rem 0; font-size: 0.875rem;">
                    🗓️ ${formatDate(trip.data_inizio)}
                </p>
                <p style="margin: 0.5rem 0 0 0;">
                    <span style="
                        display: inline-block;
                        padding: 0.25rem 0.5rem;
                        border-radius: 9999px;
                        font-size: 0.75rem;
                        background: ${trip.completato ? '#d1fae5' : '#dbeafe'};
                        color: ${trip.completato ? '#065f46' : '#1e40af'};
                    ">
                        ${trip.completato ? '✓ Completato' : '➜ Da fare'}
                    </span>
                </p>
                <button 
                    onclick="showTripDetail('${trip._id}')"
                    style="
                        margin-top: 0.75rem;
                        width: 100%;
                        padding: 0.5rem;
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        border-radius: 0.375rem;
                        cursor: pointer;
                        font-weight: 500;
                    "
                >
                    Vedi Dettagli
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);
    });
}

// ========================================
// TAB NAVIGATION
// ========================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        showTab(tabId);

        // Inizializza mappa quando si apre il tab
        if (tabId === 'map-view' && !mapInstance) {
            setTimeout(() => initMap(), 100);
        } else if (tabId === 'map-view' && mapInstance) {
            // Rinfresca marker
            renderMapMarkers();
            mapInstance.invalidateSize();
        }
    });
});

// ========================================
// MODAL HANDLERS
// ========================================

// Chiudi modal cliccando su X o Annulla
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        modal.classList.remove('show');
    });
});

// Chiudi modal cliccando fuori dal contenuto
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// ========================================
// INIZIALIZZAZIONE
// ========================================

// Verifica se l'utente è già loggato (sessionStorage)
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('currentUser');

    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('user-name').textContent = `${currentUser.nome} ${currentUser.cognome}`;
        showSection('dashboard-section');
        loadUsers();
        loadTrips();
    }
});
