/*
// Supabase credentials
*/
const SUPABASE_URL = 'https://ntqguutezcmmonutckuz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50cWd1dXRlemNtbW9udXRja3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NDU4NzUsImV4cCI6MjA2MjUyMTg3NX0.3lsCEyvuYU2YcPEkUklJ3CAeltp4PtsvgwIIpxrsWkY';

// initialize the client
const supabase = (typeof window !== 'undefined') ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Function to show notifications instead of alerts
function showNotification(message, type = 'info', duration = 4000) {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.notification-popup');
  existingNotifications.forEach(notification => {
    document.body.removeChild(notification);
  });

  // Create new notification element
  const notification = document.createElement('div');
  notification.className = `notification-popup ${type}`;
  notification.textContent = message;
  notification.style.opacity = '0';

  // Add to DOM
  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);

  // Remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300); // Wait for fade out animation
  }, duration);
}

// Track if we're in review mode to add ESC key functionality
let inReviewMode = false;

// Add these helper functions for downloads

// Function to trigger a download from a data URL
function downloadFromDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to convert base64 to blob for download
function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

// Function to download artwork
function downloadArtwork(artworkDataUrl, artistName, releaseTitle) {
  if (!artworkDataUrl) {
    showNotification('No artwork available to download.', 'error');
    return;
  }

  // Create a sanitized filename
  const filename = `${artistName} - ${releaseTitle} - Artwork.jpg`
    .replace(/[^a-z0-9\s-]/gi, '')  // remove special chars
    .replace(/\s+/g, ' ')            // replace multiple spaces with one
    .trim();

  downloadFromDataUrl(artworkDataUrl, filename);
}

// Function to download audio file
function downloadAudioFile(trackName, artistName, fileName = null, audioUrl = null, audioDataUrl = null) {
  console.log("Download function called with:", { trackName, artistName, fileName, audioUrl, audioDataUrl });

  // If we have a Supabase storage URL, try to use it first
  if (audioUrl) {
    try {
      // Create a sanitized filename for download
      const fileExtension = getFileExtension(fileName || 'mp3');
      const sanitizedFilename = `${artistName} - ${trackName}.${fileExtension}`
        .replace(/[^a-z0-9\s\.-]/gi, '')  // remove special chars except dots and hyphens
        .replace(/\s+/g, ' ')             // replace multiple spaces with one
        .trim();

      // Create a download link
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = sanitizedFilename;
      link.target = '_blank'; // Open in new tab in case browser doesn't support direct download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Download attempt from URL:", audioUrl);
      return; // Exit if URL download was attempted
    } catch (e) {
      console.error("Error downloading from URL:", e);
      // Fall through to next method if URL download fails
    }
  }

  // If we have a data URL as backup, use it
  if (audioDataUrl) {
    try {
      console.log("Trying to download from data URL (length):", audioDataUrl.length);

      // Create a sanitized filename
      const sanitizedFilename = `${artistName} - ${trackName}.mp3`
        .replace(/[^a-z0-9\s\.-]/gi, '')  // remove special chars except dots and hyphens
        .replace(/\s+/g, ' ')             // replace multiple spaces with one
        .trim();

      // Create download from data URL
      const link = document.createElement('a');
      link.href = audioDataUrl;
      link.download = sanitizedFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return; // Exit if data URL download succeeded
    } catch (e) {
      console.error("Error downloading from data URL:", e);
      // Fall through to next method if data URL download fails
    }
  }

  // Check if we have a real file in the uploads directory
  else if (fileName) {
    try {
      // Get the file from the uploads directory
      const downloadLink = `uploads/${fileName}`;

      // Create a sanitized filename for download
      const sanitizedFilename = `${artistName} - ${trackName}${fileName.substring(fileName.lastIndexOf('.'))}`
        .replace(/[^a-z0-9\s\.-]/gi, '')  // remove special chars except dots and hyphens
        .replace(/\s+/g, ' ')            // replace multiple spaces with one
        .trim();

      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = sanitizedFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return; // Exit if file download succeeded
    } catch (e) {
      console.error("Error downloading from uploads:", e);
      // Fall through to fallback if file download fails
    }
  }

  // As a last resort, generate a dummy text file
  else {
    console.log("Falling back to dummy file generation");
    // Fallback to simulated file if no real file exists
    const text = `This would be the audio file for "${trackName}" by ${artistName}.\nIn a real implementation, this would be the actual audio file.`;
    const blob = new Blob([text], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);

    // Create a sanitized filename
    const filename = `${artistName} - ${trackName}.txt`
      .replace(/[^a-z0-9\s-]/gi, '')  // remove special chars
      .replace(/\s+/g, ' ')            // replace multiple spaces with one
      .trim();

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Function to get releases from Supabase instead of localStorage
async function getStoredReleases() {
  try {
    // First try to get releases from Supabase
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .order('submittedAt', { ascending: false });

    if (error) {
      console.error('Error fetching releases from Supabase:', error.message);
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem('musicReleases') || '[]');
    }

    console.log('Releases fetched from Supabase:', data);
    return data || [];
  } catch (e) {
    console.error('Error getting releases:', e);
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('musicReleases') || '[]');
  }
}

// Save releases to Supabase
async function saveReleasesToStorage(releases) {
  try {
    // Save the latest release to Supabase if it's an array
    if (Array.isArray(releases) && releases.length > 0) {
      // Get the most recently added release (last in the array)
      const latestRelease = releases[releases.length - 1];

      // Insert the release into Supabase
      const { data, error } = await supabase
        .from('releases')
        .upsert([latestRelease], {
          onConflict: 'id',
          returning: 'minimal'
        });

      if (error) {
        console.error('Error saving release to Supabase:', error.message);
        // Fallback to localStorage
        localStorage.setItem('musicReleases', JSON.stringify(releases));
      } else {
        console.log('Release saved to Supabase successfully');
      }
    } else {
      // This is an update to an existing release (like status change)
      // Save to localStorage as fallback
      localStorage.setItem('musicReleases', JSON.stringify(releases));
    }
  } catch (e) {
    console.error('Error saving releases:', e);
    // Fallback to localStorage
    localStorage.setItem('musicReleases', JSON.stringify(releases));
  }
}

