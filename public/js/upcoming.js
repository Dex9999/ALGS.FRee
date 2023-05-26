const bgColor = '#2c2c2c';
const txtColor = '#ffffff';
const accentColor = '#a439d1';
document.body.style.backgroundColor = bgColor;

const submitBtn = document.getElementById('submitBtn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

submitBtn.addEventListener('click', () => {
    submitWcaId();
});

const wcaIdInput = document.getElementById('wcaIdInput');
wcaIdInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        submitWcaId();
    }
});

let token = null;
let isTokenFetching = false;

function submitWcaId() {
    const wcaId = wcaIdInput.value.trim();
    if (wcaId !== '') {
        showLoading();
        hideError();
        if (token) {
            fetchCompetitions(wcaId);
        } else {
            // fetchAndSetToken()
            //     .then(() => fetchCompetitions(wcaId))
            //     .catch(error => {
                    console.log('Failed to fetch token:', error);
                    hideLoading();
                    showError('Failed to fetch token. Please try again.');
                // });
        }
    } else {
        showError('Please enter a valid WCA ID.');
    }
}

window.addEventListener('load', () => {
    fetchAndSetToken()
        .catch(error => {
            console.log('Failed to fetch token:', error);
        });
});

function fetchAndSetToken() {
    if (isTokenFetching) {
        return Promise.resolve();
    }

    isTokenFetching = true;
    return getToken()
        .then((newtoken) => {
            if (newtoken) {
                token = newtoken;
                console.log('Token fetched and saved');
            } else {
                console.log('Failed to fetch token');
            }
            isTokenFetching = false;
        })
        .catch((error) => {
            console.log('Failed to fetch token:', error);
            isTokenFetching = false;
        });
}

async function fetchCompetitions(wcaId) {
    if (!token) {
        console.log('Token not available');
        return;
    }

    const raw = JSON.stringify({
        "sqlQuery": `SELECT name AS competition, countryid, start_date AS date FROM Competitions WHERE id IN (SELECT competitionid FROM Results WHERE personid = '${wcaId}' UNION SELECT r.competition_id FROM registrations r JOIN Competitions c ON r.competition_id = c.id WHERE r.user_id = (SELECT id FROM users WHERE wca_id = '${wcaId}') AND c.start_date > CURRENT_DATE() AND r.accepted_at IS NOT NULL AND r.deleted_at IS NULL) AND start_date > CURRENT_DATE() ORDER BY start_date;`,
        "page": 0,
        "size": 20
    });
    console.log(raw);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", token);

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    loadingDiv.style.display = 'block';

    try {
        const response = await fetch("https://statistics-api.worldcubeassociation.org/database/query", requestOptions);
        console.log(response);
        const data = await response.json();
        console.log(data);

        loadingDiv.style.display = 'none';

        const tableContainer = document.getElementById('tableContainer');
        tableContainer.innerHTML = '';

        if (data.content.length === 0) {
            const noComps = document.createElement('h2');
            noComps.textContent = 'No Upcoming Competitions';
            noComps.style.marginBottom = '20px';
            noComps.style.textAlign = 'center';
            noComps.style.fontWeight = 'bold';
            tableContainer.appendChild(noComps);
        } else {
            const table = data.content.map(row => ({ Competition: row[0], Country: row[1], Date: row[2] }));
            const createTable = (data) => {
                const table = document.createElement('table');
                const header = table.createTHead();
                const row = header.insertRow(0);
                Object.keys(data[0]).forEach((key) => {
                    const th = document.createElement('th');
                    const text = document.createTextNode(key);

                    th.style.border = '2.25px solid';
                    th.style.borderColor = txtColor;
                    th.style.padding = '10px';
                    th.style.textAlign = 'center';
                    th.style.fontWeight = 'bold';
                    th.style.fontSize = '1.3rem';
                    th.style.color = txtColor;
                    th.style.textAlign = 'center';
                    th.style.backgroundColor = accentColor;

                    th.appendChild(text);
                    row.appendChild(th);
                });
                const tbody = document.createElement('tbody');
                data.forEach((rowData) => {
                    const row = tbody.insertRow(-1);
                    Object.values(rowData).forEach((value) => {
                        const cell = row.insertCell();
                        const text = document.createTextNode(value);
                        cell.style.border = '2.25px solid';
                        cell.style.borderColor = txtColor;
                        cell.style.padding = '10px';
                        cell.style.color = txtColor;
                        cell.style.textAlign = 'center';
                        cell.appendChild(text);
                    });
                });

                table.style.color = bgColor;
                table.style.width = '80%';
                table.style.textAlign = 'center';
                table.style.marginLeft = 'auto';
                table.style.marginRight = 'auto';
                table.style.padding = '10px';
                table.style.maxWidth = '80vw';
                table.style.overflow = 'auto';
                const caption = table.createCaption();
                caption.textContent = 'Upcoming Competitions';
                caption.style.color = txtColor;
                caption.style.textAlign = 'center';
                caption.style.fontWeight = 'bold';
                caption.style.fontSize = '2rem';
                caption.style.marginBottom = '10px';

                table.appendChild(header);
                table.appendChild(tbody);
                return table;
            };

            const tableElement = createTable(table);
            tableElement.style.marginBottom = '20px';
            tableContainer.appendChild(tableElement);
        }
    } catch (error) {
        console.log(error);
        loadingDiv.style.display = 'none';
        showError('Failed to fetch competitions. Please try again.');
    }
}

async function getToken() {
    try {
        const bearToken = await fetch("https://algs.vercel.app/api", {
            method: 'GET',
            redirect: 'follow'
        });
        if (!bearToken.ok) {
            throw new Error(`HTTP error! status: ${bearToken.status}`);
        }
        const newToken = await bearToken.text();
        console.log(`Updated token to: ${newToken}`);
        return newToken;
    } catch (error) {
        console.log('Failed to fetch token:', error);
        return null;
    }
}

function showLoading() {
    loadingDiv.style.display = 'block';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    errorDiv.style.display = 'none';
}
