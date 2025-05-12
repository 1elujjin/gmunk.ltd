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

// Helper to get file extension
function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop() : 'mp3';
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

// Show the logged in state
function showLoggedInState(user, isAdmin) {
  const leftColumn = document.getElementById('leftColumn');

  if (isAdmin) {
    // Admin dashboard
    leftColumn.innerHTML = `
      <h1>Admin Dashboard</h1>
      <p>Welcome back, ${user.email}</p>

      <div id="admin-tabs" style="margin: 20px 0;">
        <input type="button" value="Pending Approvals" onclick="showAdminTab('pending')" class="submit" style="margin-right: 10px;">
        <input type="button" value="All Releases" onclick="showAdminTab('all')" class="submit">
      </div>

      <div id="pending-tab" class="admin-tab-content active">
        <div class="dispBoxLeft">
          <h3>Pending Approvals</h3>

          <div class="admin-filters">
            <div class="filter-group">
              <label for="pending-filter-artist">Artist:</label>
              <input type="text" id="pending-filter-artist" placeholder="Filter by artist">
            </div>
            <div class="filter-group">
              <label for="pending-filter-type">Type:</label>
              <select id="pending-filter-type">
                <option value="">All Types</option>
                <option value="single">Single</option>
                <option value="ep">EP</option>
                <option value="album">Album</option>
              </select>
            </div>
            <div class="filter-actions">
              <input type="button" value="Apply Filters" onclick="applyPendingFilters()" class="submit">
              <input type="button" value="Reset" onclick="resetPendingFilters()" class="submit" style="margin-left: 5px;">
            </div>
          </div>

          <div id="pendingReleases">
            <p id="noReleasesMessage">No pending releases found.</p>
            <div id="pendingReleasesList"></div>
          </div>
        </div>
      </div>

      <div id="all-tab" class="admin-tab-content" style="display: none;">
        <div class="dispBoxLeft">
          <h3>All Releases</h3>

          <div class="admin-filters">
            <div class="filter-group">
              <label for="all-filter-artist">Artist:</label>
              <input type="text" id="all-filter-artist" placeholder="Filter by artist">
            </div>
            <div class="filter-group">
              <label for="all-filter-status">Status:</label>
              <select id="all-filter-status">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="deletion-requested">Deletion Requested</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="all-filter-type">Type:</label>
              <select id="all-filter-type">
                <option value="">All Types</option>
                <option value="single">Single</option>
                <option value="ep">EP</option>
                <option value="album">Album</option>
              </select>
            </div>
            <div class="filter-actions">
              <input type="button" value="Apply Filters" onclick="applyAllFilters()" class="submit">
              <input type="button" value="Reset" onclick="resetAllFilters()" class="submit" style="margin-left: 5px;">
            </div>
          </div>

          <table id="all-releases-table" class="data-table">
            <thead>
              <tr>
                <th class="sortable" data-sort="artistName">Artist</th>
                <th class="sortable" data-sort="releaseTitle">Title</th>
                <th class="sortable" data-sort="releaseType">Type</th>
                <th class="sortable" data-sort="submittedAt">Date</th>
                <th class="sortable" data-sort="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="allReleasesList">
              <!-- All releases will be displayed here -->
            </tbody>
          </table>
        </div>
      </div>

      <div style="text-align: right; margin-top: 10px;">
        <input type="button" onclick="handleLogout()" class="submit" value="Logout">
      </div>

      <!-- Review Modal Container -->
      <div id="reviewModalOverlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 999; overflow-y: auto;">
        <div id="reviewModal" style="position: relative; width: 80%; max-width: 800px; margin: 30px auto; background: #5D5D5D; border: 5px solid #484848; padding: 20px; color: #EEEEEE;">
          <div style="position: absolute; top: 10px; right: 10px;">
            <input type="button" value="✕" onclick="closeReviewModal()" class="submit" style="padding: 5px 10px; font-size: 16px;">
          </div>
          <div id="reviewContent"></div>
          <div style="margin-top: 20px; text-align: right;">
            <input type="button" id="rejectBtn" value="Reject" onclick="rejectReleaseFromModal()" class="submit" style="margin-right: 10px;">
            <input type="button" id="approveBtn" value="Approve" onclick="approveReleaseFromModal()" class="submit">
          </div>
        </div>
      </div>
    `;

    // Load pending releases when admin dashboard is shown
    loadPendingReleases();

    // Add event listeners for sorting
    setupSortableColumns();
  } else {
    // Artist dashboard with new sidebar layout
    leftColumn.innerHTML = `
      <h1>Artist Dashboard</h1>
      <p>Welcome back, ${user.email}</p>

      <div style="display: flex; margin-top: 20px;">
        <!-- Left sidebar -->
        <div class="dispBoxLeft" style="width: 200px; margin-right: 20px; padding: 15px; background: #5D5D5D; border: 5px solid #484848;">
          <div id="dashboard-nav">
            <h3 class="pCase" style="margin-top: 0; margin-bottom: 15px;">Dashboard Menu</h3>
            <dl style="margin: 0;">
              <dd style="margin: 0 0 10px 0;"><a href="#" onclick="showTab('upload'); return false;" class="tab-btn active">Upload Music</a></dd>
              <dd style="margin: 0 0 10px 0;"><a href="#" onclick="showTab('releases'); return false;" class="tab-btn">Your Releases</a></dd>
              <dd style="margin: 0 0 10px 0;"><a href="#" onclick="showTab('tickets'); return false;" class="tab-btn">Support Tickets</a></dd>
              <dd style="margin: 0 0 10px 0;"><a href="#" onclick="showTab('payouts'); return false;" class="tab-btn">Payouts & Finance</a></dd>
              <dd style="margin: 0 0 10px 0;"><a href="#" onclick="showTab('account'); return false;" class="tab-btn">Account Settings</a></dd>
            </dl>
          </div>

          <div style="margin-top: 20px;">
            <p class="pCase" style="font-size: x-small; color: #BFED46; margin-bottom: 5px;">Account</p>
            <input type="button" onclick="handleLogout()" class="submit" value="Logout" style="width: 100%;">
          </div>
        </div>

        <!-- Main content area -->
        <div class="dispBoxRight" style="flex: 1;">
          <div id="upload-tab" class="tab-content active">
            <h2 class="pCase" style="margin-top: 0;">Upload New Release</h2>
            <form id="uploadForm" onsubmit="handleUpload(event)">
              <!-- form fields here -->
            </form>
          </div>

          <div id="releases-tab" class="tab-content" style="display: none;">
            <h2 class="pCase" style="margin-top: 0;">Your Releases</h2>
            <div class="dispBoxLeft" id="userReleases" style="border: none; padding: 0;">
              <p id="userReleasesMessage">No releases found.</p>
              <div id="userReleasesList"></div>
            </div>
          </div>

          <div id="tickets-tab" class="tab-content" style="display: none;">
            <h2 class="pCase" style="margin-top: 0;">Support Tickets</h2>
            <div class="dispBoxLeft" style="border: none; padding: 0;">
              <div style="margin-bottom: 20px;">
                <input type="button" value="Create New Ticket" class="submit" onclick="showNewTicketForm()">
              </div>

              <div id="noTicketsMessage" style="display: block;">
                <p>You don't have any support tickets yet.</p>
              </div>

              <div id="ticketList" style="display: none;">
                <!-- Ticket list will go here -->
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #444;">
                      <th style="text-align: left; padding: 8px; border-bottom: 1px solid #333;">ID</th>
                      <th style="text-align: left; padding: 8px; border-bottom: 1px solid #333;">Subject</th>
                      <th style="text-align: left; padding: 8px; border-bottom: 1px solid #333;">Status</th>
                      <th style="text-align: left; padding: 8px; border-bottom: 1px solid #333;">Date</th>
                      <th style="text-align: left; padding: 8px; border-bottom: 1px solid #333;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Ticket rows would be added dynamically -->
                  </tbody>
                </table>
              </div>

              <div id="newTicketForm" style="display: none; margin-top: 20px;">
                <h3 class="pCase">Create New Support Ticket</h3>
                <div style="margin-bottom: 10px;">
                  <p class="pCase">Subject*</p>
                  <input type="text" id="ticketSubject" class="newsletterInput" required>
                </div>
                <div style="margin-bottom: 10px;">
                  <p class="pCase">Category*</p>
                  <select id="ticketCategory" class="newsletterInput" required>
                    <option value="">Select Category</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="release">Release Problem</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style="margin-bottom: 10px;">
                  <p class="pCase">Description*</p>
                  <textarea id="ticketDescription" class="newsletterInput" rows="5" required></textarea>
                </div>
                <div style="text-align: right;">
                  <input type="button" value="Cancel" class="submit" onclick="hideNewTicketForm()" style="margin-right: 5px;">
                  <input type="button" value="Submit Ticket" class="submit" onclick="submitTicket()">
                </div>
              </div>
            </div>
          </div>

          <div id="payouts-tab" class="tab-content" style="display: none;">
            <h2 class="pCase" style="margin-top: 0;">Payouts & Finance</h2>
            <div class="dispBoxLeft" style="border: none; padding: 0;">
              <div style="background: #5D5D5D; border: 5px solid #484848; padding: 15px; margin-bottom: 20px;">
                <h3 class="pCase" style="margin-top: 0;">Revenue Summary</h3>
                <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                  <div style="text-align: center; flex: 1;">
                    <p style="font-size: 12px; color: #BFED46;">Current Balance</p>
                    <p style="font-size: 18px; margin-top: 5px;">$0.00</p>
                  </div>
                  <div style="text-align: center; flex: 1;">
                    <p style="font-size: 12px; color: #BFED46;">Total Earnings</p>
                    <p style="font-size: 18px; margin-top: 5px;">$0.00</p>
                  </div>
                  <div style="text-align: center; flex: 1;">
                    <p style="font-size: 12px; color: #BFED46;">Next Payout</p>
                    <p style="font-size: 18px; margin-top: 5px;">--</p>
                  </div>
                </div>
              </div>

              <!-- Payout history section -->
              <h3 class="pCase">Payout History</h3>
              <p>No payout history available yet.</p>

              <!-- Payout method section -->
              <h3 class="pCase" style="margin-top: 20px;">Payout Methods</h3>
              <div style="background: #5D5D5D; border: 5px solid #484848; padding: 15px; margin-top: 10px;">
                <p>No payout methods configured.</p>
                <input type="button" value="Add Payout Method" class="submit" style="margin-top: 10px;">
              </div>
            </div>
          </div>

          <div id="account-tab" class="tab-content" style="display: none;">
            <h2 class="pCase" style="margin-top: 0;">Account Settings</h2>
            <div class="dispBoxLeft" style="border: none; padding: 0;">
              <!-- Email Change Section -->
              <div style="background: #484848; border: 1px solid #666; padding: 15px; margin-bottom: 20px;">
                <h3 class="pCase" style="margin-top: 0;">Change Email</h3>
                <div id="changeEmailForm">
                  <div style="margin-bottom: 10px;">
                    <p class="pCase">Current Email</p>
                    <p id="currentEmail" style="padding: 5px 0; color: #BFED46;"></p>
                  </div>
                  <div style="margin-bottom: 10px;">
                    <p class="pCase">New Email*</p>
                    <input type="email" id="newEmail" class="newsletterInput" required>
                  </div>
                  <div style="margin-bottom: 10px;">
                    <p class="pCase">Current Password (for verification)*</p>
                    <input type="password" id="emailChangePassword" class="newsletterInput" required>
                  </div>
                  <div style="text-align: right; margin-top: 15px;">
                    <input type="button" value="Update Email" class="submit" onclick="changeEmail()">
                  </div>
                </div>
              </div>

              <!-- Password Change Section -->
              <div style="background: #484848; border: 1px solid #666; padding: 15px; margin-bottom: 20px;">
                <h3 class="pCase" style="margin-top: 0;">Change Password</h3>
                <div id="changePasswordForm">
                  <div style="margin-bottom: 10px;">
                    <p class="pCase">Current Password*</p>
                    <input type="password" id="currentPassword" class="newsletterInput" required>
                  </div>
                  <div style="margin-bottom: 10px;">
                    <p class="pCase">New Password*</p>
                    <input type="password" id="newPassword" class="newsletterInput" required>
                    <p style="font-size: x-small; margin-top: 3px; color: #999;">Must be at least 6 characters long</p>
                  </div>
                  <div style="margin-bottom: 10px;">
                    <p class="pCase">Confirm New Password*</p>
                    <input type="password" id="confirmPassword" class="newsletterInput" required>
                  </div>
                  <div style="text-align: right; margin-top: 15px;">
                    <input type="button" value="Update Password" class="submit" onclick="changePassword()">
                  </div>
                </div>
              </div>

              <!-- Account Information -->
              <div style="background: #484848; border: 1px solid #666; padding: 15px;">
                <h3 class="pCase" style="margin-top: 0;">Account Information</h3>
                <div id="accountInfo">
                  <p><strong>Email:</strong> <span id="userEmail"></span></p>
                  <p><strong>Account Type:</strong> <span id="accountType"></span></p>
                  <p><strong>Registered:</strong> <span id="registrationDate"></span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Set up upload form
    setupUploadForm();

    // Load user's releases
    loadUserReleases(user.email);

    // Populate account info in Account Settings tab immediately
    // Make sure to set these values when showing the logged in state
    try {
      const userEmailElements = document.querySelectorAll('#userEmail, #currentEmail');
      userEmailElements.forEach(elem => {
        if (elem) elem.textContent = user.email || 'Not available';
      });

      const accountTypeElem = document.getElementById('accountType');
      if (accountTypeElem) accountTypeElem.textContent = 'Artist';

      const registrationDateElem = document.getElementById('registrationDate');
      if (registrationDateElem) {
        registrationDateElem.textContent = user.created_at
          ? new Date(user.created_at).toLocaleDateString()
          : 'Unknown';
      }

      console.log('User account info populated for:', user.email);
    } catch (err) {
      console.error('Error populating user info:', err);
    }
  }
}

// Function to show tab content in artist dashboard
function showTab(tabName) {
  // Update tab buttons
  const tabs = document.querySelectorAll('#dashboard-nav dd a');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });

  // Add active class to the clicked tab
  const activeTab = document.querySelector(`#dashboard-nav dd a[onclick*="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });

  // Show the selected tab content
  const tabContent = document.getElementById(`${tabName}-tab`);
  if (tabContent) {
    tabContent.style.display = 'block';

    // If it's the upload tab, make sure we have the upload form
    if (tabName === 'upload') {
      setupUploadForm();
    }
  }
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
  const currentEmailElement = document.getElementById('currentEmail');
  const currentEmail = currentEmailElement ? currentEmailElement.textContent : '';

  console.log('Current email from element:', currentEmail);

  if (!currentEmail) {
    showNotification('Unable to determine your current email. Please try logging in again.', 'error');
    return;
  }

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
  // Set up track file inputs
  // setupTrackFileUploads();
}

// Setup track file uploads with styled buttons using submit buttons
function setupTrackFileUploads() {
  const trackFileInputs = document.querySelectorAll('.track-file');
  trackFileInputs.forEach((input) => {
    // Create a container for the file name if it doesn't exist
    let fileNameSpan = input.nextElementSibling;
    if (!fileNameSpan || !fileNameSpan.classList.contains('track-file-name')) {
      fileNameSpan = document.createElement('span');
      fileNameSpan.className = 'track-file-name';
      fileNameSpan.style.marginLeft = '10px';
      fileNameSpan.style.fontSize = 'x-small';
      fileNameSpan.style.fontWeight = 'normal';
      fileNameSpan.textContent = 'No file selected';
      input.parentNode.insertBefore(fileNameSpan, input.nextSibling);
    }

    // Make sure the input has a unique ID
    if (!input.id || input.id === 'audio-file-template') {
      const trackItem = input.closest('.track-item');
      if (trackItem) {
        const trackId = trackItem.id.split('-').pop();
        input.id = `audio-file-${trackId}`;
      }
    }

    // Handle file selection
    input.addEventListener('change', function(e) {
      // Find the closest track-file-name span to this input
      const nameSpan = this.parentNode.querySelector('.track-file-name');
      if (this.files.length > 0 && nameSpan) {
        nameSpan.textContent = this.files[0].name;
      } else if (nameSpan) {
        nameSpan.textContent = 'No file selected';
      }
    });
  });
}

// Validate artwork dimensions
function validateArtwork(input) {
  const file = input.files[0];
  const errorDiv = document.getElementById('artworkError');
  const preview = document.getElementById('artworkPreviewImg');

  // Reset error state
  errorDiv.style.display = 'none';
  input.setCustomValidity('');

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // Check if image is square and at least 1500x1500
        if (img.width !== img.height || img.width < 1500) {
          errorDiv.style.display = 'block';
          input.setCustomValidity('Artwork must be square and at least 1500x1500 pixels.');
        } else {
          // Valid image
          errorDiv.style.display = 'none';
          input.setCustomValidity('');
        }

        // Show the preview regardless of validation
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Setup the upload form with proper fields
function setupUploadForm() {
  const uploadTab = document.getElementById('upload-tab');
  if (!uploadTab) return;

  // Set up the upload form regardless of current content
  // Previous check was causing issues
  const uploadForm = uploadTab.querySelector('form');
  if (!uploadForm) {
    console.error('Upload form not found');
    return;
  }

  // Set up the upload form with all required fields
  uploadForm.innerHTML = `
    <div class="dispBoxLeft">
      <p class="pCase" style="font-size: x-small; color: #BFED46;">Release Information</p>
      <div class="form-row">
        <div style="margin-bottom: 10px;">
          <p class="pCase">Artist Name*</p>
          <input type="text" id="artistName" name="artistName" class="newsletterInput" required style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;">
        </div>
        <div style="margin-bottom: 10px;">
          <p class="pCase">Release Title*</p>
          <input type="text" id="releaseTitle" name="releaseTitle" class="newsletterInput" required style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;">
        </div>
      </div>
      <div class="form-row">
        <div style="margin-bottom: 10px;">
          <p class="pCase">Release Type*</p>
          <select id="releaseType" name="releaseType" class="newsletterInput" required onchange="toggleTracksSection()" style="width: 278px; background: url('../../image/inputTextBg.gif') top left repeat-x; color: #FFFFFF; height: 22px; font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif;">
            <option value="">Select Type</option>
            <option value="single">Single</option>
            <option value="ep">EP</option>
            <option value="album">Album</option>
          </select>
        </div>
        <div style="margin-bottom: 10px;">
          <p class="pCase">Release Date*</p>
          <input type="date" id="releaseDate" name="releaseDate" class="newsletterInput" required style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;">
        </div>
      </div>
      <div class="form-row">
        <div style="margin-bottom: 10px;">
          <p class="pCase">Primary Genre*</p>
          <select id="primaryGenre" name="primaryGenre" class="newsletterInput" required style="width: 278px; background: url('../../image/inputTextBg.gif') top left repeat-x; color: #FFFFFF; height: 22px; font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif;">
            <option value="">Select Genre</option>
            <option value="electronic">Electronic</option>
            <option value="rock">Rock</option>
            <option value="pop">Pop</option>
            <option value="rap">Rap/Hip-Hop</option>
            <option value="rnb">R&B</option>
            <option value="jazz">Jazz</option>
            <option value="classical">Classical</option>
            <option value="country">Country</option>
            <option value="folk">Folk</option>
            <option value="latin">Latin</option>
            <option value="world">World</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style="margin-bottom: 10px;">
          <p class="pCase">Secondary Genre (Optional)</p>
          <select id="secondaryGenre" name="secondaryGenre" class="newsletterInput" style="width: 278px; background: url('../../image/inputTextBg.gif') top left repeat-x; color: #FFFFFF; height: 22px; font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif;">
            <option value="">Select Genre (Optional)</option>
            <option value="electronic">Electronic</option>
            <option value="rock">Rock</option>
            <option value="pop">Pop</option>
            <option value="rap">Rap/Hip-Hop</option>
            <option value="rnb">R&B</option>
            <option value="jazz">Jazz</option>
            <option value="classical">Classical</option>
            <option value="country">Country</option>
            <option value="folk">Folk</option>
            <option value="latin">Latin</option>
            <option value="world">World</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div style="margin-bottom: 10px;">
          <p class="pCase">Explicit Content*</p>
          <div style="display: flex; gap: 20px; margin-top: 5px;">
            <label style="display: flex; align-items: center; gap: 5px; color: #EEEEEE; font-size: x-small; font-weight: normal;">
              <input type="radio" name="explicit" value="no" checked> No
            </label>
            <label style="display: flex; align-items: center; gap: 5px; color: #EEEEEE; font-size: x-small; font-weight: normal;">
              <input type="radio" name="explicit" value="yes"> Yes
            </label>
          </div>
        </div>
        <div style="margin-bottom: 10px;">
          <p class="pCase">YouTube Content ID*</p>
          <div style="display: flex; gap: 20px; margin-top: 5px;">
            <label style="display: flex; align-items: center; gap: 5px; color: #EEEEEE; font-size: x-small; font-weight: normal;">
              <input type="radio" name="youtubeContentId" value="no" checked> No
            </label>
            <label style="display: flex; align-items: center; gap: 5px; color: #EEEEEE; font-size: x-small; font-weight: normal;">
              <input type="radio" name="youtubeContentId" value="yes"> Yes
            </label>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group half">
          <p class="pCase">Original Release Date (if previously released)</p>
          <input type="date" id="ogReleaseDate" name="ogReleaseDate" class="newsletterInput" style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;">
        </div>
        <div class="form-group half">
          <p class="pCase">License*</p>
          <div style="display: flex; gap: 20px; margin-top: 5px;">
            <label style="display: flex; align-items: center; gap: 5px; color: #EEEEEE; font-size: x-small; font-weight: normal; font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif;">
              <input type="radio" name="license" value="arr" checked> All Rights Reserved
            </label>
            <label style="display: flex; align-items: center; gap: 5px; color: #EEEEEE; font-size: x-small; font-weight: normal; font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif;">
              <input type="radio" name="license" value="cc"> Creative Commons
            </label>
          </div>
        </div>
      </div>
      <div>
        <p class="pCase">Cover Artwork* (Must be square, 1500x1500px minimum)</p>
        <div>
          <input type="button" class="submit" value="Upload Artwork" onclick="document.getElementById('artwork').click()" style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif;">
          <span id="artworkFileName" style="margin-left: 10px; font-size: x-small; font-weight: normal;">No file selected</span>
        </div>
        <input type="file" id="artwork" name="artwork" accept="image/*" required style="display: none;">
        <div style="margin: 10px 0; border: 5px solid #484848; width: 150px; height: 150px; background: #333; display: flex; justify-content: center; align-items: center; overflow: hidden;">
          <img id="artworkPreviewImg" style="display: none; max-width: 100%; max-height: 100%;" alt="Artwork Preview">
        </div>
        <div id="artworkError" style="color: #FF6B6B; display: none; font-size: x-small;">
          Artwork must be square and at least 1500x1500 pixels.
        </div>
      </div>
    </div>

    <div class="dispBoxLeft" id="tracks-section" style="display: none;">
      <p class="pCase" style="font-size: x-small; color: #BFED46;">Track Information</p>
      <div id="tracks-container">
        <!-- Track items will be added here -->
        <div id="track-template" class="track-item" style="margin-bottom: 15px; padding: 10px; background: #5D5D5D; border: 5px solid #484848;">
          <p class="pCase" style="margin-bottom: 10px;">Track 1</p>
          <div style="margin-bottom: 10px;">
            <p class="pCase">Track Name*</p>
            <input type="text" class="newsletterInput track-name" required style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;">
          </div>
          <div style="margin-bottom: 10px;">
            <p class="pCase">ISRC (if available)</p>
            <input type="text" class="newsletterInput track-isrc" placeholder="e.g., USRC17607839" style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;">
          </div>
          <div>
            <p class="pCase">Audio File*</p>
            <div>
              <input type="button" class="submit" value="Upload Audio File" onclick="document.getElementById('audio-file-'+this.closest('.track-item').id.split('-').pop()).click()" style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif;">
              <span class="track-file-name" style="margin-left: 10px; font-size: x-small; font-weight: normal;">No file selected</span>
            </div>
            <input id="audio-file-template" type="file" class="track-file" accept="audio/*" required style="display: none;">
          </div>
        </div>
      </div>
      <div id="multiple-tracks-controls" style="display: none; margin-top: 10px;">
        <input type="button" id="add-track-btn" onclick="addTrackItem()" class="submit" value="Add Another Track" style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif;">
      </div>
    </div>

    <div class="dispBoxLeft">
      <p class="pCase" style="font-size: x-small; color: #BFED46;">Additional Information</p>
      <div class="form-row">
        <div class="form-group half">
          <p class="pCase">UPC (if you have one)</p>
          <input type="text" id="upc" name="upc" class="newsletterInput" placeholder="e.g., 123456789012" style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;">
        </div>
        <div class="form-group half">
          <p class="pCase">Featured Artists (if any)</p>
          <input type="text" id="featuredArtists" name="featuredArtists" class="newsletterInput" placeholder="e.g., DJ XYZ, Singer ABC" style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;">
        </div>
      </div>
      <div class="form-group">
        <p class="pCase">Primary Artists (if different from artist name)</p>
        <input type="text" id="primaryArtists" name="primaryArtists" class="newsletterInput" placeholder="Separate multiple artists with commas" style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;">
      </div>
      <div class="form-group">
        <p class="pCase">Credits</p>
        <textarea id="credits" name="credits" class="newsletterInput" rows="4" placeholder="Music by..., Lyrics by..., etc." style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;"></textarea>
      </div>
      <div class="form-group">
        <p class="pCase">Additional Notes</p>
        <textarea id="notes" name="notes" class="newsletterInput" rows="4" placeholder="Any additional information..." style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif; color: #FFFFFF;"></textarea>
      </div>
    </div>

    <div style="text-align: right; margin-top: 15px;">
      <input type="submit" class="submit" value="Submit Release" style="font-family: Tahoma, Verdana, Arial, Helvetica, sans-serif;">
    </div>
  `;

  console.log("Upload form HTML setup completed");

  // Setup event listeners for the form
  setupArtworkValidation();
}

// Toggle tracks section based on release type
function toggleTracksSection() {
  const releaseType = document.getElementById('releaseType').value;
  const tracksSection = document.getElementById('tracks-section');
  const multipleTracksControls = document.getElementById('multiple-tracks-controls');
  const trackHeader = document.querySelector('.track-item p.pCase');

  if (releaseType === '') {
    tracksSection.style.display = 'none';
    return;
  }

  tracksSection.style.display = 'block';

  if (releaseType === 'single') {
    trackHeader.textContent = 'Single Track';
    multipleTracksControls.style.display = 'none';
  } else {
    trackHeader.textContent = 'Track 1';
    multipleTracksControls.style.display = 'block';

    // Make sure we have at least one track
    if (document.querySelectorAll('.track-item').length === 0) {
      addTrackItem();
    }
  }
}

// Track counter for unique IDs
let trackCounter = 1;

// Add a new track item to the tracks container
function addTrackItem() {
  const tracksContainer = document.getElementById('tracks-container');
  const trackTemplate = document.getElementById('track-template');

  // Create a clone of the template
  const newTrack = trackTemplate.cloneNode(true);
  const trackId = trackCounter; // Save counter value for this track

  // Update the ID and labels
  newTrack.id = `track-item-${trackId}`;

  // Update track header
  const header = newTrack.querySelector('p.pCase');
  header.textContent = `Track ${trackId + 1}`;

  // Update audio file input ID
  const fileInput = newTrack.querySelector('.track-file');
  fileInput.id = `audio-file-${trackId}`;

  // Add remove button if not the first track
  if (trackId > 0) {
    // Create remove button
    const removeBtn = document.createElement('input');
    removeBtn.type = 'button';
    removeBtn.className = 'submit';
    removeBtn.value = 'Remove';
    removeBtn.style.marginLeft = '10px';
    removeBtn.style.fontSize = 'xx-small';
    removeBtn.style.padding = '0 5px';
    removeBtn.style.fontFamily = 'Tahoma, Verdana, Arial, Helvetica, sans-serif';
    removeBtn.onclick = function() {
      tracksContainer.removeChild(newTrack);
      renumberTracks();
    };

    // Insert after the header
    header.parentNode.insertBefore(removeBtn, header.nextSibling);
  }

  // Update input IDs and labels
  const inputs = newTrack.querySelectorAll('input[type="text"]');
  inputs.forEach(input => {
    const oldId = input.id || '';
    if (oldId) {
      const baseName = oldId.substring(0, oldId.lastIndexOf('-'));
      const newId = `${baseName}-${trackId}`;
      input.id = newId;
    }
  });

  // Update the upload button click handler to reference the new file input ID
  const uploadBtn = newTrack.querySelector('input[type="button"]');
  if (uploadBtn) {
    uploadBtn.onclick = function() {
      document.getElementById(`audio-file-${trackId}`).click();
    };
  }

  // Append the new track
  tracksContainer.appendChild(newTrack);
  trackCounter++;

  // Ensure the file inputs are set up correctly
  setupTrackFileUploads();
}

// Renumber tracks after removing one
function renumberTracks() {
  const tracks = document.querySelectorAll('.track-item');
  tracks.forEach((track, index) => {
    // Update header text
    const header = track.querySelector('p.pCase');
    header.textContent = `Track ${index + 1}`;
  });
}

// Handle the upload form submission
async function handleUpload(event) {
  event.preventDefault();

  // Show loading state
  const submitBtn = event.target.querySelector('input[type="submit"]');
  const originalBtnValue = submitBtn.value;
  submitBtn.value = 'Uploading...';
  submitBtn.disabled = true;

  try {
    // Validate artwork
    const artworkInput = document.getElementById('artwork');
    const errorDiv = document.getElementById('artworkError');

    // Check if artwork validation has failed
    if (artworkInput.validity.customError) {
      errorDiv.style.display = 'block';
      artworkInput.focus();
      throw new Error('Artwork validation failed');
    }

    // Get basic form values
    const artistName = document.getElementById('artistName').value;
    const releaseTitle = document.getElementById('releaseTitle').value;
    const releaseType = document.getElementById('releaseType').value;
    const primaryGenre = document.getElementById('primaryGenre').value;
    const secondaryGenre = document.getElementById('secondaryGenre').value;
    const explicit = document.querySelector('input[name="explicit"]:checked').value;
    const youtubeContentId = document.querySelector('input[name="youtubeContentId"]:checked').value;
    const releaseDate = document.getElementById('releaseDate').value;
    const ogReleaseDate = document.getElementById('ogReleaseDate').value;
    const license = document.querySelector('input[name="license"]:checked').value;
    const featuredArtists = document.getElementById('featuredArtists').value;
    const primaryArtists = document.getElementById('primaryArtists').value;
    const upc = document.getElementById('upc').value;
    const credits = document.getElementById('credits').value;
    const notes = document.getElementById('notes').value;

    // Create unique folder for this release
    const releaseId = Date.now().toString();
    const userEmail = (await supabase.auth.getUser()).data.user.email;
    const folderPath = `releases/${userEmail}/${releaseId}`;

    // Variables to store artwork data
    let artworkDataUrl = '';
    let artworkUrl = '';

    // Get artwork data URL regardless of Supabase upload
    if (artworkInput.files && artworkInput.files[0]) {
      const artworkFile = artworkInput.files[0];

      // Always get the data URL for local display
      const reader = new FileReader();
      artworkDataUrl = await new Promise(resolve => {
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(artworkFile);
      });

      // Try to upload to Supabase, but continue even if it fails
      try {
        const artworkPath = `${folderPath}/artwork.${getFileExtension(artworkFile.name)}`;

        // Try to create bucket if it doesn't exist
        try {
          const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
          if (bucketError) {
            console.error('Error checking buckets:', bucketError.message);
          } else {
            const musicBucketExists = buckets.some(bucket => bucket.name === 'music');
            if (!musicBucketExists) {
              const { error: createError } = await supabase.storage.createBucket('music', {
                public: true
              });
              if (createError) {
                console.error('Error creating music bucket:', createError.message);
              } else {
                console.log('Music storage bucket created successfully');
              }
            }
          }
        } catch (bucketErr) {
          console.error('Failed to check/create bucket:', bucketErr);
        }

        // Try to upload the file
        const { data: artworkData, error: artworkError } = await supabase.storage
          .from('music')
          .upload(artworkPath, artworkFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (artworkError) {
          console.error(`Artwork upload failed: ${artworkError.message}`);
          // Continue with data URL only
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage.from('music').getPublicUrl(artworkPath);
          artworkUrl = urlData.publicUrl;
          console.log('Artwork uploaded successfully:', artworkUrl);
        }
      } catch (uploadErr) {
        console.error('Artwork upload error:', uploadErr);
        // Continue with data URL only
      }
    }

    // Collect track data and upload audio files
    const tracks = [];
    const trackItems = document.querySelectorAll('.track-item');

    for (let i = 0; i < trackItems.length; i++) {
      const trackItem = trackItems[i];
      const trackName = trackItem.querySelector('.track-name').value;
      const trackIsrc = trackItem.querySelector('.track-isrc').value;
      const trackFileInput = trackItem.querySelector('.track-file');

      // Variables to store track audio data
      let audioUrl = '';
      let fileName = '';
      let audioDataUrl = '';

      if (trackFileInput.files && trackFileInput.files[0]) {
        const audioFile = trackFileInput.files[0];
        fileName = audioFile.name;

        // Get audio data URL
        const reader = new FileReader();
        audioDataUrl = await new Promise(resolve => {
          reader.onload = e => resolve(e.target.result);
          reader.readAsDataURL(audioFile);
        });

        // Try to upload to Supabase, but continue even if it fails
        try {
          const sanitizedTrackName = trackName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const trackPath = `${folderPath}/track_${i+1}_${sanitizedTrackName}.${getFileExtension(fileName)}`;

          const { data: audioData, error: audioError } = await supabase.storage
            .from('music')
            .upload(trackPath, audioFile, {
              cacheControl: '3600',
              upsert: true
            });

          if (audioError) {
            console.error(`Audio upload failed: ${audioError.message}`);
            // Continue with data URL only
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage.from('music').getPublicUrl(trackPath);
            audioUrl = urlData.publicUrl;
            console.log('Audio uploaded successfully:', audioUrl);
          }
        } catch (uploadErr) {
          console.error('Audio upload error:', uploadErr);
          // Continue with data URL only
        }
      }

      tracks.push({
        position: i + 1,
        name: trackName,
        isrc: trackIsrc || null,
        fileName: fileName,
        audioUrl: audioUrl,
        audioDataUrl: audioDataUrl // Store the data URL as backup
      });
    }

    // Create release object with all form data
    const releaseData = {
      id: releaseId,
      artistName,
      releaseTitle,
      releaseType,
      primaryGenre,
      secondaryGenre,
      explicit,
      youtubeContentId,
      releaseDate,
      ogReleaseDate,
      license,
      featuredArtists,
      primaryArtists,
      upc,
      credits,
      notes,
      tracks,
      artworkDataUrl,
      artworkUrl,
      submittedBy: userEmail,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    // Store the release in Supabase
    try {
      const { data, error } = await supabase
        .from('releases')
        .insert([releaseData]);

      if (error) {
        console.error('Error saving to Supabase:', error);
        // Fall back to localStorage if Supabase fails
        const existingReleases = await getStoredReleases();
        existingReleases.push(releaseData);
        await saveReleasesToStorage(existingReleases);
      } else {
        console.log('Release saved to Supabase successfully');
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fall back to localStorage
      const existingReleases = await getStoredReleases();
      existingReleases.push(releaseData);
      await saveReleasesToStorage(existingReleases);
    }

    showNotification('Release submitted for approval!', 'success');
    document.getElementById('uploadForm').reset();

    // Clear the artwork preview
    const previewImg = document.getElementById('artworkPreviewImg');
    if (previewImg) {
      previewImg.style.display = 'none';
      previewImg.src = '';
    }

    // Reset file name displays
    document.getElementById('artworkFileName').textContent = 'No file selected';
    document.querySelectorAll('.track-file-name').forEach(span => {
      span.textContent = 'No file selected';
    });

    // If the user is viewing their releases, refresh the list
    if (document.getElementById('releases-tab').style.display !== 'none') {
      loadUserReleases(releaseData.submittedBy);
    }
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('Error: ' + error.message, 'error');
  } finally {
    // Reset button state
    submitBtn.value = originalBtnValue;
    submitBtn.disabled = false;
  }
}

// Handle logout
async function handleLogout() {
  try {
    console.log("Logging out...");
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error logging out:', error.message);
      showNotification('Error logging out: ' + error.message, 'error');
    } else {
      console.log("Logout successful");
      // Clear any localStorage user data
      localStorage.removeItem('supabase.auth.token');

      // Force reload the page to show login form again
      window.location.href = window.location.pathname;
    }
  } catch (e) {
    console.error('Exception during logout:', e);
    // Force reload as fallback
    window.location.href = window.location.pathname;
  }
}

// Helper function to get file extension
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}