// Update an existing release (for approvals, rejections, etc.)
async function updateReleaseStatus(releaseId, newStatus) {
  try {
    // Update the release status in Supabase
    const { data, error } = await supabase
      .from('releases')
      .update({ status: newStatus })
      .eq('id', releaseId)
      .select();

    if (error) {
      console.error('Error updating release status in Supabase:', error.message);
      return false;
    }

    console.log('Release status updated in Supabase:', data);
    return true;
  } catch (e) {
    console.error('Error updating release status:', e);
    return false;
  }
}

// Approve release
async function approveRelease(releaseId) {
  try {
    console.log("Approving release:", releaseId);

    // First get the current release data
    const { data: releases, error: fetchError } = await supabase
      .from('releases')
      .select('*')
      .eq('id', releaseId)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching release for approval:', fetchError.message);
      // Fall back to old method if Supabase fetch fails
      fallbackApproveRelease(releaseId);
      return;
    }

    if (!releases || releases.length === 0) {
      console.error('Release not found for approval');
      showNotification('Release not found. Cannot approve.', 'error');
      return;
    }

    const release = releases[0];
    console.log("Release found:", release);

    // Update the status to approved - need to explicitly use UPDATE operation
    const { error } = await supabase
      .from('releases')
      .update({ status: 'approved' })
      .eq('id', releaseId);

    if (error) {
      console.error('Error approving release in Supabase:', error.message);
      // Try fallback method
      fallbackApproveRelease(releaseId);
      return;
    }

    console.log("Release approved successfully in Supabase");

    // Reload the pending releases to update the UI
    await loadPendingReleases();
    showNotification('Release has been approved successfully.', 'success');
  } catch (e) {
    console.error('Error in approve process:', e);
    // Try fallback method
    fallbackApproveRelease(releaseId);
  }
}

// Fallback approval method using localStorage
async function fallbackApproveRelease(releaseId) {
  try {
    // Get current releases from localStorage
    let releases = JSON.parse(localStorage.getItem('musicReleases') || '[]');

    // Find the release to approve
    const updatedReleases = releases.map(release => {
      if (release.id === releaseId) {
        return { ...release, status: 'approved' };
      }
      return release;
    });

    // Save back to localStorage
    localStorage.setItem('musicReleases', JSON.stringify(updatedReleases));

    // Reload the admin dashboard
    loadPendingReleases();

    showNotification('Release has been approved (using fallback method).', 'success');
  } catch (e) {
    console.error('Fallback approval failed:', e);
    showNotification('Failed to approve release. Please try again.', 'error');
  }
}

// Reject release
async function rejectRelease(releaseId) {
  try {
    console.log("Rejecting release:", releaseId);

    // First get the current release data
    const { data: releases, error: fetchError } = await supabase
      .from('releases')
      .select('*')
      .eq('id', releaseId)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching release for rejection:', fetchError.message);
      // Fall back to old method if Supabase fetch fails
      fallbackRejectRelease(releaseId);
      return;
    }

    if (!releases || releases.length === 0) {
      console.error('Release not found for rejection');
      showNotification('Release not found. Cannot reject.', 'error');
      return;
    }

    const release = releases[0];
    console.log("Release found for rejection:", release);

    // Update the status to rejected - need to explicitly use UPDATE operation
    const { error } = await supabase
      .from('releases')
      .update({ status: 'rejected' })
      .eq('id', releaseId);

    if (error) {
      console.error('Error rejecting release in Supabase:', error.message);
      // Try fallback method
      fallbackRejectRelease(releaseId);
      return;
    }

    console.log("Release rejected successfully in Supabase");

    // Reload the pending releases to update the UI
    await loadPendingReleases();
    showNotification('Release has been rejected.', 'success');
  } catch (e) {
    console.error('Error in reject process:', e);
    // Try fallback method
    fallbackRejectRelease(releaseId);
  }
}

// Fallback rejection method using localStorage
async function fallbackRejectRelease(releaseId) {
  try {
    // Get current releases from localStorage
    let releases = JSON.parse(localStorage.getItem('musicReleases') || '[]');

    // Find the release to reject
    const updatedReleases = releases.map(release => {
      if (release.id === releaseId) {
        return { ...release, status: 'rejected' };
      }
      return release;
    });

    // Save back to localStorage
    localStorage.setItem('musicReleases', JSON.stringify(updatedReleases));

    // Reload the admin dashboard
    loadPendingReleases();

    showNotification('Release has been rejected (using fallback method).', 'success');
  } catch (e) {
    console.error('Fallback rejection failed:', e);
    showNotification('Failed to reject release. Please try again.', 'error');
  }
}

// Initialize Supabase storage bucket and table
async function initializeStorage() {
  try {
    // Check if music bucket exists, create if not
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('Error checking buckets:', bucketError.message);
      return;
    }

    const musicBucketExists = buckets.some(bucket => bucket.name === 'music');

    if (!musicBucketExists) {
      // Create the music bucket with public access
      const { error: createError } = await supabase.storage.createBucket('music', {
        public: true
      });

      if (createError) {
        console.error('Error creating music bucket:', createError.message);
      } else {
        console.log('Music storage bucket created successfully');
      }
    }

    // Check if releases table exists by making a simple query
    // If it fails, we'll try to create the table
    const { error: tableCheckError } = await supabase
      .from('releases')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code === '42P01') {
      console.error('Releases table does not exist. Please create it in the Supabase dashboard.');
      // We can't create tables via the JS client, so we'll display instructions
      showNotification('The releases table needs to be created in your Supabase project. Please check the console for instructions.', 'error', 8000);
      console.log('INSTRUCTIONS: Create a table named "releases" in your Supabase dashboard with columns matching the structure of the release object.');
    }
  } catch (err) {
    console.error('Storage initialization failed:', err);
  }
}

