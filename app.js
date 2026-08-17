let isZoomedOut = true;
let isFetching = false;

// Helper: winner à¸­à¸²à¸ˆà¹€à¸›à¹‡à¸™ Object {id, name} à¸«à¸£à¸·à¸­ String ID
function getWinnerId(winner) {
    if (!winner) return null;
    return (typeof winner === 'object' && winner !== null) ? winner.id : winner;
}

// Initialization now handled by app.js
function initTournamentBoard() {
    setupMobileUX();
    setupZoom();
}

// =======================================================
// Native RPC Wrapper (?????? fetch ???????)
// =======================================================
async function fetchRPC(payload) { console.warn('fetchRPC is disabled on GitHub Pages viewer.'); return { ok: false }; }



function renderTournament(data) {
    try {
        const titleEl = document.getElementById('tournament-title');
        if (titleEl) titleEl.textContent = data.tournamentName;
        
        const divEl = document.getElementById('tournament-division');
        if (divEl) divEl.textContent = data.division;
        
        renderBracketSide(data.bracketA, 'bracket-a');
        renderBracketSide(data.bracketB, 'bracket-b');
        renderFinals(data.finalMatch, data.thirdPlaceMatch, 'center-final');
        
        // Ensure zoom is recalculated now that the board has actual size
        if (typeof updateZoom === 'function') {
            updateZoom();
        }
        
    } catch (error) {
        console.error("Error loading bracket data:", error);
        document.getElementById('tournament-board').innerHTML = '<h2 style="color:red">Failed to load bracket data.</h2>';
    }
}

function renderBracketSide(rounds, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; // M1 fix
    container.innerHTML = '';
    
    rounds.forEach((roundMatches, roundIndex) => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round';
        
        for (let i = 0; i < roundMatches.length; i += 2) {
            const pairDiv = document.createElement('div');
            pairDiv.className = 'match-pair';
            
            const m1 = createMatchElement(roundMatches[i]);
            pairDiv.appendChild(m1);
            
            if (i + 1 < roundMatches.length) {
                const m2 = createMatchElement(roundMatches[i+1]);
                pairDiv.appendChild(m2);
                pairDiv.classList.add('has-vertical');
            }
            
            roundDiv.appendChild(pairDiv);
        }
        
        container.appendChild(roundDiv);
    });
}

function renderFinals(finalMatch, thirdPlaceMatch, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; // M1 fix
    container.innerHTML = '';
    
    // 1. Render Trophy and Grand Final Box
    if (finalMatch) {
        // Trophy goes in Grid Row 1
        const trophyWrapper = document.createElement('div');
        trophyWrapper.className = 'trophy-wrapper';
        trophyWrapper.style.alignSelf = 'end'; // push to bottom of row 1
        
        const trophy = document.createElement('div');
        trophy.className = 'trophy-icon';
        trophy.innerHTML = 'ðŸ†<div class="trophy-glow"></div>';
        trophyWrapper.appendChild(trophy);
        
        container.appendChild(trophyWrapper);
        
        // Grand Final goes in Grid Row 2
        const grandFinalBox = document.createElement('div');
        grandFinalBox.className = 'finals-box grand-final-box';
        
        const matchDiv = createMatchElement(finalMatch);
        matchDiv.classList.add('final-match');
        
        grandFinalBox.appendChild(matchDiv);
        container.appendChild(grandFinalBox);
    }
    
    // 2. Render 3rd Place Match Box
    if (thirdPlaceMatch) {
        const thirdPlaceBox = document.createElement('div');
        thirdPlaceBox.className = 'finals-box third-place-box';
        thirdPlaceBox.style.alignSelf = 'start'; // push to top of row 3
        
        const thirdTitle = document.createElement('h3');
        thirdTitle.textContent = 'à¸Šà¸´à¸‡à¸­à¸±à¸™à¸”à¸±à¸š 3';
        thirdTitle.style.textAlign = 'center';
        thirdTitle.style.color = '#6c757d';
        thirdTitle.style.margin = '40px 0 10px 0';
        thirdTitle.style.fontSize = '1.1rem';
        
        const thirdMatchDiv = createMatchElement(thirdPlaceMatch);
        thirdMatchDiv.classList.add('final-match');
        thirdMatchDiv.classList.add('no-lines'); // Prevent connecting lines
        
        thirdPlaceBox.appendChild(thirdTitle);
        thirdPlaceBox.appendChild(thirdMatchDiv);
        
        container.appendChild(thirdPlaceBox);
    }
}

function createMatchElement(match) {
    const player1 = match.player1 || { id: 'TBA', name: 'à¸£à¸­à¸œà¸¹à¹‰à¸Šà¸™à¸°à¸ˆà¸²à¸à¸£à¸­à¸šà¸à¹ˆà¸­à¸™à¸«à¸™à¹‰à¸²', school: '' };
    const player2 = match.player2 || { id: 'TBA', name: 'à¸£à¸­à¸œà¸¹à¹‰à¸Šà¸™à¸°à¸ˆà¸²à¸à¸£à¸­à¸šà¸à¹ˆà¸­à¸™à¸«à¸™à¹‰à¸²', school: '' };
    
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';
    
    // Match ID badge
    const badge = document.createElement('div');
    badge.className = 'match-id';
    badge.textContent = match.id;
    matchDiv.appendChild(badge);

    const createPlayerRow = (p) => {
        const row = document.createElement('div');
        row.className = 'player' + (p.winner ? ' winner' : '');
        row.innerHTML = \
            <span class="player-id">\ + (p.id || 'TBA') + \</span>
            <span class="player-name" title="\ + (p.name || '') + \">\ + (p.name || 'รอผู้ชนะจากรอบก่อนหน้า') + \</span>
            <span class="player-score">\ + (p.score !== undefined && p.score !== null ? p.score : '-') + \</span>
        \;
        return row;
    };

    matchDiv.appendChild(createPlayerRow(player1));
    matchDiv.appendChild(createPlayerRow(player2));
    
    return matchDiv;
}

