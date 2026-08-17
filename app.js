let isZoomedOut = true;
let isFetching = false;

// Helper: winner อาจเป็น Object {id, name} หรือ String ID
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
async function fetchRPC(payload) { console.warn('fetchRPC disabled'); return {ok:false}; }

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
        trophy.innerHTML = '🏆<div class="trophy-glow"></div>';
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
        thirdTitle.textContent = 'ชิงอันดับ 3';
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
    const player1 = match.player1 || { id: 'TBA', name: 'รอผู้ชนะจากรอบก่อนหน้า', school: '' };
    const player2 = match.player2 || { id: 'TBA', name: 'รอผู้ชนะจากรอบก่อนหน้า', school: '' };
    
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';
    
    // Match ID badge
    const badge = document.createElement('div');
    badge.className = 'match-id';
    badge.textContent = match.id;
    matchDiv.appendChild(badge);
    
    const p1Div = createPlayerElement(player1, match, 1);
    const p2Div = createPlayerElement(player2, match, 2);
    
    matchDiv.appendChild(p1Div);
    matchDiv.appendChild(p2Div);
    
    // Highlight if match has a winner
    const wId = getWinnerId(match.winner);
    if (wId) {
        if (wId === player1.id) {
            p1Div.classList.add('winner');
            p2Div.classList.add('loser');
            matchDiv.classList.add('completed');
        } else if (wId === player2.id) {
            p2Div.classList.add('winner');
            p1Div.classList.add('loser');
            matchDiv.classList.add('completed');
        }
    }
    
    // Add click event for details
    matchDiv.onclick = () => showMatchDetails(match);
    
    return matchDiv;
}

function createPlayerElement(player, match, pNum) {
    const pDiv = document.createElement('div');
    pDiv.className = 'player';
    
    const wId = getWinnerId(match.winner);
    if (wId === player.id && wId !== 'TBA') {
        pDiv.classList.add('winner');
    }

    const isTBA = !player.id || /^[AB]\d+$/.test(player.id) === false && player.name === 'รอผู้ชนะจากรอบก่อนหน้า';
    
    let avatarHtml = `<div class="player-avatar"><i class="fas fa-user"></i></div>`;
    if (!isTBA) {
        avatarHtml = `<div class="player-avatar" style="background-color: var(--primary); color: white;"><i class="fas fa-user"></i></div>`;
    }

    // Default to show name, but if we need ID primarily in small views:
    const mainText = isTBA ? player.name : player.id;
    const subText = isTBA ? '' : player.name;

    pDiv.innerHTML = `
        ${avatarHtml}
        <div class="player-info">
            <span class="player-name">${mainText}</span>
            ${subText ? `<span class="player-school">${subText}</span>` : ''}
        </div>
        <div class="player-score">${pNum === 1 ? (match.score1 || '') : (match.score2 || '')}</div>
    `;
    return pDiv;
}

function showMatchDetails(match) {
    document.getElementById('modal-match-title').textContent = `Match ${match.id} Details`;
    
    const player1 = match.player1 || { id: '-', name: 'TBA', school: '-' };
    const player2 = match.player2 || { id: '-', name: 'TBA', school: '-' };

    document.getElementById('modal-p1-id').textContent = player1.id || '-';
    document.getElementById('modal-p1-name').textContent = player1.name || 'TBA';
    document.getElementById('modal-p1-school').textContent = player1.school || '';

    document.getElementById('modal-p2-id').textContent = player2.id || '-';
    document.getElementById('modal-p2-name').textContent = player2.name || 'TBA';
    document.getElementById('modal-p2-school').textContent = player2.school || '';

    document.getElementById('match-modal-overlay').classList.add('show');
    document.getElementById('match-modal').classList.add('show');
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('match-modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            overlay.classList.remove('show');
            document.getElementById('match-modal').classList.remove('show');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('match-modal-overlay').classList.remove('show');
            document.getElementById('match-modal').classList.remove('show');
        });
    }
});

// Zoom and Pan Logic
let zoomLevel = 1;
const zoomStep = 0.1;
const minZoom = 0.3;
const maxZoom = 2.0;

function setupZoom() {
    const board = document.getElementById('tournament-board');
    if (!board) return;
    
    // No drag variables anymore, relying on native scroll
    // Just handling mouse wheel for zoom
    
    board.parentElement.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = Math.sign(e.deltaY);
            if (delta > 0) zoomOut();
            else zoomIn();
        }
    }, { passive: false });
}

function zoomIn() {
    if (zoomLevel < maxZoom) {
        zoomLevel += zoomStep;
        updateZoom();
    }
}

function zoomOut() {
    if (zoomLevel > minZoom) {
        zoomLevel -= zoomStep;
        updateZoom();
    }
}

function resetZoom() {
    zoomLevel = 1;
    updateZoom();
}

function updateZoom() {
    const board = document.getElementById('tournament-board');
    if (board) {
        board.style.transform = `scale(${zoomLevel})`;
        
        const wrapper = board.parentElement;
        const rect = board.getBoundingClientRect();
        
        // Ensure the wrapper expands to fit the scaled board so scrollbars appear correctly
        // Only adjust wrapper if board is smaller than wrapper
        
        board.style.transformOrigin = "top center";
        
        // Optionally update a zoom label if you add one to UI
        const label = document.getElementById('zoom-level-label');
        if (label) label.textContent = Math.round(zoomLevel * 100) + '%';
    }
}

