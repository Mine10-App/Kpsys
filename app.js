// DOM elements
const dateField = document.getElementById('dateField');
const codeField = document.getElementById('codeField');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMessage = document.getElementById('statusMessage');
const statusText = document.getElementById('statusText');
const statusDetails = document.getElementById('statusDetails');
const savedItemsList = document.getElementById('savedItemsList');
const firebaseStatusIndicator = document.getElementById('firebaseStatusIndicator');
const firebaseStatusText = document.getElementById('firebaseStatusText');

// Set today's date as default
const today = new Date().toISOString().split('T')[0];
dateField.value = today;

// Firebase Firestore collection name
const COLLECTION_NAME = 'savedCodes';

// Check Firebase connection
let isFirebaseConnected = false;

// Test Firebase connection
function testFirebaseConnection() {
    firebaseStatusIndicator.classList.remove('connected');
    firebaseStatusText.textContent = 'Testing Firebase connection...';
    
    // Try to read from Firestore to test connection
    db.collection(COLLECTION_NAME).limit(1).get()
        .then(() => {
            isFirebaseConnected = true;
            firebaseStatusIndicator.classList.add('connected');
            firebaseStatusText.textContent = 'Connected to Firebase';
            saveBtn.disabled = false;
            showStatus('success', 'Firebase Connected', 'Successfully connected to Firebase Firestore.', 3000);
            loadSavedItems();
        })
        .catch((error) => {
            isFirebaseConnected = false;
            firebaseStatusText.textContent = 'Firebase Connection Failed';
            showStatus('error', 'Firebase Connection Error', error.message);
            console.error('Firebase connection error:', error);
        });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Test Firebase connection
    testFirebaseConnection();
    
    // Set up event listeners
    saveBtn.addEventListener('click', saveToFirebase);
    clearBtn.addEventListener('click', clearFields);
    
    // Load saved items
    if (isFirebaseConnected) {
        loadSavedItems();
    }
});

// Save data to Firebase
function saveToFirebase() {
    if (!isFirebaseConnected) {
        showStatus('error', 'Not Connected', 'Cannot save: Firebase is not connected.');
        return;
    }
    
    const date = dateField.value;
    const code = codeField.value.trim();
    
    // Validate inputs
    if (!date) {
        showStatus('error', 'Missing Date', 'Please select a date.');
        dateField.focus();
        return;
    }
    
    if (!code) {
        showStatus('error', 'Missing Code', 'Please enter some code.');
        codeField.focus();
        return;
    }
    
    // Disable save button during save operation
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Create data object
    const data = {
        date: date,
        code: code,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        created: new Date().toISOString()
    };
    
    // Save to Firestore
    db.collection(COLLECTION_NAME).add(data)
        .then((docRef) => {
            console.log('Document written with ID: ', docRef.id);
            showStatus('success', 'Saved Successfully!', `Data saved to Firebase with ID: ${docRef.id}`);
            
            // Clear fields after successful save
            codeField.value = '';
            
            // Reload saved items
            loadSavedItems();
        })
        .catch((error) => {
            console.error('Error adding document: ', error);
            showStatus('error', 'Save Failed', `Error: ${error.message}`);
        })
        .finally(() => {
            // Re-enable save button
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save to Firebase';
        });
}

// Load saved items from Firebase
function loadSavedItems() {
    if (!isFirebaseConnected) return;
    
    savedItemsList.innerHTML = '<div class="empty-message">Loading saved items...</div>';
    
    db.collection(COLLECTION_NAME)
        .orderBy('timestamp', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                savedItemsList.innerHTML = '<div class="empty-message">No items saved yet. Save your first code snippet!</div>';
                return;
            }
            
            savedItemsList.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const itemElement = createSavedItemElement(doc.id, data);
                savedItemsList.appendChild(itemElement);
            });
        })
        .catch((error) => {
            console.error('Error loading documents: ', error);
            savedItemsList.innerHTML = `<div class="empty-message">Error loading data: ${error.message}</div>`;
        });
}

// Create HTML element for a saved item
function createSavedItemElement(id, data) {
    const div = document.createElement('div');
    div.className = 'saved-item';
    div.setAttribute('data-id', id);
    
    // Format date for display
    const displayDate = data.date || 'No date';
    
    // Format timestamp
    let displayTime = 'Recent';
    if (data.timestamp && data.timestamp.toDate) {
        displayTime = data.timestamp.toDate().toLocaleString();
    } else if (data.created) {
        displayTime = new Date(data.created).toLocaleString();
    }
    
    div.innerHTML = `
        <div class="saved-item-header">
            <div class="saved-date">${displayDate}</div>
            <button class="delete-btn" onclick="deleteItem('${id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
        <div class="saved-code">${escapeHtml(data.code || '')}</div>
        <div style="margin-top: 10px; font-size: 0.8rem; color: #64748b;">
            <i class="far fa-clock"></i> Saved: ${displayTime}
        </div>
    `;
    
    return div;
}

// Delete an item from Firebase
function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    if (!isFirebaseConnected) {
        showStatus('error', 'Not Connected', 'Cannot delete: Firebase is not connected.');
        return;
    }
    
    db.collection(COLLECTION_NAME).doc(id).delete()
        .then(() => {
            showStatus('success', 'Item Deleted', 'The item has been deleted successfully.');
            
            // Remove from UI
            const itemElement = document.querySelector(`.saved-item[data-id="${id}"]`);
            if (itemElement) {
                itemElement.remove();
            }
            
            // Check if list is now empty
            if (savedItemsList.children.length === 0) {
                savedItemsList.innerHTML = '<div class="empty-message">No items saved yet. Save your first code snippet!</div>';
            }
        })
        .catch((error) => {
            console.error('Error deleting document: ', error);
            showStatus('error', 'Delete Failed', `Error: ${error.message}`);
        });
}

// Clear input fields
function clearFields() {
    codeField.value = '';
    codeField.focus();
    showStatus('info', 'Fields Cleared', 'Code field has been cleared. Date remains unchanged.');
}

// Show status message
function showStatus(type, title, message, autoHideDuration = 5000) {
    // Set status type and content
    statusMessage.className = `status-message show ${type}`;
    statusText.textContent = title;
    statusDetails.textContent = message;
    
    // Auto-hide after duration
    if (autoHideDuration > 0) {
        setTimeout(() => {
            statusMessage.classList.remove('show');
        }, autoHideDuration);
    }
}

// Utility function to escape HTML (for security)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Real-time updates (optional)
// Uncomment this if you want real-time updates
/*
db.collection(COLLECTION_NAME)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
        console.log('Real-time update received');
        loadSavedItems();
    }, (error) => {
        console.error('Error in real-time listener:', error);
    });
*/