function renderAnnouncerView() {
    const listDiv = document.getElementById('announcement-list');
    if (!listDiv) return;

    if (!window.tournamentAllData) return;
    const midMatches = extractMatchesForDivision(window.tournamentAllData.middle, 'à¸¡.à¸•à¹‰à¸™');
    const highMatches = extractMatchesForDivision(window.tournamentAllData.high, 'à¸¡.à¸›à¸¥à¸²à¸¢');
    
    // Combine all assigned matches
    const allAssigned = [
        ...midMatches.assigned.A, ...midMatches.assigned.B,
        ...highMatches.assigned.A, ...highMatches.assigned.B
    ];
    
    if (allAssigned.length === 0) {
        listDiv.innerHTML = '<div id="empty-announcement" style="text-align: center; color: var(--gray); padding: 40px 0; font-size: 0.9rem;">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸›à¸£à¸°à¸à¸²à¸¨à¹€à¸£à¸µà¸¢à¸à¸•à¸±à¸§</div>';
        return;
    }
    
    listDiv.innerHTML = '';
    
    // Helper to group times that are very close (within 1 minute) into the same batch
    const getBatchGroup = (time) => Math.floor((time || 0) / 60000);

    // Sort by batch group (descending) so newest announcements are on top, then by table number (ascending)
    allAssigned.sort((a, b) => {
        const batchA = getBatchGroup(a.assignedAt);
        const batchB = getBatchGroup(b.assignedAt);
        if (batchB !== batchA) {
            return batchB - batchA;
        }
        // If same batch group, sort by table number
        return parseInt(a.table || 0) - parseInt(b.table || 0);
    });

    let currentBatchGroup = -1;

    allAssigned.forEach((match, index) => {
        const matchBatch = getBatchGroup(match.assignedAt);
        
        // If this match belongs to a different batch group, add a separator
        if (currentBatchGroup !== -1 && matchBatch !== currentBatchGroup) {
            const hr = document.createElement('hr');
            hr.style.border = '0';
            hr.style.borderTop = '1px solid #dee2e6';
            hr.style.margin = '20px 0';
            listDiv.appendChild(hr);
        }
        
        // Update current batch group
        currentBatchGroup = matchBatch;
        
        const p1Name = match.player1.name && match.player1.name !== "à¹„à¸¡à¹ˆà¸¡à¸µà¸Šà¸·à¹ˆà¸­" ? match.player1.name : (match.player1.id || '-');
        const p2Name = match.player2.name && match.player2.name !== "à¹„à¸¡à¹ˆà¸¡à¸µà¸Šà¸·à¹ˆà¸­" ? match.player2.name : (match.player2.id || '-');
        
        const card = document.createElement('div');
        card.style.background = '#f8f9fa';
        card.style.border = '1px solid #dee2e6';
        card.style.borderRadius = '8px';
        card.style.padding = '15px';
        card.style.marginBottom = '10px';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        
        const isAnnouncedStr = match.isAnnounced ? 'true' : 'false';
        
        let labelColor = 'var(--primary)';
        if (match.division === 'à¸¡.à¸›à¸¥à¸²à¸¢') {
            labelColor = '#28a745'; // Green for High School
        }
        const bgColor = match.isAnnounced ? 'var(--gray)' : labelColor;
        
        card.innerHTML = `
            <div onclick="toggleAnnounceStatus('${match.id}', '${match.division}', this, '${labelColor}')" data-clicked="${isAnnouncedStr}" style="background-color: ${bgColor}; color: white; width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-right: 15px; flex-shrink: 0; cursor: pointer; transition: 0.2s;" title="à¸„à¸¥à¸´à¸à¹€à¸žà¸·à¹ˆà¸­à¸—à¸³à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸«à¸¡à¸²à¸¢à¸§à¹ˆà¸²à¹€à¸£à¸µà¸¢à¸à¹à¸¥à¹‰à¸§/à¸¢à¸à¹€à¸¥à¸´à¸à¹€à¸£à¸µà¸¢à¸">
                <i class="fas fa-bullhorn"></i>
            </div>
            <div style="flex-grow: 1;">
                <div style="font-weight: bold; color: ${labelColor}; margin-bottom: 5px;">${match.id} <span style="color: var(--gray); font-weight: normal; font-size: 0.85rem; margin-left: 10px;">(à¹‚à¸•à¹Šà¸° ${match.table} | ${match.division} - ${match.roundInfo})</span></div>
                <div style="font-size: 0.95rem;">
                    <span style="font-weight: 600;">${match.player1.id}</span> ${p1Name} 
                    <span style="color: #adb5bd; margin: 0 10px; font-size: 0.8rem;">VS</span> 
                    <span style="font-weight: 600;">${match.player2.id}</span> ${p2Name}
                </div>
            </div>
        `;
        listDiv.appendChild(card);
    });
}