function setupMobileUX() {
    // Zoom out by default on mobile
    if (window.innerWidth < 768) {
        zoomLevel = 0.5;
        updateZoom();
    }
}

// ==========================================
// Results View Logic
// ==========================================
function renderResults(data) {
    const tableBody = document.getElementById('results-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    let allMatches = [];
    
    const extractMatches = (bracket) => {
        if (!bracket) return;
        bracket.forEach((round, roundIndex) => {
            round.forEach(match => {
                if (match.winner) {
                    allMatches.push({...match, roundName: \`Round \${roundIndex + 1}\`});
                }
            });
        });
    };
    
    extractMatches(data.bracketA);
    extractMatches(data.bracketB);
    
    if (data.finalMatch && data.finalMatch.winner) {
        allMatches.push({...data.finalMatch, roundName: 'Final'});
    }
    if (data.thirdPlaceMatch && data.thirdPlaceMatch.winner) {
        allMatches.push({...data.thirdPlaceMatch, roundName: '3rd Place'});
    }
    
    // Sort by Match ID
    allMatches.sort((a, b) => {
        // basic string sort based on ID (e.g. A1, A2... B1, B2)
        return a.id.localeCompare(b.id, 'en', { numeric: true });
    });
    
    if (allMatches.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--gray);">ยังไม่มีผลการแข่งขัน</td></tr>';
        return;
    }
    
    allMatches.forEach(match => {
        const tr = document.createElement('tr');
        
        const wId = getWinnerId(match.winner);
        const p1Win = wId === (match.player1 ? match.player1.id : null);
        const p2Win = wId === (match.player2 ? match.player2.id : null);
        
        tr.innerHTML = \`
            <td><strong>\${match.id}</strong></td>
            <td>\${match.roundName}</td>
            <td class="\${p1Win ? 'winner-cell' : 'loser-cell'}">
                \${match.player1 ? match.player1.id + ' ' + (match.player1.name || '') : '-'}
            </td>
            <td class="\${p2Win ? 'winner-cell' : 'loser-cell'}">
                \${match.player2 ? match.player2.id + ' ' + (match.player2.name || '') : '-'}
            </td>
            <td style="text-align:center; font-weight:bold;">
                \${match.score1 || 0} - \${match.score2 || 0}
            </td>
        \`;
        tableBody.appendChild(tr);
    });
}

// ==========================================
// Admin & Setup Logic
// ==========================================
function extractMatchesForDivision(divisionData, divName) {
    let pendingA = [];
    let pendingB = [];
    let assignedA = [];
    let assignedB = [];
    
    if (!divisionData) return { pending: { A: [], B: [] }, assigned: { A: [], B: [] } };
    
    const processRound = (round, bracketName, roundNum) => {
        round.forEach(match => {
            // Ignore if match is already won, or doesn't have 2 actual players
            if (match.winner) return;
            
            // Check if players are real (not BYE, not waiting)
            const isValidPlayer = (p) => p && p.id && p.id !== "BYE" && p.id !== "TBA" && !p.id.includes("Winner");
            
            // In setup view, we want to see matches that might have TBA but are structurally there.
            // But usually, we only announce when players are known.
            
            const matchInfo = {
                ...match,
                division: divName,
                bracketName: bracketName,
                roundInfo: \`รอบที่ \${roundNum + 1}\`
            };
            
            const isAssigned = match.table !== undefined && match.table !== null && match.table !== "";
            
            if (isAssigned) {
                if (bracketName === 'A') assignedA.push(matchInfo);
                else assignedB.push(matchInfo);
            } else {
                if (bracketName === 'A') pendingA.push(matchInfo);
                else pendingB.push(matchInfo);
            }
        });
    };

    if (divisionData.bracketA) {
        divisionData.bracketA.forEach((r, i) => processRound(r, 'A', i));
    }
    if (divisionData.bracketB) {
        divisionData.bracketB.forEach((r, i) => processRound(r, 'B', i));
    }
    
    // Add Finals
    const processFinal = (match, bracketName, roundInfo) => {
        if (!match || match.winner) return;
        const matchInfo = {
            ...match,
            division: divName,
            bracketName: bracketName,
            roundInfo: roundInfo
        };
        const isAssigned = match.table !== undefined && match.table !== null && match.table !== "";
        if (isAssigned) assignedA.push(matchInfo);
        else pendingA.push(matchInfo);
    };
    
    processFinal(divisionData.finalMatch, 'Finals', 'ชิงชนะเลิศ');
    processFinal(divisionData.thirdPlaceMatch, 'Finals', 'ชิงอันดับ 3');

    return { 
        pending: { A: pendingA, B: pendingB },
        assigned: { A: assignedA, B: assignedB }
    };
}

let selectedMatchTables = new Map(); // key: backendId (M/H + matchId), value: tableNumber

// Find reference to the original match object in the global data structure
function findOriginalMatch(matchId, divisionName) {
    if (!window.tournamentAllData) return null;
    const divData = divisionName === 'ม.ต้น' ? window.tournamentAllData.middle : window.tournamentAllData.high;
    if (!divData) return null;
    
    let found = null;
    const searchBracket = (bracket) => {
        if(!bracket) return;
        bracket.forEach(r => r.forEach(m => {
            if (m.id === matchId) found = m;
        }));
    };
    
    searchBracket(divData.bracketA);
    if(found) return found;
    searchBracket(divData.bracketB);
    if(found) return found;
    
    if (divData.finalMatch && divData.finalMatch.id === matchId) return divData.finalMatch;
    if (divData.thirdPlaceMatch && divData.thirdPlaceMatch.id === matchId) return divData.thirdPlaceMatch;
    
    return null;
}

function selectPendingMatch(matchId, divisionName) {
    const setupTablesInput = document.getElementById('setup-tables');
    let totalTables = setupTablesInput ? parseInt(setupTablesInput.value) || 7 : 7;
    
    // Check currently occupied tables across BOTH divisions directly from global state
    const occupiedTables = new Set();
    
    const checkOccupied = (data) => {
        if(!data) return;
        const checkMatch = (m) => {
            if (m && m.table && !m.winner) {
                occupiedTables.add(parseInt(m.table));
            }
        };
        ['bracketA', 'bracketB'].forEach(k => {
            if(data[k]) data[k].forEach(r => r.forEach(checkMatch));
        });
        checkMatch(data.finalMatch);
        checkMatch(data.thirdPlaceMatch);
    };
    
    checkOccupied(window.tournamentAllData.middle);
    checkOccupied(window.tournamentAllData.high);
    
    // Add locally selected tables that haven't been saved yet
    for (let t of selectedMatchTables.values()) {
        occupiedTables.add(parseInt(t));
    }
    
    const prefix = divisionName === 'ม.ต้น' ? 'M' : 'H';
    const backendId = prefix + matchId;

    if (selectedMatchTables.has(backendId)) {
        // Deselect
        selectedMatchTables.delete(backendId);
    } else {
        // Assign first available table
        let assigned = false;
        for (let i = 1; i <= totalTables; i++) {
            if (!occupiedTables.has(i)) {
                selectedMatchTables.set(backendId, i);
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            alert(\`โต๊ะเต็ม! (มีการใช้โต๊ะครบ \${totalTables} โต๊ะแล้ว)\`);
            return;
        }
    }
    
    renderAssignmentView();
}

function renderAssignmentView() {
    const gridDiv = document.getElementById('assignment-grid');
    if (!gridDiv) return;
    gridDiv.innerHTML = '';
    
    if (!window.tournamentAllData) return;
    
    const midMatches = extractMatchesForDivision(window.tournamentAllData.middle, 'ม.ต้น');
    const highMatches = extractMatchesForDivision(window.tournamentAllData.high, 'ม.ปลาย');
    
    const midAllPending = [...midMatches.pending.A, ...midMatches.pending.B];
    const highAllPending = [...highMatches.pending.A, ...highMatches.pending.B];
    
    const dataByCol = [
        { title: 'ม.ต้น (รอแข่ง)', id: 'col-mid', div: 'ม.ต้น', matches: midAllPending },
        { title: 'ม.ปลาย (รอแข่ง)', id: 'col-high', div: 'ม.ปลาย', matches: highAllPending }
    ];
    
    // Collect all unique round names to align them horizontally
    const allRoundsSet = new Set();
    dataByCol.forEach(col => col.matches.forEach(m => allRoundsSet.add(m.roundInfo || 'รอบอื่นๆ')));
    
    // Sort rounds safely
    const roundsArray = Array.from(allRoundsSet).sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, '')) || 99;
        const numB = parseInt(b.replace(/[^0-9]/g, '')) || 99;
        return numA - numB;
    });
    
    // Map to keep track of section elements by round to equalize their heights later
    const roundElementsMap = {};
    roundsArray.forEach(r => roundElementsMap[r] = []);
    
    dataByCol.forEach(colData => {
        const colDiv = document.createElement('div');
        colDiv.className = 'assignment-column';
        colDiv.id = colData.id;
        
        // Header
        const colHeader = document.createElement('h3');
        colHeader.className = 'assignment-col-header';
        colHeader.textContent = colData.title;
        colHeader.style.color = colData.div === 'ม.ปลาย' ? '#28a745' : 'var(--primary)';
        colDiv.appendChild(colHeader);
        
        gridDiv.appendChild(colDiv);
    });
    
    // Build round sections inside each column
    roundsArray.forEach(roundName => {
        dataByCol.forEach(colData => {
            const colDiv = document.getElementById(colData.id);
            if (!colDiv) return;
            
            const roundSection = document.createElement('div');
            roundSection.className = 'round-sync-section';
            roundSection.style.marginBottom = '0'; // Let the pending cards dictate bottom margin
            
            // Header for this round inside the column
            const roundHeader = document.createElement('h4');
            roundHeader.textContent = roundName;
            roundHeader.style.color = '#6c757d';
            roundHeader.style.fontSize = '0.9rem';
            roundHeader.style.margin = '15px 0 10px 0';
            roundHeader.style.borderBottom = '1px solid #e9ecef';
            roundHeader.style.paddingBottom = '5px';
            roundSection.appendChild(roundHeader);
            
            const matchesForRound = colData.matches.filter(m => (m.roundInfo || 'รอบอื่นๆ') === roundName);
            
            if (matchesForRound.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.textContent = '-';
                emptyMsg.style.textAlign = 'center';
                emptyMsg.style.color = '#adb5bd';
                emptyMsg.style.fontSize = '0.85rem';
                emptyMsg.style.padding = '10px 0';
                emptyMsg.style.marginBottom = '10px';
                roundSection.appendChild(emptyMsg);
            } else {
                matchesForRound.forEach(match => {
                    const prefix = colData.div === 'ม.ต้น' ? 'M' : 'H';
                    const backendId = prefix + match.id;
                    
                    const isAnnounced = (match.table !== undefined && match.table !== null && match.table !== "");
                    const isSelected = selectedMatchTables.has(backendId);
                    const tableNumber = isSelected ? selectedMatchTables.get(backendId) : null;
                    
                    const isTbaPlayer = (p) => (!p.id || !/^[AB]\d+$/.test(p.id)) && (!p.name || p.name === '-' || p.name === 'รอยืนยันรายชื่อ' || p.name === 'รอผู้ชนะจากรอบก่อนหน้า');
                    
                    const p1IsTba = isTbaPlayer(match.player1);
                    const p2IsTba = isTbaPlayer(match.player2);
                    const hasTba = p1IsTba || p2IsTba;
                    
                    const p1Display = p1IsTba ? 'TBA' : match.player1.id;
                    const p2Display = p2IsTba ? 'TBA' : match.player2.id;
                    
                    const card = document.createElement('div');
                    
                    if (isAnnounced) {
                        card.className = 'pending-card';
                        card.style.opacity = '0.5';
                        card.style.cursor = 'not-allowed';
                        card.style.background = '#e9ecef';
                        
                        let assignedText = 'จัดโต๊ะแล้ว';
                        if (!isNaN(parseInt(match.table))) {
                           assignedText = 'โต๊ะ ' + match.table;
                        }
                        
                        card.innerHTML = \`
                            <div class="pending-card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ced4da; padding-bottom: 8px; margin-bottom: 10px;">
                                <span style="font-weight: 800; color: #6c757d; font-size: 0.9rem;">\${match.id}</span>
                                <span style="font-size: 0.8rem; font-weight: bold; color: #6c757d;">
                                    \${assignedText}
                                </span>
                            </div>
                            <div style="display: flex; flex-direction: row; align-items: center; justify-content: center;">
                                <div class="pending-card-players" style="display: flex; align-items: center; flex-direction: row; font-size: 1.1rem; font-weight: 800; color: #6c757d; margin: 0;">
                                    <div style="\${p1IsTba ? 'color: #dc3545;' : ''}">\${p1Display}</div>
                                    <div class="pending-card-vs" style="margin: 0 15px; font-size: 0.8rem; color: #adb5bd;">VS</div>
                                    <div style="\${p2IsTba ? 'color: #dc3545;' : ''}">\${p2Display}</div>
                                </div>
                            </div>
                        \`;
                    } else {
                        card.className = \`pending-card \${isSelected ? 'selected' : ''}\`;
                        card.onclick = () => selectPendingMatch(match.id, colData.div);
                        
                        if (hasTba) {
                            card.style.background = '#fff5f5';
                            card.style.borderColor = '#ffcaca';
                        }
                        
                        card.innerHTML = \`
                            <div class="pending-card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid \${hasTba ? '#ffcaca' : '#f1f3f5'}; padding-bottom: 8px; margin-bottom: 10px;">
                                <span style="font-weight: 800; color: \${hasTba ? '#dc3545' : 'var(--primary)'}; font-size: 0.9rem;">\${match.id}</span>
                                <span style="font-size: 0.8rem; font-weight: bold; color: \${isSelected ? 'var(--primary)' : '#ced4da'};">
                                    \${isSelected ? 'โต๊ะ ' + tableNumber : '<i class="fas fa-check-circle check-icon" style="opacity:0;"></i>'}
                                </span>
                            </div>
                            <div style="display: flex; flex-direction: row; align-items: center; justify-content: center;">
                                <div class="pending-card-players" style="display: flex; align-items: center; flex-direction: row; font-size: 1.1rem; font-weight: 800; color: #2b2d42; margin: 0;">
                                    <div style="\${p1IsTba ? 'color: #dc3545;' : ''}">\${p1Display}</div>
                                    <div class="pending-card-vs" style="margin: 0 15px; font-size: 0.8rem; color: #adb5bd;">VS</div>
                                    <div style="\${p2IsTba ? 'color: #dc3545;' : ''}">\${p2Display}</div>
                                </div>
                            </div>
                        \`;
                    }
                    roundSection.appendChild(card);
                });
            }
            
            colDiv.appendChild(roundSection);
            roundElementsMap[roundName].push(roundSection);
        });
    });
    
    // Sync heights after a brief timeout to let DOM render
    setTimeout(() => {
        roundsArray.forEach(roundName => {
            const elements = roundElementsMap[roundName];
            let maxHeight = 0;
            elements.forEach(el => {
                if (el.offsetHeight > maxHeight) {
                    maxHeight = el.offsetHeight;
                }
            });
            if (maxHeight > 0) {
                elements.forEach(el => {
                    el.style.minHeight = maxHeight + 'px';
                });
            }
        });
    }, 0);
}

function saveAssignmentToDB() {
    if (!window.tournamentAllData || selectedMatchTables.size === 0) {
        alert("กรุณาเลือกคู่แข่งขันที่ต้องการประกาศเรียกตัวจากคิว (Pending)");
        return;
    }
    
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
        alert("คุณไม่มีสิทธิ์ใช้งานส่วนนี้ (กรุณาเข้าสู่ระบบ)");
        return;
    }
    
    const updatesMiddle = [];
    const updatesHigh = [];
    
    // Process all selected IDs
    for (const [backendId, tableNo] of selectedMatchTables.entries()) {
        const isMiddle = backendId.startsWith('M');
        const division = isMiddle ? 'ม.ต้น' : 'ม.ปลาย';
        const matchId = backendId.substring(1);
        
        const updateObj = { matchId: matchId, table: tableNo, announced: false }; 
        
        if (isMiddle) {
            updatesMiddle.push(updateObj);
        } else {
            updatesHigh.push(updateObj);
        }
        
        const original = findOriginalMatch(matchId, division);
        if (original) {
            original.table = tableNo;
            original.isAnnounced = false;
        }
    }
    
    // Optimistic UI update
    selectedMatchTables.clear();
    renderAssignmentView();
    renderAnnouncerView();
    
    // Send to backend
    const sendUpdates = async () => {
        if (updatesMiddle.length > 0) {
            await fetchRPC({
                    action: 'saveAnnouncements',
                    token: token,
                    division: 'ม.ต้น',
                    updates: updatesMiddle
                });
        }
        if (updatesHigh.length > 0) {
            await fetchRPC({
                    action: 'saveAnnouncements',
                    token: token,
                    division: 'ม.ปลาย',
                    updates: updatesHigh
                });
        }
    };
    
    sendUpdates().then(() => {
        alert("ส่งข้อมูลไปที่หน้าระบบประกาศเรียกตัวสำเร็จ (ข้อมูลถูกซิงค์ไปยังเซิร์ฟเวอร์แล้ว)");
    }).catch(err => {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการซิงค์ข้อมูลกับเซิร์ฟเวอร์");
    });
}

function renderAnnouncerView() {
    const listDiv = document.getElementById('announcement-list');
    if (!listDiv) return;

    if (!window.tournamentAllData) return;
    const midMatches = extractMatchesForDivision(window.tournamentAllData.middle, 'ม.ต้น');
    const highMatches = extractMatchesForDivision(window.tournamentAllData.high, 'ม.ปลาย');
    
    // Combine all assigned matches
    const allAssigned = [
        ...midMatches.assigned.A, ...midMatches.assigned.B,
        ...highMatches.assigned.A, ...highMatches.assigned.B
    ];
    
    if (allAssigned.length === 0) {
        listDiv.innerHTML = '<div id="empty-announcement" style="text-align: center; color: var(--gray); padding: 40px 0; font-size: 0.9rem;">ยังไม่มีประกาศเรียกตัว</div>';
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
        
        const p1Name = match.player1.name && match.player1.name !== "ไม่มีชื่อ" ? match.player1.name : (match.player1.id || '-');
        const p2Name = match.player2.name && match.player2.name !== "ไม่มีชื่อ" ? match.player2.name : (match.player2.id || '-');
        
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
        if (match.division === 'ม.ปลาย') {
            labelColor = '#28a745'; // Green for High School
        }
        const bgColor = match.isAnnounced ? 'var(--gray)' : labelColor;
        
        card.innerHTML = \`
            <div onclick="toggleAnnounceStatus('\${match.id}', '\${match.division}', this, '\${labelColor}')" data-clicked="\${isAnnouncedStr}" style="background-color: \${bgColor}; color: white; width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-right: 15px; flex-shrink: 0; cursor: pointer; transition: 0.2s;" title="คลิกเพื่อทำเครื่องหมายว่าเรียกแล้ว/ยกเลิกเรียก">
                <i class="fas fa-bullhorn"></i>
            </div>
            <div style="flex-grow: 1;">
                <div style="font-weight: bold; color: \${labelColor}; margin-bottom: 5px;">\${match.id} <span style="color: var(--gray); font-weight: normal; font-size: 0.85rem; margin-left: 10px;">(โต๊ะ \${match.table} | \${match.division} - \${match.roundInfo})</span></div>
                <div style="font-size: 0.95rem;">
                    <span style="font-weight: 600;">\${match.player1.id}</span> \${p1Name} 
                    <span style="color: #adb5bd; margin: 0 10px; font-size: 0.8rem;">VS</span> 
                    <span style="font-weight: 600;">\${match.player2.id}</span> \${p2Name}
                </div>
            </div>
        \`;
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
              alert("บันทึกไม่สำเร็จ: " + (result.message || 'ข้อผิดพลาดไม่ทราบสาเหตุ'));
          } else {
              // Update local state so it doesn't revert on next render if we don't fetch
              let original = findOriginalMatch(matchId, divisionName);
              if (original) original.isAnnounced = newState;
          }
      })
      .catch(err => {
          btnElement.style.opacity = '1';
          console.error(err);
          alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
    
    const midMatches = extractMatchesForDivision(window.tournamentAllData.middle, 'ม.ต้น');
    const highMatches = extractMatchesForDivision(window.tournamentAllData.high, 'ม.ปลาย');
    
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
        alert(\`จัดโต๊ะอัตโนมัติสำเร็จ จำนวน \${assignCount} คู่\`);
        renderAssignmentView();
    } else {
        alert("ไม่มีคู่ที่พร้อมแข่ง หรือ โต๊ะเต็มหมดแล้ว");
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
                    bracket: bracketKey === 'bracketA' ? 'สาย A' : 'สาย B',
                    roundInfo: \`รอบที่ \${roundIndex + 1}\`
                });
            });
        });
    });
    if (data.finalMatch) matches.push({...data.finalMatch, division: divisionName, bracket: 'ชิงชนะเลิศ', roundInfo: 'รอบชิงชนะเลิศ'});
    if (data.thirdPlaceMatch) matches.push({...data.thirdPlaceMatch, division: divisionName, bracket: 'ชิงอันดับ 3', roundInfo: 'ชิงอันดับ 3'});
    
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
    const midMatches = getAllMatchesFlat(window.tournamentAllData.middle, 'ม.ต้น');
    const highMatches = getAllMatchesFlat(window.tournamentAllData.high, 'ม.ปลาย');
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
    topSection.innerHTML = '<h3 style="color: var(--primary); margin-bottom: 15px;"><i class="fas fa-table"></i> โต๊ะที่กำลังแข่งขัน (รอลงคะแนน)</h3>';
    
    if (activeMatches.length === 0) {
        topSection.innerHTML += '<div style="text-align: center; color: var(--gray); padding: 20px 0;">ไม่มีโต๊ะที่กำลังแข่งขันในขณะนี้</div>';
    } else {
        activeMatches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'admin-match-card';
            card.onclick = () => openScoreModal(match);
            
            const tableStr = \`(โต๊ะ \${match.table})\`;
            const isHigh = match.division === 'ม.ปลาย';
            const badgeColor = isHigh ? '#28a745' : 'var(--primary)';
            
            card.innerHTML = \`
                <div class="admin-match-header">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="admin-match-badge" style="background-color: \${badgeColor};">\${match.id}</span>
                        <span style="font-size: 0.85rem; font-weight: bold; color: \${badgeColor}; border: 1px solid \${badgeColor}; padding: 2px 6px; border-radius: 4px;">\${match.division}</span>
                    </div>
                    <span>\${match.bracket} - \${match.roundInfo} <strong style="color:var(--primary);">\${tableStr}</strong></span>
                </div>
                <div class="admin-player-row">
                    <span class="admin-player-id">\${match.player1.id}</span>
                    <span class="admin-player-name">\${match.player1.name}</span>
                </div>
                <div class="admin-vs-divider">VS</div>
                <div class="admin-player-row">
                    <span class="admin-player-id">\${match.player2.id}</span>
                    <span class="admin-player-name">\${match.player2.name}</span>
                </div>
            \`;
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
    const currentDivisionName = window.DIVISION_KEY === 'middle' ? 'ม.ต้น' : 'ม.ปลาย';
    const completedMatches = (window.DIVISION_KEY === 'middle' ? midMatches : highMatches).filter(m => m.winner);
    
    // Sort Bottom Section: by Match_ID
    completedMatches.sort((a, b) => {
        return a.id.localeCompare(b.id, 'en', { numeric: true });
    });
    
    const bottomSection = document.createElement('div');
    bottomSection.innerHTML = \`<h3 style="color: #28a745; margin-bottom: 15px;"><i class="fas fa-check-circle"></i> ลงคะแนนสมบูรณ์ (\${currentDivisionName})</h3>\`;
    
    if (completedMatches.length === 0) {
        bottomSection.innerHTML += '<div style="text-align: center; color: var(--gray); padding: 20px 0;">ยังไม่มีการแข่งขันที่ลงคะแนนเสร็จสิ้น</div>';
    } else {
        completedMatches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'admin-match-card';
            card.style.opacity = '0.8'; // slightly dim completed matches
            card.onclick = () => openScoreModal(match);
            
            const tableStr = match.table ? \`(โต๊ะ \${match.table})\` : '';
            const isHigh = match.division === 'ม.ปลาย';
            const badgeColor = isHigh ? '#28a745' : 'var(--primary)';
            
            card.innerHTML = \`
                <div class="admin-match-header">
                    <span class="admin-match-badge" style="background-color: #6c757d;">\${match.id}</span>
                    <span>\${match.bracket} - \${match.roundInfo} <strong style="color:var(--gray);">\${tableStr}</strong></span>
                </div>
                <div class="admin-player-row">
                    <span class="admin-player-id">\${match.player1.id}</span>
                    <span class="admin-player-name">\${match.player1.name} <span style="color: \${match.winner === match.player1.id ? '#28a745' : '#dc3545'}; font-size: 0.85rem; margin-left: 5px;">[\${match.score1 || 0}]</span></span>
                </div>
                <div class="admin-vs-divider">VS</div>
                <div class="admin-player-row">
                    <span class="admin-player-id">\${match.player2.id}</span>
                    <span class="admin-player-name">\${match.player2.name} <span style="color: \${match.winner === match.player2.id ? '#28a745' : '#dc3545'}; font-size: 0.85rem; margin-left: 5px;">[\${match.score2 || 0}]</span></span>
                </div>
            \`;
            bottomSection.appendChild(card);
        });
    }
    listDiv.appendChild(bottomSection);
}

function openScoreModal(match) {
    manualScoreCurrentMatch = match;
    document.getElementById('modal-score-match-id').textContent = match.id;
    document.getElementById('p1-score-name').textContent = \`\${match.player1.id} \${match.player1.name}\`;
    document.getElementById('p2-score-name').textContent = \`\${match.player2.id} \${match.player2.name}\`;
    
    document.getElementById('p1-score-input').value = '';
    document.getElementById('p2-score-input').value = '';
    
    p1FoulState = false;
    p2FoulState = false;
    
    document.getElementById('p1-score-row').classList.remove('foul-state');
    document.getElementById('p2-score-row').classList.remove('foul-state');
    document.getElementById('p1-foul-btn').classList.remove('active');
    document.getElementById('p1-foul-btn').textContent = 'ทำฟาวล์';
    document.getElementById('p2-foul-btn').classList.remove('active');
    document.getElementById('p2-foul-btn').textContent = 'ทำฟาวล์';
    
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
            document.getElementById('p1-foul-btn').textContent = 'ฟาวล์แล้ว';
            if (p2FoulState) toggleFoul(2); 
        } else {
            document.getElementById('p1-score-row').classList.remove('foul-state');
            document.getElementById('p1-foul-btn').classList.remove('active');
            document.getElementById('p1-foul-btn').textContent = 'ทำฟาวล์';
        }
    } else {
        p2FoulState = !p2FoulState;
        if (p2FoulState) {
            document.getElementById('p2-score-row').classList.add('foul-state');
            document.getElementById('p2-foul-btn').classList.add('active');
            document.getElementById('p2-foul-btn').textContent = 'ฟาวล์แล้ว';
            if (p1FoulState) toggleFoul(1);
        } else {
            document.getElementById('p2-score-row').classList.remove('foul-state');
            document.getElementById('p2-foul-btn').classList.remove('active');
            document.getElementById('p2-foul-btn').textContent = 'ทำฟาวล์';
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
        alert("กรุณากรอกคะแนนให้ครบทั้ง 2 คน หรือเลือกทำฟาวล์");
        return;
    }

    if (p1FoulState) {
        winner = manualScoreCurrentMatch.player2;
        loser = manualScoreCurrentMatch.player1;
        reason = \`\${manualScoreCurrentMatch.player1.name} ทำฟาวล์\`;
    } else if (p2FoulState) {
        winner = manualScoreCurrentMatch.player1;
        loser = manualScoreCurrentMatch.player2;
        reason = \`\${manualScoreCurrentMatch.player2.name} ทำฟาวล์\`;
    } else {
        if (s1 === s2) {
            alert("คะแนนเท่ากัน! (ยังไม่รองรับเสมอ) กรุณาตัดสินใหม่");
            return;
        }
        
        if (s1 > s2) {
            winner = manualScoreCurrentMatch.player1;
            loser = manualScoreCurrentMatch.player2;
            reason = \`ชนะคะแนน \${s1} - \${s2}\`;
        } else {
            winner = manualScoreCurrentMatch.player2;
            loser = manualScoreCurrentMatch.player1;
            reason = \`ชนะคะแนน \${s2} - \${s1}\`;
        }
    }

    if (confirm(\`ยืนยันผลการแข่งขัน:\nผู้ชนะ: \${winner.name}\nเหตุผล: \${reason}\n\nคุณต้องการบันทึกข้อมูลหรือไม่?\`)) {
        
        // Derive division from the match itself
        const divisionStr = manualScoreCurrentMatch.division === 'ม.ต้น' ? 'Middle' : 'High';
        
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
            submitBtn.textContent = 'กำลังบันทึก...';
            submitBtn.disabled = true;
        }

        fetchRPC(payload)
        .then(res => {
            if (!res.ok) throw new Error('Server returned ' + res.status);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                alert(\`บันทึกผลการแข่งขันสำเร็จ!\`);
                closeScoreModal();
                // Force fetch new data from backend to update bracket
                if (typeof fetchTournamentData === 'function') {
                    isFetching = false; // reset fetch lock
                    fetchTournamentData().then(() => {
                        renderManualScoreView();
                    });
                }
            } else {
                alert("เกิดข้อผิดพลาด: " + data.message);
            }
        })
        .catch(err => {
            console.error("Error submitting score:", err);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.textContent = 'บันทึกผลการแข่งขัน';
                submitBtn.disabled = false;
            }
        });
    }
}

// ==========================================
// Authentication System (Token-based SPA)
// ==========================================
function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('show');
    document.getElementById('login-modal-overlay').classList.remove('show');
}

async function handleLogin() {
    const passInput = document.getElementById('admin-pass-input');
    const btn = document.getElementById('btn-login-submit');
    const pass = passInput.value;
    if(!pass) return;
    
    btn.textContent = 'กำลังตรวจสอบ...';
    btn.disabled = true;
    try {
        const res = await fetchRPC({ action: 'login', pass: pass });
        const data = await res.json();
        if (data.success) {
            sessionStorage.setItem('adminToken', data.token);
            closeLoginModal();
            passInput.value = '';
            // ปลดล็อกเมนู Admin
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('admin-only'));
            const loginBtn = document.getElementById('nav-login-btn');
            if(loginBtn) loginBtn.style.display = 'none';
        } else {
            alert('รหัสผ่านไม่ถูกต้อง');
        }
    } catch(err) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
        btn.textContent = 'เข้าสู่ระบบ';
        btn.disabled = false;
    }
}

function logout() {
    sessionStorage.removeItem('adminToken');
    window.location.reload();
}


// ระบบจัดการสถานะ
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.viewDivisionStates = JSON.parse(localStorage.getItem('viewDivisionStates')) || {};
    } catch (e) {
        window.viewDivisionStates = {};
    }
    window.currentActiveView = localStorage.getItem('activeView') || 'view-home';
    const savedView = window.currentActiveView;
    window.DIVISION_KEY = window.viewDivisionStates[savedView] || localStorage.getItem('activeDivision') || 'middle';
    
    // ซิงค์ UI สวิตช์ให้ตรงกับค่าที่บันทึกไว้
    const switchBtns = document.querySelectorAll('#header-division-switch button');
    switchBtns.forEach(btn => {
        if ((window.DIVISION_KEY === 'middle' && btn.textContent === 'ม.ต้น') ||
            (window.DIVISION_KEY === 'high' && btn.textContent === 'ม.ปลาย')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // เรียกฟังก์ชันเริ่มต้นจาก script.html
    if (typeof initTournamentBoard === 'function') {
        initTournamentBoard();
    } else if (typeof setupMobileUX === 'function') {
        setupMobileUX();
        if (typeof setupZoom === 'function') setupZoom();
    }
    
    // โหลดข้อมูลครั้งแรก
    if (typeof fetchTournamentData === 'function') {
        fetchTournamentData();
    }
    
    // เปลี่ยนไปหน้าที่บันทึกไว้
    switchView(savedView);
});

// ???????????????? (SPA Navigation)
function switchView(viewId) {
    // ?????????????????????????????? (????????????????????????? admin/public)
    if (!document.getElementById(viewId)) {
        viewId = 'view-home';
    }
    
    // ???????????????????? localStorage
    localStorage.setItem('activeView', viewId);
    window.currentActiveView = viewId;
    
    // ???????????
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    // ????????????????????????
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // ????????????????
    document.getElementById(viewId).classList.add('active');
    
    // ????/???? Switch ???????????????????????????? (???? ?????????????, ????????????????)
    const switchableViews = ['view-tournaments', 'view-results', 'view-manual-score', 'view-assignment'];
    if (switchableViews.includes(viewId)) {
        document.getElementById('header-division-switch').style.display = 'flex';
        
        // Read and apply division for this view
        window.DIVISION_KEY = window.viewDivisionStates[viewId] || localStorage.getItem('activeDivision') || 'middle';
        const switchBtns = document.querySelectorAll('#header-division-switch button');
        switchBtns.forEach(btn => {
            if ((window.DIVISION_KEY === 'middle' && btn.textContent === 'ม.ต้น') ||
                (window.DIVISION_KEY === 'high' && btn.textContent === 'ม.ปลาย')) {
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
    
    
    // ??????????????????
    const activeNav = document.querySelector(\`.nav-item[data-target="\${viewId}"]\`);
    if (activeNav) {
        activeNav.classList.add('active');
        // ?????? Title ??????????
        document.getElementById('current-page-title').textContent = activeNav.textContent.trim();
    }
    
    // ???????????????????????????????????????
    if (viewId === 'view-tournaments' && typeof updateZoom === 'function') {
        setTimeout(updateZoom, 50);
    }
    
    // ถ้าเลือกเมนูจัดโต๊ะ ให้ดึงข้อมูลมาแสดงใหม่
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
    
    // ปิด Sidebar บนมือถืออัตโนมัติ
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

// สลับระดับชั้น (ม.ต้น / ม.ปลาย)
function toggleDivision(division, btnElement) {
    const switchContainer = btnElement.parentElement;
    switchContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    window.DIVISION_KEY = division;
    localStorage.setItem('activeDivision', division);
    
    const activeView = window.currentActiveView;
    window.viewDivisionStates[activeView] = division;
    localStorage.setItem('viewDivisionStates', JSON.stringify(window.viewDivisionStates));
    
    // โหลดข้อมูลจากที่แคชไว้เบื้องหลังทันที (ไม่ต้องรอโหลดจากเซิร์ฟเวอร์ใหม่)
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
                lastUpdateEl.textContent = 'อัปเดตล่าสุด: ' + d.toLocaleTimeString('th-TH');
            }
            
            const currentDiv = window.DIVISION_KEY || 'middle';
            if (window.tournamentAllData[currentDiv]) {
                if (typeof renderTournament === 'function') {
                    renderTournament(window.tournamentAllData[currentDiv]);
                }
                if (typeof renderResults === 'function') {
                    renderResults(window.tournamentAllData[currentDiv]);
                }
                if (typeof renderAnnouncerView === 'function') {
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
function openLoginModal() { alert('ส่วนนี้สำหรับผู้ชม ไม่สามารถ Login ได้ครับ'); }
function assignTable() { }
function updateScore() { }
