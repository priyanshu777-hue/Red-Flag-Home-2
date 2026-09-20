// Red Flag Homes Network - Firebase Auth & Cloud Firestore Client
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc 
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

let app, auth, db;
let currentUser = null;
const authSubscribers = [];

export async function initFirebase() {
  if (app) return { app, auth, db };

  let config;
  try {
    const res = await fetch('/firebase-applet-config.json');
    config = await res.json();
  } catch (err) {
    console.error('Failed to load firebase-applet-config.json:', err);
    throw err;
  }

  const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  };

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Connect to the specific firestore database ID provisioned for this project
  const dbId = config.firestoreDatabaseId || '(default)';
  db = getFirestore(app, dbId);

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      try {
        await syncUserProfile(user);
      } catch (e) {
        console.warn('Profile sync notice:', e);
      }
    }
    authSubscribers.forEach(fn => fn(user));
  });

  return { app, auth, db };
}

export function onUserChange(callback) {
  authSubscribers.push(callback);
  if (auth && currentUser !== undefined) {
    callback(currentUser);
  }
}

export function getCurrentUser() {
  return currentUser;
}

export async function signInWithGoogle() {
  if (!auth) await initFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    await syncUserProfile(currentUser);
    return currentUser;
  } catch (err) {
    console.error('Google Sign-in failed:', err);
    throw err;
  }
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
  currentUser = null;
}

export async function syncUserProfile(user) {
  if (!db || !user) return;
  const userRef = doc(db, 'users', user.uid);
  const data = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Guest',
    photoURL: user.photoURL || '',
    lastLoginAt: new Date().toISOString()
  };
  await setDoc(userRef, data, { merge: true });
}

// PERSISTENCE: Franchise Allocation Applications
export async function submitAllocationApplication(formData) {
  if (!db) await initFirebase();
  if (!currentUser) {
    try {
      currentUser = await signInWithGoogle();
    } catch (authErr) {
      console.warn('Google sign-in skipped or cancelled:', authErr);
    }
  }
  if (!currentUser) {
    throw new Error('Please sign in with Google to submit and track your franchise allocation.');
  }

  const appData = {
    userId: currentUser.uid,
    userEmail: currentUser.email || '',
    userName: formData.name || currentUser.displayName || 'Applicant',
    phone: formData.phone || '',
    city: formData.city || '',
    capital: formData.capital || '',
    propertyIntent: formData.property || 'Looking',
    existingClient: formData.existingClient || 'No',
    tier: formData.tier || 'Red Flag Outpost',
    status: 'Under Review',
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'applications'), appData);
  return { id: docRef.id, ...appData };
}

export function subscribeToUserApplications(userId, callback) {
  if (!db || !userId) return () => {};
  const q = query(
    collection(db, 'applications'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const apps = [];
    snapshot.forEach(doc => {
      apps.push({ id: doc.id, ...doc.data() });
    });
    // sort newest first
    apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    callback(apps);
  }, (err) => {
    console.error('Error fetching applications:', err);
  });
}

export async function deleteApplication(appId) {
  if (!db) return;
  await deleteDoc(doc(db, 'applications', appId));
}

// PERSISTENCE: Booking Inquiries
export async function submitBookingInquiry(inquiryData) {
  if (!db) await initFirebase();
  if (!currentUser) {
    try {
      currentUser = await signInWithGoogle();
    } catch (authErr) {
      console.warn('Google sign-in skipped or cancelled:', authErr);
    }
  }
  if (!currentUser) {
    throw new Error('Please sign in with Google to record and track your booking inquiry.');
  }

  const payload = {
    userId: currentUser.uid,
    userEmail: currentUser.email || '',
    userName: inquiryData.name || currentUser.displayName || 'Guest',
    phone: inquiryData.phone || '',
    destination: inquiryData.destination || inquiryData.location || 'Red Flag Stays',
    checkin: inquiryData.checkin || '',
    checkout: inquiryData.checkout || '',
    guests: inquiryData.guests || '2',
    intent: inquiryData.intent || 'book',
    status: 'Inquiry Received',
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'inquiries'), payload);
  return { id: docRef.id, ...payload };
}

export function subscribeToUserInquiries(userId, callback) {
  if (!db || !userId) return () => {};
  const q = query(
    collection(db, 'inquiries'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const inquiries = [];
    snapshot.forEach(doc => {
      inquiries.push({ id: doc.id, ...doc.data() });
    });
    inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    callback(inquiries);
  }, (err) => {
    console.error('Error fetching inquiries:', err);
  });
}

export async function deleteInquiry(inquiryId) {
  if (!db) return;
  await deleteDoc(doc(db, 'inquiries', inquiryId));
}