function toggleAnnounceStatus(matchId, divisionName, btnElement, activeColor) {
    const isClicked = btnElement.dataset.clicked === 'true';
    const newState = !isClicked;
    
    // Optimistic UI update
    btnElement.dataset.clicked = newState.toString();
    btnElement.style.backgroundColor = newState ? 'var(--gray)' : (activeColor || 'var(--primary)');
    
    // Send to backend (public action)
    const payload = {
        action: 'toggleAnnounce',
        division: divisionName,
        updates: [{
            matchId: matchId,
            announced: newState
        }]
    };
    
    btnElement.style.opacity = '0.5';
    
    fetchRPC(payload).then(response => response.json())
      .then(result => {
          btnElement.style.opacity = '1';
          if (!result.success) {
              alert("à¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ: " + (result.message || 'à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹„à¸¡à¹ˆà¸—à¸£à¸²à¸šà¸ªà¸²à¹€à¸«à¸•à¸¸'));
          } else {
              // Update local state so it doesn't revert on next render if we don't fetch
              let original = findOriginalMatch(matchId, divisionName);
              if (original) original.isAnnounced = newState;
          }
      })
      .catch(err => {
          btnElement.style.opacity = '1';
          console.error(err);
          alert("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­");
      });
}

function triggerAutoAssign() {
    if (!window.tournamentAllData) return;
    
    const setupTablesInput = document.getElementById('setup-tables');
    let totalTables = setupTablesInput ? parseInt(setupTablesInput.value) || 7 : 7;
    
    const occupiedTables = new Set();
    const checkOccupied = (data) => {
        if(!data) return;
        const checkMatch = (m) => { if (m && m.table && !m.winner) occupiedTables.add(parseInt(m.table)); };
        ['bracketA', 'bracketB'].forEach(k => { if(data[k]) data[k].forEach(r => r.forEach(checkMatch)); });
        checkMatch(data.finalMatch);
        checkMatch(data.thirdPlaceMatch);
    };
    checkOccupied(window.tournamentAllData.middle);
    checkOccupied(window.tournamentAllData.high);
    
    const midMatches = extractMatchesForDivision(window.tournamentAllData.middle, 'à¸¡.à¸•à¹‰à¸™');
    const highMatches = extractMatchesForDivision(window.tournamentAllData.high, 'à¸¡.à¸›à¸¥à¸²à¸¢');
    
    const allPendingClones = [
        ...midMatches.pending.A,
        ...midMatches.pending.B,
        ...highMatches.pending.A,
        ...highMatches.pending.B
    ];
    
    let assignCount = 0;
    let nextFreeTable = 1;
    
    for (const clone of allPendingClones) {
        while (occupiedTables.has(nextFreeTable) && nextFreeTable <= totalTables) {
            nextFreeTable++;
        }
        
        if (nextFreeTable > totalTables) break;
        
        let original = findOriginalMatch(clone.id, clone.division);
        
        if (original) {
            original.table = nextFreeTable;
            occupiedTables.add(nextFreeTable);
            assignCount++;
        }
    }
    
    if (assignCount > 0) {
        alert(`à¸ˆà¸±à¸”à¹‚à¸•à¹Šà¸°à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´à¸ªà¸³à¹€à¸£à¹‡à¸ˆ à¸ˆà¸³à¸™à¸§à¸™ ${assignCount} à¸„à¸¹à¹ˆ`);
        renderAssignmentView();
    } else {
        alert("à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¸¹à¹ˆà¸—à¸µà¹ˆà¸žà¸£à¹‰à¸­à¸¡à¹à¸‚à¹ˆà¸‡ à¸«à¸£à¸·à¸­ à¹‚à¸•à¹Šà¸°à¹€à¸•à¹‡à¸¡à¸«à¸¡à¸”à¹à¸¥à¹‰à¸§");
    }
}



// --- Manual Scoring Functions ---
let manualScoreCurrentMatch = null;
let p1FoulState = false;
let p2FoulState = false;
function getAllMatchesFlat(data, divisionName) {
    let matches = [];
    if (!data) return matches;
    ['bracketA', 'bracketB'].forEach(bracketKey => {
        if (!data[bracketKey]) return;
        data[bracketKey].forEach((round, roundIndex) => {
            round.forEach(match => {
                matches.push({
                    ...match,
                    division: divisionName,
                    bracket: bracketKey === 'bracketA' ? 'à¸ªà¸²à¸¢ A' : 'à¸ªà¸²à¸¢ B',
                    roundInfo: `à¸£à¸­à¸šà¸—à¸µà¹ˆ ${roundIndex + 1}`
                });
            });
        });
    });
    if (data.finalMatch) matches.push({...data.finalMatch, division: divisionName, bracket: 'à¸Šà¸´à¸‡à¸Šà¸™à¸°à¹€à¸¥à¸´à¸¨', roundInfo: 'à¸£à¸­à¸šà¸Šà¸´à¸‡à¸Šà¸™à¸°à¹€à¸¥à¸´à¸¨'});
    if (data.thirdPlaceMatch) matches.push({...data.thirdPlaceMatch, division: divisionName, bracket: 'à¸Šà¸´à¸‡à¸­à¸±à¸™à¸”à¸±à¸š 3', roundInfo: 'à¸Šà¸´à¸‡à¸­à¸±à¸™à¸”à¸±à¸š 3'});
    
    // Filter out invalid/empty slots
    return matches.filter(m => m.player1 && m.player2 && 
        m.player1.id !== "BYE" && m.player2.id !== "BYE" && 
        !m.player1.id.includes("Winner") && !m.player1.id.includes("RU") && 
        !m.player2.id.includes("Winner") && !m.player2.id.includes("RU")
    );
}