// Load pending releases for admin
async function loadPendingReleases() {
  // Get all releases from storage
  const allReleases = await getStoredReleases();

  // Filter to only pending releases
  const pendingReleases = allReleases.filter(release => release.status === 'pending');

  displayPendingReleases(pendingReleases);
}

// Show admin tab content
function showAdminTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.admin-tab-content').forEach(tab => {
    tab.style.display = 'none';
  });

  // Show selected tab
  document.getElementById(`${tabName}-tab`).style.display = 'block';

  // Load data for the selected tab
  if (tabName === 'pending') {
    loadPendingReleases();
  } else if (tabName === 'all') {
    loadAllReleases();
  }
}

// Load all releases for admin
async function loadAllReleases() {
  // Get all releases from storage
  const allReleases = await getStoredReleases();

  // Display in the table
  displayAllReleases(allReleases);
}

// Display all releases in a sortable table
function displayAllReleases(releases, sortField = null, sortDirection = null) {
  const tableBody = document.getElementById('allReleasesList');

  if (!releases || releases.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6">No releases found.</td></tr>`;
    return;
  }

  // Sort releases if sort parameters provided
  if (sortField && sortDirection) {
    releases.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Special handling for dates
      if (sortField === 'submittedAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      // String comparison
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }

  // Clear table
  tableBody.innerHTML = '';

  // Add rows
  releases.forEach(release => {
    // Format the date
    const submittedDate = new Date(release.submittedAt);
    const formattedDate = submittedDate.toLocaleDateString();

    // Create status class for color coding
    let statusClass = '';
    if (release.status === 'approved') {
      statusClass = 'color: #BFED46;';
    } else if (release.status === 'rejected') {
      statusClass = 'color: #FF6B6B;';
    } else if (release.status === 'deletion-requested') {
      statusClass = 'color: #FFA07A;';
    }

    // Format status text
    const statusText = release.status.charAt(0).toUpperCase() + release.status.slice(1).replace('-', ' ');

    // Create row HTML
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${release.artistName}</td>
      <td>${release.releaseTitle}</td>
      <td>${release.releaseType.charAt(0).toUpperCase() + release.releaseType.slice(1)}</td>
      <td>${formattedDate}</td>
      <td style="${statusClass}">${statusText}</td>
      <td>
        <input type="button" class="submit" value="View" onclick="showReleaseReview('${release.id}')" style="margin-right: 5px;">
        ${release.status === 'pending' ? `
          <input type="button" class="submit" value="Approve" onclick="approveRelease('${release.id}')" style="margin-right: 5px;">
          <input type="button" class="submit" value="Reject" onclick="rejectRelease('${release.id}')">
        ` : ''}
        ${release.status === 'deletion-requested' ? `
          <input type="button" class="submit" value="Delete" onclick="deleteRelease('${release.id}')">
        ` : ''}
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// Apply filters to pending releases list
async function applyPendingFilters() {
  const artistFilter = document.getElementById('pending-filter-artist').value.toLowerCase();
  const typeFilter = document.getElementById('pending-filter-type').value;

  // Get all releases
  const allReleases = await getStoredReleases();

  // Filter releases
  const filteredReleases = allReleases.filter(release => {
    // Status must be pending
    if (release.status !== 'pending') return false;

    // Check artist filter
    if (artistFilter && !release.artistName.toLowerCase().includes(artistFilter)) return false;

    // Check type filter
    if (typeFilter && release.releaseType !== typeFilter) return false;

    return true;
  });

  // Display filtered releases
  displayPendingReleases(filteredReleases);
}

// Reset pending releases filters
function resetPendingFilters() {
  document.getElementById('pending-filter-artist').value = '';
  document.getElementById('pending-filter-type').value = '';

  // Load all pending releases
  loadPendingReleases();
}

// Apply filters to all releases list
async function applyAllFilters() {
  const artistFilter = document.getElementById('all-filter-artist').value.toLowerCase();
  const statusFilter = document.getElementById('all-filter-status').value;
  const typeFilter = document.getElementById('all-filter-type').value;

  // Get current sort parameters from active sortable column
  const sortableColumns = document.querySelectorAll('#all-releases-table th.sortable');
  let sortField = null;
  let sortDirection = null;

  for (let col of sortableColumns) {
    if (col.classList.contains('asc')) {
      sortField = col.getAttribute('data-sort');
      sortDirection = 'asc';
      break;
    } else if (col.classList.contains('desc')) {
      sortField = col.getAttribute('data-sort');
      sortDirection = 'desc';
      break;
    }
  }

  // Get all releases
  const allReleases = await getStoredReleases();

  // Filter releases
  const filteredReleases = allReleases.filter(release => {
    // Check artist filter
    if (artistFilter && !release.artistName.toLowerCase().includes(artistFilter)) return false;

    // Check status filter
    if (statusFilter && release.status !== statusFilter) return false;

    // Check type filter
    if (typeFilter && release.releaseType !== typeFilter) return false;

    return true;
  });

  // Display filtered and sorted releases
  displayAllReleases(filteredReleases, sortField, sortDirection);
}

// Reset all releases filters
function resetAllFilters() {
  document.getElementById('all-filter-artist').value = '';
  document.getElementById('all-filter-status').value = '';
  document.getElementById('all-filter-type').value = '';

  // Load all releases
  loadAllReleases();
}

// Setup sortable columns
function setupSortableColumns() {
  const sortableColumns = document.querySelectorAll('#all-releases-table th.sortable');

  sortableColumns.forEach(column => {
    column.addEventListener('click', function() {
      const sortField = this.getAttribute('data-sort');
      let sortDirection = 'asc';

      // Toggle sort direction
      if (this.classList.contains('asc')) {
        this.classList.remove('asc');
        this.classList.add('desc');
        sortDirection = 'desc';
      } else if (this.classList.contains('desc')) {
        this.classList.remove('desc');
        sortDirection = null;
      } else {
        // Remove sort classes from all columns
        sortableColumns.forEach(col => {
          col.classList.remove('asc', 'desc');
        });
        this.classList.add('asc');
      }

      // Apply current filters with new sort
      applyAllFilters();
    });
  });
}

// Delete a release (for deletion requests)
async function deleteRelease(releaseId) {
  if (confirm('Are you sure you want to permanently delete this release?')) {
    // Delete from Supabase
    try {
      const { error } = await supabase
        .from('releases')
        .delete()
        .eq('id', releaseId);

      if (error) {
        console.error('Error deleting release from Supabase:', error.message);
        showNotification('Error deleting release from database.', 'error');
      } else {
        // Reload the current view
        const pendingTab = document.getElementById('pending-tab');
        if (pendingTab.style.display !== 'none') {
          loadPendingReleases();
        } else {
          loadAllReleases();
        }
        showNotification('Release has been permanently deleted.', 'success');
      }
    } catch (e) {
      console.error('Error deleting release:', e);
      showNotification('Error deleting release.', 'error');
    }
  }
}

// Display pending releases in admin dashboard
function displayPendingReleases(releases) {
  const pendingReleasesList = document.getElementById('pendingReleasesList');
  const noReleasesMessage = document.getElementById('noReleasesMessage');

  if (!releases || releases.length === 0) {
    noReleasesMessage.textContent = 'No pending releases found.';
    noReleasesMessage.style.display = 'block';
    pendingReleasesList.innerHTML = '';
    return;
  }

  noReleasesMessage.style.display = 'none';
  pendingReleasesList.innerHTML = '';

  releases.forEach(release => {
    const releaseItem = document.createElement('div');
    releaseItem.className = 'dispBoxLeft';
    releaseItem.style.background = '#5D5D5D';
    releaseItem.style.marginBottom = '10px';
    releaseItem.style.padding = '10px';

    // Format the date from ISO string to readable format
    const submittedDate = new Date(release.submittedAt);
    const formattedDate = submittedDate.toLocaleDateString() + ' ' + submittedDate.toLocaleTimeString();

    releaseItem.innerHTML = `
      <h4>${release.artistName} - ${release.releaseTitle}</h4>
      <p style="font-size: x-small;">Submitted by: ${release.submittedBy}</p>
      <p style="font-size: x-small;">Date: ${formattedDate}</p>
      <p style="font-size: x-small;">Type: ${release.releaseType}</p>
      <p style="font-size: x-small;">Tracks: ${release.tracks.length}</p>
      <div style="margin-top: 10px; text-align: right;">
        <input type="button" onclick="showReleaseReview('${release.id}')" class="submit" value="Review Release" style="margin-right: 5px;">
        <input type="button" onclick="approveRelease('${release.id}')" class="submit" value="Approve" style="margin-right: 5px;">
        <input type="button" onclick="rejectRelease('${release.id}')" class="submit" value="Reject">
      </div>
    `;

    pendingReleasesList.appendChild(releaseItem);
  });
}

// Current release ID being reviewed
let currentReviewReleaseId = null;

// Show detailed release review in modal, with download links for audio and artwork
async function showReleaseReview(release) {
    // If release is an ID, fetch the release data
    if (typeof release === 'string') {
        // Use the correct key for localStorage
        const releases = await getStoredReleases();
        release = releases.find(r => r.id === release);
        if (!release) {
            showNotification('Release not found', 'error');
            return;
        }
    }

    // Set current release ID for approve/reject functions
    currentReviewReleaseId = release.id;
    inReviewMode = true;

    // Modal overlay and content
    const overlay = document.getElementById('reviewModalOverlay');
    const reviewContent = document.getElementById('reviewContent');
    if (!overlay || !reviewContent) {
        showNotification('Modal not found in DOM.', 'error');
        return;
    }

    // Format the date from ISO string to readable format
    const submittedDate = new Date(release.submittedAt);
    const formattedDate = submittedDate.toLocaleDateString() + ' ' + submittedDate.toLocaleTimeString();

    // Build the content for the modal
    let content = `
        <h2>${release.artistName} - ${release.releaseTitle}</h2>
        <div style="margin: 20px 0;">
          <div style="float: left; margin-right: 20px; margin-bottom: 20px; border: 2px solid #484848; width: 200px; height: 200px; background: #333; display: flex; justify-content: center; align-items: center; overflow: hidden;">
            <img src="${release.artworkDataUrl}" style="max-width: 100%; max-height: 100%;" alt="Release Artwork">
          </div>
          <div style="margin-bottom: 10px;">
            <input type="button" class="submit" value="Download Artwork" onclick="downloadArtwork('${release.artworkDataUrl}', '${release.artistName}', '${release.releaseTitle}')">
          </div>
          <div style="overflow: hidden;">
            <table border="0" cellpadding="4" cellspacing="0" style="width: 100%;">
              <tr>
                <td style="width: 150px;"><b>Artist:</b></td>
                <td>${release.artistName}</td>
              </tr>
              <tr>
                <td><b>Submitted By:</b></td>
                <td>${release.submittedBy}</td>
              </tr>
              <tr>
                <td><b>Submission Date:</b></td>
                <td>${formattedDate}</td>
              </tr>
              <tr>
                <td><b>Release Type:</b></td>
                <td>${release.releaseType}</td>
              </tr>
              <tr>
                <td><b>Primary Genre:</b></td>
                <td>${release.primaryGenre}</td>
              </tr>
              <tr>
                <td><b>Secondary Genre:</b></td>
                <td>${release.secondaryGenre || 'None'}</td>
              </tr>
              <tr>
                <td><b>Explicit:</b></td>
                <td>${release.explicit === 'yes' ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <td><b>YouTube Content ID:</b></td>
                <td>${release.youtubeContentId === 'yes' ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <td><b>License:</b></td>
                <td>${release.license === 'arr' ? 'All Rights Reserved' : 'Creative Commons'}</td>
              </tr>
              <tr>
                <td><b>Release Date:</b></td>
                <td>${release.releaseDate}</td>
              </tr>
              ${release.ogReleaseDate ? `
              <tr>
                <td><b>Original Release:</b></td>
                <td>${release.ogReleaseDate}</td>
              </tr>
              ` : ''}
              ${release.upc ? `
              <tr>
                <td><b>UPC:</b></td>
                <td>${release.upc}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          <div style="clear: both;"></div>
        </div>
        <div style="margin: 20px 0;">
          <h3>Track Information</h3>
          <table border="0" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <tr style="background: #444;">
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #333;">Track</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #333;">Name</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #333;">ISRC</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #333;">Audio</th>
            </tr>
    `;

    // Add track information
    release.tracks.forEach((track, index) => {
      // Get the audioDataUrl if available
      const audioDataUrl = track.audioDataUrl || null;

      content += `
        <tr style="${index % 2 === 0 ? 'background: #555;' : 'background: #505050;'}">
          <td style="padding: 8px; border-bottom: 1px solid #333;">${track.position}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333;">${track.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333;">${track.isrc || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333;">
            ${track.fileName || 'No file info'}
            <br>
            <input type="button" class="submit" value="Download Audio" onclick="downloadAudioFile('${track.name}', '${release.artistName}', '${track.fileName || ''}', '${track.audioUrl || ''}', '${audioDataUrl || ''}')">
            ${track.audioUrl ? ' <small style="color: #BFED46;">Cloud</small>' : ''}
            ${audioDataUrl ? ' <small style="color: #BFED46;">Local</small>' : ''}
          </td>
        </tr>
      `;
    });

    content += `
        </table>
      </div>
    `;

    // Add additional information section
    content += `
      <div style="margin: 20px 0;">
        <h3>Additional Information</h3>

        ${release.featuredArtists ? `
        <div style="margin-bottom: 10px;">
          <strong>Featured Artists:</strong> ${release.featuredArtists}
        </div>
        ` : ''}

        ${release.primaryArtists ? `
        <div style="margin-bottom: 10px;">
          <strong>Primary Artists:</strong> ${release.primaryArtists}
        </div>
        ` : ''}

        ${release.credits ? `
        <div style="margin-bottom: 10px;">
          <strong>Credits:</strong><br>
          <div style="padding: 5px; background: #4A4A4A;">${release.credits.replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        ${release.notes ? `
        <div style="margin-bottom: 10px;">
          <strong>Additional Notes:</strong><br>
          <div style="padding: 5px; background: #4A4A4A;">${release.notes.replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
      </div>
    `;

    reviewContent.innerHTML = content;
    overlay.style.display = 'block';
}

// Close the review modal
function closeReviewModal() {
  document.getElementById('reviewModalOverlay').style.display = 'none';
  inReviewMode = false;
  currentReviewReleaseId = null;
}

// Approve release from modal
async function approveReleaseFromModal() {
  if (currentReviewReleaseId) {
    await approveRelease(currentReviewReleaseId);
    closeReviewModal();
  }
}

// Reject release from modal
async function rejectReleaseFromModal() {
  if (currentReviewReleaseId) {
    await rejectRelease(currentReviewReleaseId);
    closeReviewModal();
  }
}

// Load user's releases
async function loadUserReleases(userEmail) {
  // Get all releases from storage
  const allReleases = await getStoredReleases();

  // Filter to only this user's releases
  const userReleases = allReleases.filter(release => release.submittedBy === userEmail);

  displayUserReleases(userReleases, userEmail);
}

// Display user's releases
function displayUserReleases(releases, userEmail) {
  const userReleasesList = document.getElementById('userReleasesList');
  const userReleasesMessage = document.getElementById('userReleasesMessage');

  if (!releases || releases.length === 0) {
    userReleasesMessage.style.display = 'block';
    userReleasesMessage.textContent = 'No releases found.';
    userReleasesList.innerHTML = '';
    return;
  }

  userReleasesMessage.style.display = 'none';
  userReleasesList.innerHTML = '';

  releases.forEach(release => {
    const releaseItem = document.createElement('div');
    releaseItem.className = 'dispBoxLeft';
    releaseItem.style.background = '#5D5D5D';
    releaseItem.style.marginBottom = '10px';
    releaseItem.style.padding = '10px';

    // Format the date from ISO string to readable format
    const submittedDate = new Date(release.submittedAt);
    const formattedDate = submittedDate.toLocaleDateString() + ' ' + submittedDate.toLocaleTimeString();

    let statusClass = '';
    let statusText = release.status.charAt(0).toUpperCase() + release.status.slice(1);

    if (release.status === 'approved') {
      statusClass = 'color: #BFED46;';
    } else if (release.status === 'rejected') {
      statusClass = 'color: #FF6B6B;';
    }

    // Basic release info with artwork thumbnail
    let releaseHTML = `
      <div style="display: flex; margin-bottom: 10px;">
        <div style="width: 70px; height: 70px; margin-right: 15px; background: #444; border: 1px solid #333; display: flex; justify-content: center; align-items: center; overflow: hidden;">
          ${release.artworkDataUrl ?
            `<img src="${release.artworkDataUrl}" style="max-width: 100%; max-height: 100%;" alt="Release Artwork">` :
            '<span style="color: #777; font-size: x-small;">No Image</span>'}
        </div>
        <div style="flex: 1;">
          <h4 style="margin-top: 0;">${release.artistName} - ${release.releaseTitle}</h4>
          <p style="font-size: x-small;">Date: ${formattedDate}</p>
          <p style="font-size: x-small;">Type: ${release.releaseType}</p>
          <p style="font-size: x-small; ${statusClass}">Status: ${statusText}</p>
        </div>
      </div>
    `;

    // Add options for approved releases
    if (release.status === 'approved') {
      releaseHTML += `
        <div style="margin-top: 10px; text-align: right;">
          <input type="button" onclick="showEditForm('${release.id}')" class="submit" value="Edit" style="margin-right: 5px;">
          <input type="button" onclick="requestDeletion('${release.id}')" class="submit" value="Request Deletion">
        </div>
        <div id="editContainer-${release.id}" style="display:none; margin-top:10px;"></div>
      `;
    }

    releaseItem.innerHTML = releaseHTML;
    userReleasesList.appendChild(releaseItem);
  });
}

// Show edit form for an approved release
async function showEditForm(releaseId) {
  try {
    // Get release from Supabase
    const { data: releases, error } = await supabase
      .from('releases')
      .select('*')
      .eq('id', releaseId)
      .limit(1);

    if (error) {
      console.error('Error fetching release details:', error.message);
      showNotification('Failed to fetch release details.', 'error');
      return;
    }

    const release = releases[0];
    if (!release) {
      showNotification('Release not found.', 'error');
      return;
    }

    const editContainer = document.getElementById(`editContainer-${releaseId}`);
    if (!editContainer) {
      showNotification('Edit container not found.', 'error');
      return;
    }

    // Populate the form with release data
    editContainer.innerHTML = `
      <form id="editReleaseForm-${releaseId}" onsubmit="updateRelease(event, '${releaseId}')">
        <div class="form-group">
          <label for="editReleaseTitle-${releaseId}">Release Title:</label>
          <input type="text" id="editReleaseTitle-${releaseId}" value="${release.releaseTitle || ''}" class="newsletterInput" required>
        </div>
        <div class="form-group">
          <label for="editReleaseType-${releaseId}">Release Type:</label>
          <select id="editReleaseType-${releaseId}" class="newsletterInput" required style="background-color: #5D5D5D; color: #BFED46; width: 278px; appearance: menulist; -webkit-appearance: menulist;">
            <option value="single" ${release.releaseType === 'single' ? 'selected' : ''}>Single</option>
            <option value="ep" ${release.releaseType === 'ep' ? 'selected' : ''}>EP</option>
            <option value="album" ${release.releaseType === 'album' ? 'selected' : ''}>Album</option>
          </select>
        </div>
        <div id="editTracksSection-${releaseId}">
          <h3>Track Information</h3>
          <div id="editTracksList-${releaseId}"></div>
        </div>
        <div class="form-group">
          <label for="editNotes-${releaseId}">Additional Release Notes:</label>
          <textarea id="editNotes-${releaseId}" class="newsletterInput" style="height: 60px; width: 278px;">${release.notes || ''}</textarea>
        </div>
        <div style="margin-top: 15px; text-align: right;">
          <input type="button" onclick="cancelEdit('${releaseId}')" class="submit" value="Cancel" style="margin-right: 5px;">
          <input type="submit" value="Save Changes" class="submit">
        </div>
      </form>
    `;

    // Add tracks dynamically after the form is in the DOM
    const editTracksList = document.getElementById(`editTracksList-${releaseId}`);
    release.tracks.forEach((track, index) => {
      const trackDiv = document.createElement('div');
      trackDiv.className = 'track-item';
      trackDiv.style = "border-bottom: 1px solid #484848; margin-bottom: 10px; padding-bottom: 10px;";
      trackDiv.innerHTML = `
        <p style="margin-bottom: 5px;">Track ${index + 1} Name*</p>
        <input type="text" id="edit-track-name-${releaseId}-${index}" class="newsletterInput" value="${track.name}" required>
      `;
      editTracksList.appendChild(trackDiv);
    });

    editContainer.style.display = 'block';
  } catch (e) {
    console.error('Error displaying edit form:', e);
    showNotification('An error occurred while trying to edit the release.', 'error');
  }
}

// Update release with edited information
async function updateRelease(event, releaseId) {
  event.preventDefault();

  try {
    // Get current release from Supabase
    const { data: releases, error: fetchError } = await supabase
      .from('releases')
      .select('*')
      .eq('id', releaseId)
      .limit(1);

    if (fetchError || !releases || releases.length === 0) {
      console.error('Error fetching release:', fetchError?.message);
      showNotification('Release not found.', 'error');
      return;
    }

    const release = releases[0];

    // Update the editable fields
    const updatedRelease = { ...release };
    updatedRelease.releaseTitle = document.getElementById(`editReleaseTitle-${releaseId}`).value;
    updatedRelease.releaseType = document.getElementById(`editReleaseType-${releaseId}`).value;
    updatedRelease.notes = document.getElementById(`editNotes-${releaseId}`).value;

    // Update track names
    updatedRelease.tracks = updatedRelease.tracks.map((track, index) => {
      return {
        ...track,
        name: document.getElementById(`edit-track-name-${releaseId}-${index}`).value
      };
    });

    // Save the changes to Supabase
    const { error: updateError } = await supabase
      .from('releases')
      .update(updatedRelease)
      .eq('id', releaseId);

    if (updateError) {
      console.error('Error updating release:', updateError.message);
      showNotification('Failed to update release.', 'error');
      return;
    }

    // Hide the edit form
    const editContainer = document.getElementById(`editContainer-${releaseId}`);
    if (editContainer) {
      editContainer.style.display = 'none';
    }

    // Reload the user's releases
    const userEmail = updatedRelease.submittedBy;
    await loadUserReleases(userEmail);

    showNotification('Release has been updated.', 'success');
  } catch (e) {
    console.error('Error updating release:', e);
    showNotification('An error occurred while updating the release.', 'error');
  }
}

// Cancel edit and reload user releases
async function cancelEdit(releaseId) {
  try {
    // Get the release to find the submitter email
    const { data: releases, error } = await supabase
      .from('releases')
      .select('submittedBy')
      .eq('id', releaseId)
      .limit(1);

    if (!error && releases.length > 0) {
      await loadUserReleases(releases[0].submittedBy);
    }

    // Hide the edit form
    const editContainer = document.getElementById(`editContainer-${releaseId}`);
    if (editContainer) {
      editContainer.style.display = 'none';
    }
  } catch (e) {
    console.error('Error canceling edit:', e);

    // Safely hide the form regardless of errors
    const editContainer = document.getElementById(`editContainer-${releaseId}`);
    if (editContainer) {
      editContainer.style.display = 'none';
    }
  }
}

// Request release deletion
async function requestDeletion(releaseId) {
  if (confirm('Are you sure you want to request deletion of this release?')) {
    // Update status in Supabase
    const success = await updateReleaseStatus(releaseId, 'deletion-requested');
    if (success) {
      // Reload user's releases
      const user = await supabase.auth.getUser();
      loadUserReleases(user.data.user.email);
      showNotification('Deletion request has been submitted.', 'success');
    } else {
      showNotification('Failed to request deletion.', 'error');
    }
  }
}

// Handle page load
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  checkSession();

  // Setup form placeholders
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Clear placeholders on focus if they contain default values
  emailInput.addEventListener('focus', function() {
    if (this.value === 'Email Address') this.value = '';
  });

  passwordInput.addEventListener('focus', function() {
    if (this.value === 'Password') this.value = '';
  });

  // Restore placeholders on blur if empty
  emailInput.addEventListener('blur', function() {
    if (this.value === '') this.value = 'Email Address';
  });

  passwordInput.addEventListener('blur', function() {
    if (this.value === '') this.value = 'Password';
  });

  // Add ESC key listener for closing review modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && inReviewMode) {
      closeReviewModal();
    }
  });

  // Initialize Supabase storage bucket if needed
  initializeStorage();
});

// Check if user is already logged in
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Check if user is admin or artist
    const isAdmin = session.user.email.toLowerCase() === '1@elujj.in';

    // User is logged in, redirect to dashboard content or show logged-in state
    showLoggedInState(session.user, isAdmin);
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Display loading state
  const authMessage = document.getElementById('authMessage');
  authMessage.className = 'info';
  authMessage.innerHTML = 'Processing...';

  try {
    // Handle login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    // Login successful
    authMessage.className = 'success';
    authMessage.innerHTML = 'Login successful!';

    // Check if user is admin or artist
    const isAdmin = email.toLowerCase() === '1@elujj.in';

    // Show appropriate dashboard based on user type
    showLoggedInState(data.user, isAdmin);
  } catch (error) {
    authMessage.className = 'error';
    authMessage.innerHTML = `Error: ${error.message}`;
  }
}

// Update the payouts section to remove "Last Month Earnings"
const updatedRevenueSummary = `
<div style="background: #5D5D5D; border: 5px solid #484848; padding: 15px; margin-bottom: 20px;">
  <h3 class="pCase" style="margin-top: 0; margin-bottom: 15px;">Revenue Summary</h3>
  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
    <div>
      <p style="margin: 0; font-size: small; color: #BFED46;">Current Balance</p>
      <p style="margin: 5px 0 0 0; font-size: x-large; font-weight: bold;">$0.00</p>
    </div>
    <div>
      <p style="margin: 0; font-size: small; color: #BFED46;">Total Earnings</p>
      <p style="margin: 5px 0 0 0; font-size: x-large; font-weight: bold;">$0.00</p>
    </div>
  </div>
  <div style="text-align: right; margin-top: 10px;">
    <input type="button" value="Request Payout" class="submit">
  </div>
</div>
`;

// Two-Factor Authentication HTML section (modified to show "Coming Soon")
const twoFactorAuthHTML = `
  <div style="background: #484848; border: 1px solid #666; padding: 15px; margin-bottom: 20px;">
    <h3 class="pCase" style="margin-top: 0;">Two-Factor Authentication</h3>
    <div id="twoFactorAuth">
      <p style="margin-bottom: 10px;">Enhance your account security by enabling two-factor authentication.</p>
      <div style="background: #5D5D5D; padding: 10px; margin: 10px 0; border: 1px solid #666;">
        <p style="color: #BFED46;">Coming Soon</p>
        <p style="margin-top: 5px;">Two-factor authentication is currently under development and will be available soon.</p>
      </div>
    </div>
  </div>
`;

// Show the logged in state
function showLoggedInState(user, isAdmin) {
  // Profile Information HTML (artist bio removed)
  const profileSectionHTML = `
    <div style="background: #484848; border: 1px solid #666; padding: 15px; margin-bottom: 20px; display: flex; align-items: flex-start;">
      <div style="flex: 0 0 120px; margin-right: 20px;">
        <div id="profileImageContainer" style="width: 120px; height: 120px; background: #333; border: 1px solid #555; overflow: hidden; position: relative;">
          <img id="profileImage" src="asset/image/default-profile.png" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">
          <div id="profileImageOverlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; text-align: center; padding: 4px; cursor: pointer; font-size: 10px;">
            Change Photo
          </div>
        </div>
        <input type="file" id="profileImageUpload" style="display: none;" accept="image/*">
      </div>
      <div style="flex: 1;">
        <h3 class="pCase" style="margin-top: 0;">Profile Information</h3>
        <div style="margin-bottom: 10px;">
          <p class="pCase">Artist Name</p>
          <input type="text" id="artistNameInput" class="newsletterInput">
        </div>
        <div style="text-align: right; margin-top: 10px;">
          <input type="button" value="Update Profile" class="submit" onclick="updateProfile()">
        </div>
      </div>
    </div>
  `;

  // Insert profileSectionHTML and twoFactorAuthHTML into the DOM as needed
  // For demonstration, let's assume there's a container with id 'accountTabContent'
  const accountTabContent = document.getElementById('accountTabContent');
  if (accountTabContent) {
    accountTabContent.innerHTML = profileSectionHTML + twoFactorAuthHTML;
  }

  // Setup account tab (artist bio removed)
  setupAccountTab(user);
}

// Update profile info (artist bio removed)
async function updateProfile() {
  const artistName = document.getElementById('artistNameInput').value;
  const userEmail = document.getElementById('userEmail').textContent;

  try {
    // Save to Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        artist_name: artistName,
        updated_at: new Date().toISOString()
      })
      .eq('user_email', userEmail);

    if (error) {
      throw error;
    }

    // Also save to localStorage as backup
    localStorage.setItem('artistProfile_' + userEmail, JSON.stringify({
      artistName
    }));

    showNotification('Profile updated successfully!', 'success');
  } catch (e) {
    console.error('Error updating profile:', e);

    // Fall back to localStorage only
    localStorage.setItem('artistProfile_' + userEmail, JSON.stringify({
      artistName
    }));

    showNotification('Profile updated locally. Server update failed.', 'warning');
  }
}

// Setup account tab (artist bio removed)
function setupAccountTab(user) {
  // Load profile info from Supabase
  const artistNameInput = document.getElementById('artistNameInput');
  const profileImage = document.getElementById('profileImage');

  try {
    // Get profile from Supabase
    supabase
      .from('profiles')
      .select('*')
      .eq('user_email', user.email)
      .limit(1)
      .then(({ data: profiles, error }) => {
        if (error) {
          throw error;
        }

        if (profiles && profiles.length > 0) {
          const profile = profiles[0];

          // Fill form fields
          if (artistNameInput) artistNameInput.value = profile.artist_name || '';

          // Set profile image if available
          if (profile.profile_image_url && profileImage) {
            profileImage.src = profile.profile_image_url;
          }

          // 2FA section is now always "Coming Soon"
        } else {
          // Fall back to localStorage if no profile in database
          const localProfile = JSON.parse(localStorage.getItem('artistProfile_' + user.email) || '{}');
          if (artistNameInput) artistNameInput.value = localProfile.artistName || '';
        }
      })
      .catch(e => {
        console.error('Error loading profile:', e);

        // Fall back to localStorage
        const localProfile = JSON.parse(localStorage.getItem('artistProfile_' + user.email) || '{}');
        if (artistNameInput) artistNameInput.value = localProfile.artistName || '';
      });
  } catch (e) {
    console.error('Error loading profile:', e);

    // Fall back to localStorage
    const localProfile = JSON.parse(localStorage.getItem('artistProfile_' + user.email) || '{}');
    if (artistNameInput) artistNameInput.value = localProfile.artistName || '';
  }
}

// Two-Factor Authentication section (temporarily disabled)
function setupTwoFactor() {
  showNotification('Two-factor authentication is currently under development.', 'info');
}

async function enableTwoFactor() {
  showNotification('Two-factor authentication is currently under development.', 'info');
}

async function disableTwoFactor() {
  showNotification('Two-factor authentication is currently under development.', 'info');
}

// Helper function to get file extension
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

// Change password functionality
async function changePassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotification('Please fill in all password fields.', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showNotification('New password must be at least 6 characters long.', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showNotification('New passwords do not match.', 'error');
    return;
  }

  // Button state
  const updateBtn = document.querySelector('#changePasswordForm input[type="button"]');
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.value = 'Updating...';
  }

  try {
    // Get current user
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data || !data.user) {
      showNotification('Could not get user session. Please log in again.', 'error');
      console.log("User session error:", userError);
      return;
    }

    const user = data.user;
    console.log("Got user session for:", user.email);

    // Re-authenticate user with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      showNotification('Current password is incorrect.', 'error');
      console.log("Sign in error:", signInError);
      return;
    }

    console.log("Re-authentication successful");

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      showNotification('Failed to update password: ' + updateError.message, 'error');
      console.log("Update error:", updateError);
      return;
    }

    console.log("Password update successful");
    showNotification('Password updated successfully!', 'success');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch (e) {
    showNotification('An error occurred while updating password.', 'error');
    console.error("Password update exception:", e);
  } finally {
    // Reset button state
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.value = 'Update Password';
    }
  }
}

// Email change
async function changeEmail() {
  const newEmail = document.getElementById('newEmail').value;
  const password = document.getElementById('emailChangePassword').value;
  const currentEmail = document.getElementById('currentEmail').textContent;

  if (!newEmail || !password) {
    showNotification('Please fill in all fields.', 'error');
    return;
  }
  if (newEmail === currentEmail) {
    showNotification('New email must be different.', 'error');
    return;
  }

  // Button state
  const updateBtn = document.querySelector('#changeEmailForm input[type="button"]');
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.value = 'Updating...';
  }

  try {
    // Re-authenticate
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: password
    });

    if (signInError) {
      showNotification('Current password is incorrect.', 'error');
      console.log("Sign in error:", signInError);
      return;
    }

    console.log("Re-authentication successful");

    // Update email
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (updateError) {
      showNotification('Failed to update email: ' + updateError.message, 'error');
      console.log("Update error:", updateError);
      return;
    }

    console.log("Email update request sent");
    showNotification('Email update requested. Please check your new email for a confirmation link.', 'success');
    document.getElementById('newEmail').value = '';
    document.getElementById('emailChangePassword').value = '';
  } catch (e) {
    showNotification('An error occurred while updating email.', 'error');
    console.error("Email update exception:", e);
  } finally {
    // Reset button state
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.value = 'Update Email';
    }
  }
}