// SHARED LUXURY UI COMPONENT FOR AUTH & USER ACTIVITY DRAWER
export function mountAuthNavigation(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Insert styles if not already present
  if (!document.getElementById('rf-auth-styles')) {
    const style = document.createElement('style');
    style.id = 'rf-auth-styles';
    style.textContent = `
      .rf-auth-btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 999px;
        padding: 0.35rem 0.85rem;
        color: rgba(255, 255, 255, 0.7);
        font-family: inherit;
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        cursor: pointer;
        transition: color 350ms ease, border-color 350ms ease, background-color 350ms ease;
        text-decoration: none;
        user-select: none;
        position: relative;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        white-space: nowrap;
      }
      .rf-auth-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.6);
        color: #FFFFFF;
      }
      .rf-auth-btn.signed-in {
        padding: 0.25rem 0.75rem 0.25rem 0.35rem;
        gap: 7px;
      }
      .rf-auth-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
        background: #E5231B;
        color: #FFF;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid rgba(255, 255, 255, 0.25);
      }
      .rf-auth-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 240px;
        background: #0A0D12;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 8px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        display: none;
        flex-direction: column;
        gap: 4px;
        z-index: 100000;
      }
      .rf-auth-menu.open {
        display: flex;
      }
      .rf-menu-header {
        padding: 8px 10px 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        margin-bottom: 4px;
      }
      .rf-menu-name {
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        font-weight: 600;
        color: #FFF;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .rf-menu-email {
        font-family: 'Inter', sans-serif;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .rf-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 6px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.85);
        font-family: 'Inter', sans-serif;
        font-size: 11.5px;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        width: 100%;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .rf-menu-item:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #FFFFFF;
      }
      .rf-menu-item.logout:hover {
        background: rgba(229, 35, 27, 0.15);
        color: #E5231B;
      }

      /* Activity Drawer / Modal */
      #rf-activity-modal {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        padding: 20px;
      }
      #rf-activity-modal.open {
        opacity: 1;
        pointer-events: auto;
      }
      .rf-modal-content {
        background: #080B0F;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        width: 100%;
        max-width: 680px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
        color: #FFF;
      }
      .rf-modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .rf-modal-title {
        font-family: 'Michroma', sans-serif;
        font-size: 13px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #FFF;
      }
      .rf-modal-close {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .rf-modal-close:hover {
        color: #FFF;
        border-color: #FFF;
      }
      .rf-modal-body {
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .rf-activity-section-title {
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #E5231B;
        font-weight: 700;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .rf-card-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: relative;
      }
      .rf-card-item:hover {
        border-color: rgba(255, 255, 255, 0.18);
      }
      .rf-status-pill {
        display: inline-flex;
        align-items: center;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 9.5px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: rgba(229, 35, 27, 0.15);
        color: #E5231B;
        border: 1px solid rgba(229, 35, 27, 0.3);
      }
      .rf-empty-notice {
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.4);
        padding: 16px 0;
        text-align: center;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        border: 1px dashed rgba(255, 255, 255, 0.08);
      }
    `;
    document.head.appendChild(style);
  }

  // Render container shell
  container.innerHTML = `
    <div style="position: relative; display: inline-block;">
      <div id="rf-auth-trigger-slot"></div>
      <div id="rf-auth-dropdown" class="rf-auth-menu">
        <div class="rf-menu-header">
          <div class="rf-menu-name" id="rf-menu-user-name">Guest</div>
          <div class="rf-menu-email" id="rf-menu-user-email">guest@redflag.com</div>
        </div>
        <button class="rf-menu-item" id="rf-menu-view-activity">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          My Allocations & Bookings
        </button>
        <button class="rf-menu-item logout" id="rf-menu-logout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    </div>
  `;

  // Create Modal Shell once on body
  let modal = document.getElementById('rf-activity-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'rf-activity-modal';
    modal.innerHTML = `
      <div class="rf-modal-content">
        <div class="rf-modal-head">
          <div class="rf-modal-title">My Account & Activity</div>
          <button class="rf-modal-close" id="rf-modal-close-btn" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="rf-modal-body">
          <div>
            <div class="rf-activity-section-title">
              <span>Franchise Allocations (Firestore)</span>
              <span id="rf-alloc-count" style="font-size: 9.5px; opacity: 0.7;">0 Records</span>
            </div>
            <div id="rf-alloc-list" style="display: flex; flex-direction: column; gap: 10px;">
              <div class="rf-empty-notice">No franchise allocation requests submitted yet.</div>
            </div>
          </div>
          <div>
            <div class="rf-activity-section-title">
              <span>Booking Inquiries (Firestore)</span>
              <span id="rf-inq-count" style="font-size: 9.5px; opacity: 0.7;">0 Records</span>
            </div>
            <div id="rf-inq-list" style="display: flex; flex-direction: column; gap: 10px;">
              <div class="rf-empty-notice">No stay reservations or inquiries submitted yet.</div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('rf-modal-close-btn').addEventListener('click', () => {
      modal.classList.remove('open');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  const triggerSlot = document.getElementById('rf-auth-trigger-slot');
  const dropdown = document.getElementById('rf-auth-dropdown');
  const menuUserName = document.getElementById('rf-menu-user-name');
  const menuUserEmail = document.getElementById('rf-menu-user-email');
  const viewActivityBtn = document.getElementById('rf-menu-view-activity');
  const logoutBtn = document.getElementById('rf-menu-logout');

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  viewActivityBtn.addEventListener('click', () => {
    dropdown.classList.remove('open');
    modal.classList.add('open');
  });

  logoutBtn.addEventListener('click', async () => {
    dropdown.classList.remove('open');
    await signOutUser();
  });

  let unsubApps = null;
  let unsubInqs = null;

  function renderTrigger(user) {
    if (unsubApps) { unsubApps(); unsubApps = null; }
    if (unsubInqs) { unsubInqs(); unsubInqs = null; }

    if (!user) {
      triggerSlot.innerHTML = `
        <button class="rf-auth-btn" id="rf-signin-btn" title="Sign in with Google">
          <svg width="12" height="12" viewBox="0 0 24 24" style="opacity: 0.8; flex-shrink: 0;" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Sign In</span>
        </button>
      `;
      document.getElementById('rf-signin-btn').addEventListener('click', async () => {
        try {
          await signInWithGoogle();
        } catch (e) {
          console.error(e);
        }
      });
    } else {
      const name = user.displayName || user.email?.split('@')[0] || 'Member';
      const initial = (name.charAt(0) || 'U').toUpperCase();
      menuUserName.textContent = name;
      menuUserEmail.textContent = user.email || '';

      const avatarHtml = user.photoURL 
        ? `<img class="rf-auth-avatar" src="${user.photoURL}" alt="${name}" />`
        : `<div class="rf-auth-avatar">${initial}</div>`;

      triggerSlot.innerHTML = `
        <button class="rf-auth-btn signed-in" id="rf-user-pill-btn">
          ${avatarHtml}
          <span style="max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      `;

      document.getElementById('rf-user-pill-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });

      // Realtime subscribe to allocations and inquiries
      unsubApps = subscribeToUserApplications(user.uid, (apps) => {
        renderAllocationsList(apps);
      });
      unsubInqs = subscribeToUserInquiries(user.uid, (inqs) => {
        renderInquiriesList(inqs);
      });
    }
  }

  function renderAllocationsList(apps) {
    const list = document.getElementById('rf-alloc-list');
    const count = document.getElementById('rf-alloc-count');
    if (!list) return;
    count.textContent = `${apps.length} Records`;

    if (apps.length === 0) {
      list.innerHTML = `<div class="rf-empty-notice">No franchise allocation requests submitted yet.</div>`;
      return;
    }

    list.innerHTML = apps.map(item => `
      <div class="rf-card-item">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <div>
            <div style="font-weight: 600; font-size: 13px; color: #FFF;">${escapeHtml(item.city || 'Outpost Location')} — ${escapeHtml(item.capital || 'Capital')}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px;">Applicant: ${escapeHtml(item.userName)} • ${escapeHtml(item.phone || '')}</div>
          </div>
          <span class="rf-status-pill">${escapeHtml(item.status || 'Under Review')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 10px; color: rgba(255,255,255,0.4);">
          <span>Submitted: ${new Date(item.createdAt).toLocaleDateString()}</span>
          <button data-del-alloc="${item.id}" style="background: none; border: none; color: rgba(255,255,255,0.35); cursor: pointer; text-decoration: underline; font-size: 10px;">Withdraw</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-del-alloc]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-del-alloc');
        if (confirm('Withdraw this allocation application?')) {
          await deleteApplication(id);
        }
      });
    });
  }

  function renderInquiriesList(inqs) {
    const list = document.getElementById('rf-inq-list');
    const count = document.getElementById('rf-inq-count');
    if (!list) return;
    count.textContent = `${inqs.length} Records`;

    if (inqs.length === 0) {
      list.innerHTML = `<div class="rf-empty-notice">No stay reservations or inquiries submitted yet.</div>`;
      return;
    }

    list.innerHTML = inqs.map(item => `
      <div class="rf-card-item">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <div>
            <div style="font-weight: 600; font-size: 13px; color: #FFF;">${escapeHtml(item.destination || 'Stay Inquiry')}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px;">
              ${item.guests ? escapeHtml(item.guests) + ' Guests • ' : ''}
              ${item.checkin ? 'Check-in: ' + escapeHtml(item.checkin) : 'Inquiry'}
            </div>
          </div>
          <span class="rf-status-pill">${escapeHtml(item.status || 'Received')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 10px; color: rgba(255,255,255,0.4);">
          <span>Logged: ${new Date(item.createdAt).toLocaleDateString()}</span>
          <button data-del-inq="${item.id}" style="background: none; border: none; color: rgba(255,255,255,0.35); cursor: pointer; text-decoration: underline; font-size: 10px;">Remove</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-del-inq]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-del-inq');
        if (confirm('Remove this inquiry?')) {
          await deleteInquiry(id);
        }
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Subscribe to user changes
  onUserChange((u) => {
    renderTrigger(u);
  });

  // Initialize Firebase client
  initFirebase();
}