function renderManualScoreView() {
    if (!window.tournamentAllData) return;
    
    const listDiv = document.getElementById('manual-score-list');
    if (!listDiv) return;
    
    listDiv.innerHTML = '';
    
    // Retrieve all valid matches from both divisions
    const midMatches = getAllMatchesFlat(window.tournamentAllData.middle, 'à¸¡.à¸•à¹‰à¸™');
    const highMatches = getAllMatchesFlat(window.tournamentAllData.high, 'à¸¡.à¸›à¸¥à¸²à¸¢');
    const allMatches = [...midMatches, ...highMatches];
    
    // 1. TOP SECTION: Active matches (assigned to a table, NO winner yet)
    const activeMatches = allMatches.filter(m => !m.winner && m.table !== null && m.table !== undefined && m.table !== "");
    
    // Helper to group times that are very close (within 1 minute) into the same batch
    const getBatchGroup = (time) => Math.floor((time || 0) / 60000);
    
    // Sort Top Section: by batch group (older first), then by table number
    activeMatches.sort((a, b) => {
        const batchA = getBatchGroup(a.assignedAt);
        const batchB = getBatchGroup(b.assignedAt);
        if (batchA !== batchB) return batchA - batchB;
        return parseInt(a.table || 0) - parseInt(b.table || 0);
    });
    
    const topSection = document.createElement('div');
    topSection.style.marginBottom = '40px';
    topSection.innerHTML = '<h3 style="color: var(--primary); margin-bottom: 15px;"><i class="fas fa-table"></i> à¹‚à¸•à¹Šà¸°à¸—à¸µà¹ˆà¸à¸³à¸¥à¸±à¸‡à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™ (à¸£à¸­à¸¥à¸‡à¸„à¸°à¹à¸™à¸™)</h3>';
    
    if (activeMatches.length === 0) {
        topSection.innerHTML += '<div style="text-align: center; color: var(--gray); padding: 20px 0;">à¹„à¸¡à¹ˆà¸¡à¸µà¹‚à¸•à¹Šà¸°à¸—à¸µà¹ˆà¸à¸³à¸¥à¸±à¸‡à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™à¹ƒà¸™à¸‚à¸“à¸°à¸™à¸µà¹‰</div>';
    } else {
        activeMatches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'admin-match-card';
            card.onclick = () => openScoreModal(match);
            
            const tableStr = `(à¹‚à¸•à¹Šà¸° ${match.table})`;
            const isHigh = match.division === 'à¸¡.à¸›à¸¥à¸²à¸¢';
            const badgeColor = isHigh ? '#28a745' : 'var(--primary)';
            
            card.innerHTML = `
                <div class="admin-match-header">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="admin-match-badge" style="background-color: ${badgeColor};">${match.id}</span>
                        <span style="font-size: 0.85rem; font-weight: bold; color: ${badgeColor}; border: 1px solid ${badgeColor}; padding: 2px 6px; border-radius: 4px;">${match.division}</span>
                    </div>
                    <span>${match.bracket} - ${match.roundInfo} <strong style="color:var(--primary);">${tableStr}</strong></span>
                </div>
                <div class="admin-player-row">
                    <span class="admin-player-id">${match.player1.id}</span>
                    <span class="admin-player-name">${match.player1.name}</span>
                </div>
                <div class="admin-vs-divider">VS</div>
                <div class="admin-player-row">
                    <span class="admin-player-id">${match.player2.id}</span>
                    <span class="admin-player-name">${match.player2.name}</span>
                </div>
            `;
            topSection.appendChild(card);
        });
    }
    listDiv.appendChild(topSection);
    
    // Separator
    const hr = document.createElement('hr');
    hr.style.border = '0';
    hr.style.borderTop = '2px dashed #dee2e6';
    hr.style.margin = '30px 0';
    listDiv.appendChild(hr);
    
    // 2. BOTTOM SECTION: Completed matches (winner exists)
    // Filtered by current view division state (window.DIVISION_KEY)
    const currentDivisionName = window.DIVISION_KEY === 'middle' ? 'à¸¡.à¸•à¹‰à¸™' : 'à¸¡.à¸›à¸¥à¸²à¸¢';
    const completedMatches = (window.DIVISION_KEY === 'middle' ? midMatches : highMatches).filter(m => m.winner);
    
    // Sort Bottom Section: by Match_ID
    completedMatches.sort((a, b) => {
        return a.id.localeCompare(b.id, 'en', { numeric: true });
    });
    
    const bottomSection = document.createElement('div');
    bottomSection.innerHTML = `<h3 style="color: #28a745; margin-bottom: 15px;"><i class="fas fa-check-circle"></i> à¸¥à¸‡à¸„à¸°à¹à¸™à¸™à¸ªà¸¡à¸šà¸¹à¸£à¸“à¹Œ (${currentDivisionName})</h3>`;
    
    if (completedMatches.length === 0) {
        bottomSection.innerHTML += '<div style="text-align: center; color: var(--gray); padding: 20px 0;">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸à¸²à¸£à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™à¸—à¸µà¹ˆà¸¥à¸‡à¸„à¸°à¹à¸™à¸™à¹€à¸ªà¸£à¹‡à¸ˆà¸ªà¸´à¹‰à¸™</div>';
    } else {
        completedMatches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'admin-match-card';
            card.style.opacity = '0.8'; // slightly dim completed matches
            card.onclick = () => openScoreModal(match);
            
            const tableStr = match.table ? `(à¹‚à¸•à¹Šà¸° ${match.table})` : '';
            const isHigh = match.division === 'à¸¡.à¸›à¸¥à¸²à¸¢';
            const badgeColor = isHigh ? '#28a745' : 'var(--primary)';
            
            card.innerHTML = `
                <div class="admin-match-header">
                    <span class="admin-match-badge" style="background-color: #6c757d;">${match.id}</span>
                    <span>${match.bracket} - ${match.roundInfo} <strong style="color:var(--gray);">${tableStr}</strong></span>
                </div>
                <div class="admin-player-row">
                    <span class="admin-player-id">${match.player1.id}</span>
                    <span class="admin-player-name">${match.player1.name} <span style="color: ${match.winner === match.player1.id ? '#28a745' : '#dc3545'}; font-size: 0.85rem; margin-left: 5px;">[${match.score1 || 0}]</span></span>
                </div>
                <div class="admin-vs-divider">VS</div>
                <div class="admin-player-row">
                    <span class="admin-player-id">${match.player2.id}</span>
                    <span class="admin-player-name">${match.player2.name} <span style="color: ${match.winner === match.player2.id ? '#28a745' : '#dc3545'}; font-size: 0.85rem; margin-left: 5px;">[${match.score2 || 0}]</span></span>
                </div>
            `;
            bottomSection.appendChild(card);
        });
    }
    listDiv.appendChild(bottomSection);
}

function openScoreModal(match) {
    manualScoreCurrentMatch = match;
    document.getElementById('modal-score-match-id').textContent = match.id;
    document.getElementById('p1-score-name').textContent = `${match.player1.id} ${match.player1.name}`;
    document.getElementById('p2-score-name').textContent = `${match.player2.id} ${match.player2.name}`;
    
    document.getElementById('p1-score-input').value = '';
    document.getElementById('p2-score-input').value = '';
    
    p1FoulState = false;
    p2FoulState = false;
    
    document.getElementById('p1-score-row').classList.remove('foul-state');
    document.getElementById('p2-score-row').classList.remove('foul-state');
    document.getElementById('p1-foul-btn').classList.remove('active');
    document.getElementById('p1-foul-btn').textContent = 'à¸—à¸³à¸Ÿà¸²à¸§à¸¥à¹Œ';
    document.getElementById('p2-foul-btn').classList.remove('active');
    document.getElementById('p2-foul-btn').textContent = 'à¸—à¸³à¸Ÿà¸²à¸§à¸¥à¹Œ';
    
    document.getElementById('score-modal').classList.add('show');
}

function closeScoreModal() {
    document.getElementById('score-modal').classList.remove('show');
    manualScoreCurrentMatch = null;
}

function toggleFoul(playerNum) {
    if (playerNum === 1) {
        p1FoulState = !p1FoulState;
        if (p1FoulState) {
            document.getElementById('p1-score-row').classList.add('foul-state');
            document.getElementById('p1-foul-btn').classList.add('active');
            document.getElementById('p1-foul-btn').textContent = 'à¸Ÿà¸²à¸§à¸¥à¹Œà¹à¸¥à¹‰à¸§';
            if (p2FoulState) toggleFoul(2); 
        } else {
            document.getElementById('p1-score-row').classList.remove('foul-state');
            document.getElementById('p1-foul-btn').classList.remove('active');
            document.getElementById('p1-foul-btn').textContent = 'à¸—à¸³à¸Ÿà¸²à¸§à¸¥à¹Œ';
        }
    } else {
        p2FoulState = !p2FoulState;
        if (p2FoulState) {
            document.getElementById('p2-score-row').classList.add('foul-state');
            document.getElementById('p2-foul-btn').classList.add('active');
            document.getElementById('p2-foul-btn').textContent = 'à¸Ÿà¸²à¸§à¸¥à¹Œà¹à¸¥à¹‰à¸§';
            if (p1FoulState) toggleFoul(1);
        } else {
            document.getElementById('p2-score-row').classList.remove('foul-state');
            document.getElementById('p2-foul-btn').classList.remove('active');
            document.getElementById('p2-foul-btn').textContent = 'à¸—à¸³à¸Ÿà¸²à¸§à¸¥à¹Œ';
        }
    }
}


function submitMatchResult() {
    if (!manualScoreCurrentMatch) return;
    
    let winner = null;
    let loser = null;
    let reason = "";

    const s1 = parseInt(document.getElementById('p1-score-input').value);
    const s2 = parseInt(document.getElementById('p2-score-input').value);
    
    if (!p1FoulState && !p2FoulState && (isNaN(s1) || isNaN(s2))) {
        alert("à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸„à¸°à¹à¸™à¸™à¹ƒà¸«à¹‰à¸„à¸£à¸šà¸—à¸±à¹‰à¸‡ 2 à¸„à¸™ à¸«à¸£à¸·à¸­à¹€à¸¥à¸·à¸­à¸à¸—à¸³à¸Ÿà¸²à¸§à¸¥à¹Œ");
        return;
    }

    if (p1FoulState) {
        winner = manualScoreCurrentMatch.player2;
        loser = manualScoreCurrentMatch.player1;
        reason = `${manualScoreCurrentMatch.player1.name} à¸—à¸³à¸Ÿà¸²à¸§à¸¥à¹Œ`;
    } else if (p2FoulState) {
        winner = manualScoreCurrentMatch.player1;
        loser = manualScoreCurrentMatch.player2;
        reason = `${manualScoreCurrentMatch.player2.name} à¸—à¸³à¸Ÿà¸²à¸§à¸¥à¹Œ`;
    } else {
        if (s1 === s2) {
            alert("à¸„à¸°à¹à¸™à¸™à¹€à¸—à¹ˆà¸²à¸à¸±à¸™! (à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸£à¸­à¸‡à¸£à¸±à¸šà¹€à¸ªà¸¡à¸­) à¸à¸£à¸¸à¸“à¸²à¸•à¸±à¸”à¸ªà¸´à¸™à¹ƒà¸«à¸¡à¹ˆ");
            return;
        }
        
        if (s1 > s2) {
            winner = manualScoreCurrentMatch.player1;
            loser = manualScoreCurrentMatch.player2;
            reason = `à¸Šà¸™à¸°à¸„à¸°à¹à¸™à¸™ ${s1} - ${s2}`;
        } else {
            winner = manualScoreCurrentMatch.player2;
            loser = manualScoreCurrentMatch.player1;
            reason = `à¸Šà¸™à¸°à¸„à¸°à¹à¸™à¸™ ${s2} - ${s1}`;
        }
    }

    if (confirm(`à¸¢à¸·à¸™à¸¢à¸±à¸™à¸œà¸¥à¸à¸²à¸£à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™:\nà¸œà¸¹à¹‰à¸Šà¸™à¸°: ${winner.name}\nà¹€à¸«à¸•à¸¸à¸œà¸¥: ${reason}\n\nà¸„à¸¸à¸“à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ?`)) {
        
        // Derive division from the match itself
        const divisionStr = manualScoreCurrentMatch.division === 'à¸¡.à¸•à¹‰à¸™' ? 'Middle' : 'High';
        
        const payload = {
            action: 'updateScore',
            division: divisionStr,
            matchId: manualScoreCurrentMatch.id,
            p1Score: isNaN(s1) ? 0 : s1,
            p2Score: isNaN(s2) ? 0 : s2,
            p1Foul: p1FoulState,
            p2Foul: p2FoulState,
            winnerId: winner.id,
            token: sessionStorage.getItem('adminToken')
        };

        // UI Feedback
        const submitBtn = document.getElementById('score-submit-btn'); // M6 fix
        if (submitBtn) {
            submitBtn.textContent = 'à¸à¸³à¸¥à¸±à¸‡à¸šà¸±à¸™à¸—à¸¶à¸...';
            submitBtn.disabled = true;
        }

        fetchRPC(payload)
        .then(res => {
            if (!res.ok) throw new Error('Server returned ' + res.status);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                alert(`à¸šà¸±à¸™à¸—à¸¶à¸à¸œà¸¥à¸à¸²à¸£à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™à¸ªà¸³à¹€à¸£à¹‡à¸ˆ!`);
                closeScoreModal();
                // Force fetch new data from backend to update bracket
                if (typeof fetchTournamentData === 'function') {
                    isFetching = false; // reset fetch lock
                    fetchTournamentData().then(() => {
                        renderManualScoreView();
                    });
                }
            } else {
                alert("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + data.message);
            }
        })
        .catch(err => {
            console.error("Error submitting score:", err);
            alert("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¸à¸±à¸šà¹€à¸‹à¸´à¸£à¹Œà¸Ÿà¹€à¸§à¸­à¸£à¹Œ");
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.textContent = 'à¸šà¸±à¸™à¸—à¸¶à¸à¸œà¸¥à¸à¸²à¸£à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™';
                submitBtn.disabled = false;
            }
        });
    }
}

// ==========================================
// Authentication System (Token-based SPA)
// ==========================================
function openLoginModal() {
    document.getElementById('login-modal').classList.add('show');
    document.getElementById('login-modal-overlay').classList.add('show');
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('show');
    document.getElementById('login-modal-overlay').classList.remove('show');
}

async function handleLogin() {
    const passInput = document.getElementById('admin-pass-input');
    const btn = document.getElementById('btn-login-submit');
    const pass = passInput.value;
    if(!pass) return;
    
    btn.textContent = 'à¸à¸³à¸¥à¸±à¸‡à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š...';
    btn.disabled = true;
    try {
        const res = await fetchRPC({ action: 'login', pass: pass });
        const data = await res.json();
        if (data.success) {
            sessionStorage.setItem('adminToken', data.token);
            closeLoginModal();
            passInput.value = '';
            // à¸›à¸¥à¸”à¸¥à¹‡à¸­à¸à¹€à¸¡à¸™à¸¹ Admin
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('admin-only'));
            const loginBtn = document.getElementById('nav-login-btn');
            if(loginBtn) loginBtn.style.display = 'none';
        } else {
            alert('à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡');
        }
    } catch(err) {
        alert('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¹€à¸‹à¸´à¸£à¹Œà¸Ÿà¹€à¸§à¸­à¸£à¹Œ');
    } finally {
        btn.textContent = 'à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š';
        btn.disabled = false;
    }
}

function logout() {
    sessionStorage.removeItem('adminToken');
    window.location.reload();
}

async function verifyAdminToken() {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return;
    
    try {
        const res = await fetchRPC({ action: 'verifyToken', token: token });
        const data = await res.json();
        if (data.success) {
            // à¸›à¸¥à¸”à¸¥à¹‡à¸­à¸à¹€à¸¡à¸™à¸¹ Admin à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´à¸–à¹‰à¸²à¸£à¸«à¸±à¸ªà¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('admin-only'));
            const loginBtn = document.getElementById('nav-login-btn');
            if(loginBtn) loginBtn.style.display = 'none';
        } else {
            // Token à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸
            sessionStorage.removeItem('adminToken');
        }
    } catch(err) {
        console.error('Failed to verify token', err);
    }
}

// à¸£à¸°à¸šà¸šà¸ˆà¸±à¸”à¸à¸²à¸£à¸ªà¸–à¸²à¸™à¸°
        document.addEventListener('DOMContentLoaded', () => {
            try {
                window.viewDivisionStates = JSON.parse(localStorage.getItem('viewDivisionStates')) || {};
            } catch (e) {
                window.viewDivisionStates = {};
            }
            window.currentActiveView = localStorage.getItem('activeView') || 'view-home';
            const savedView = window.currentActiveView;
            window.DIVISION_KEY = window.viewDivisionStates[savedView] || localStorage.getItem('activeDivision') || 'middle';
            
            // à¸‹à¸´à¸‡à¸„à¹Œ UI à¸ªà¸§à¸´à¸•à¸Šà¹Œà¹ƒà¸«à¹‰à¸•à¸£à¸‡à¸à¸±à¸šà¸„à¹ˆà¸²à¸—à¸µà¹ˆà¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸§à¹‰
            const switchBtns = document.querySelectorAll('#header-division-switch button');
            switchBtns.forEach(btn => {
                if ((window.DIVISION_KEY === 'middle' && btn.textContent === 'à¸¡.à¸•à¹‰à¸™') ||
                    (window.DIVISION_KEY === 'high' && btn.textContent === 'à¸¡.à¸›à¸¥à¸²à¸¢')) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // à¹€à¸£à¸µà¸¢à¸à¸Ÿà¸±à¸‡à¸à¹Œà¸Šà¸±à¸™à¹€à¸£à¸´à¹ˆà¸¡à¸•à¹‰à¸™à¸ˆà¸²à¸ script.html
            if (typeof initTournamentBoard === 'function') {
                initTournamentBoard();
            } else if (typeof setupMobileUX === 'function') {
                setupMobileUX();
                if (typeof setupZoom === 'function') setupZoom();
            }
            
            // à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸„à¸£à¸±à¹‰à¸‡à¹à¸£à¸
            if (typeof fetchTournamentData === 'function') {
                fetchTournamentData();
                // à¸›à¸´à¸”à¸à¸²à¸£à¸­à¸±à¸›à¹€à¸”à¸•à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´ 10 à¸§à¸´à¸™à¸²à¸—à¸µ à¹€à¸žà¸·à¹ˆà¸­à¸¥à¸”à¸ à¸²à¸£à¸°à¸‚à¸­à¸‡ Database à¹à¸¥à¸°à¸¥à¸”à¹‚à¸­à¸à¸²à¸ª GAS à¸¥à¹ˆà¸¡
                
            }
            
            // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š Token à¹€à¸¡à¸·à¹ˆà¸­à¹‚à¸«à¸¥à¸”à¸«à¸™à¹‰à¸²à¹€à¸§à¹‡à¸š
            
            
            // à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¹„à¸›à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸§à¹‰
            switchView(savedView);
        });

        // à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­? (SPA Navigation)
        function switchView(viewId) {
            // à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­ (à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­?????????? admin/public)
            if (!document.getElementById(viewId)) {
                viewId = 'view-home';
            }
            
            // à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­????? localStorage
            localStorage.setItem('activeView', viewId);
            window.currentActiveView = viewId;
            
            // ???????????
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            // à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­?????????
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            
            // à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­?
            document.getElementById(viewId).classList.add('active');
            
            // ????/???? Switch à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­????????????? (???? ?????????????, à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­?)
            const switchableViews = ['view-tournaments', 'view-results', 'view-manual-score', 'view-assignment'];
            if (switchableViews.includes(viewId)) {
                document.getElementById('header-division-switch').style.display = 'flex';
                
                // Read and apply division for this view
                window.DIVISION_KEY = window.viewDivisionStates[viewId] || localStorage.getItem('activeDivision') || 'middle';
                const switchBtns = document.querySelectorAll('#header-division-switch button');
                switchBtns.forEach(btn => {
                    if ((window.DIVISION_KEY === 'middle' && btn.textContent === 'à¸¡.à¸•à¹‰à¸™') ||
                        (window.DIVISION_KEY === 'high' && btn.textContent === 'à¸¡.à¸›à¸¥à¸²à¸¢')) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            } else {
                document.getElementById('header-division-switch').style.display = 'none';
            }
            
            if (viewId === 'view-assignment') {
                document.getElementById('header-auto-assign').style.display = 'flex';
            } else {
                document.getElementById('header-auto-assign').style.display = 'none';
            }
            
            
            // à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­???
            const activeNav = document.querySelector(`.nav-item[data-target="${viewId}"]`);
            if (activeNav) {
                activeNav.classList.add('active');
                // ?????? Title ??????????
                document.getElementById('current-page-title').textContent = activeNav.textContent.trim();
            }
            
            // à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­à¸£à¸­à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­?????????
            if (viewId === 'view-tournaments' && typeof updateZoom === 'function') {
                setTimeout(updateZoom, 50);
            }
            
            // à¸–à¹‰à¸²à¹€à¸¥à¸·à¸­à¸à¹€à¸¡à¸™à¸¹à¸ˆà¸±à¸”à¹‚à¸•à¹Šà¸° à¹ƒà¸«à¹‰à¸”à¸¶à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸¡à¸²à¹à¸ªà¸”à¸‡à¹ƒà¸«à¸¡à¹ˆ
            if (viewId === 'view-assignment' && typeof renderAssignmentView === 'function') {
                renderAssignmentView();
            }

            if (viewId === 'view-manual-score' && typeof renderManualScoreView === 'function') {
                renderManualScoreView();
            }

            // Trigger specific rendering based on view
            if (viewId === 'view-announcer') {
                if (typeof renderAnnouncerView === 'function') {
                    renderAnnouncerView();
                }
            }
            
            // à¸›à¸´à¸” Sidebar à¸šà¸™à¸¡à¸·à¸­à¸–à¸·à¸­à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('show');
                document.getElementById('sidebarOverlay').classList.remove('show');
            }
        }

        // ????????????/??? Sidebar ????????
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('show');
            document.getElementById('sidebarOverlay').classList.toggle('show');
        }

        // à¸ªà¸¥à¸±à¸šà¸£à¸°à¸”à¸±à¸šà¸Šà¸±à¹‰à¸™ (à¸¡.à¸•à¹‰à¸™ / à¸¡.à¸›à¸¥à¸²à¸¢)
        function toggleDivision(division, btnElement) {
            const switchContainer = btnElement.parentElement;
            switchContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            btnElement.classList.add('active');

            window.DIVISION_KEY = division;
            localStorage.setItem('activeDivision', division);
            
            const activeView = window.currentActiveView;
            window.viewDivisionStates[activeView] = division;
            localStorage.setItem('viewDivisionStates', JSON.stringify(window.viewDivisionStates));
            
            // à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸²à¸à¸—à¸µà¹ˆà¹à¸„à¸Šà¹„à¸§à¹‰à¹€à¸šà¸·à¹‰à¸­à¸‡à¸«à¸¥à¸±à¸‡à¸—à¸±à¸™à¸—à¸µ (à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸£à¸­à¹‚à¸«à¸¥à¸”à¸ˆà¸²à¸à¹€à¸‹à¸´à¸£à¹Œà¸Ÿà¹€à¸§à¸­à¸£à¹Œà¹ƒà¸«à¸¡à¹ˆ)
            if (window.tournamentAllData && window.tournamentAllData[division]) {
                if (typeof renderTournament === 'function') {
                    renderTournament(window.tournamentAllData[division]);
                }
                
                if (activeView === 'view-results' && typeof renderResults === 'function') {
                    renderResults(window.tournamentAllData[division]);
                }
                if (activeView === 'view-assignment' && typeof renderAssignmentView === 'function') {
                    renderAssignmentView();
                }
                if (activeView === 'view-manual-score' && typeof renderManualScoreView === 'function') {
                    renderManualScoreView();
                }
            } else {
                if (typeof fetchTournamentData === 'function') {
                    fetchTournamentData();
                }
            }
        }

// ==========================================
// GITHUB PAGES OVERRIDE LOGIC
// ==========================================

async function fetchTournamentData() {
    try {
        const response = await fetch('data.json?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            window.tournamentAllData = data;
            
            const lastUpdateEl = document.getElementById('last-update');
            if (lastUpdateEl && data.last_update) {
                const d = new Date(data.last_update);
                lastUpdateEl.textContent = 'à¸­à¸±à¸›à¹€à¸”à¸•à¸¥à¹ˆà¸²à¸ªà¸¸à¸”: ' + d.toLocaleTimeString('th-TH');
            }
            
            const currentDiv = window.DIVISION_KEY || 'middle';
            if (window.tournamentAllData[currentDiv]) {
                if (typeof renderTournament === 'function' && window.currentActiveView === 'view-tournaments') {
                    renderTournament(window.tournamentAllData[currentDiv]);
                }
                if (typeof renderResults === 'function' && window.currentActiveView === 'view-results') {
                    renderResults(window.tournamentAllData[currentDiv]);
                }
                if (typeof renderAnnouncerView === 'function' && window.currentActiveView === 'view-announcer') {
                    renderAnnouncerView();
                }
            }
        }
    } catch (e) {
        console.error('Error fetching data:', e);
    }
}

// Auto refresh every 30 seconds
setInterval(fetchTournamentData, 30000);

// Disable admin features
function verifyAdminToken() { }
function openLoginModal() { alert('à¸ªà¹ˆà¸§à¸™à¸™à¸µà¹‰à¸ªà¸³à¸«à¸£à¸±à¸šà¸œà¸¹à¹‰à¸Šà¸¡ à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸– Login à¹„à¸”à¹‰à¸„à¸£à¸±à¸š'); }
function assignTable() { }
function updateScore() { }