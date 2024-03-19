const wcaIdInput = document.getElementById('wcaIdInput');
const wcaIdList = document.getElementById('wcaIdList');
const dropdownList = document.getElementById('dropdown-list');

document.addEventListener('click', (event) => {
  if(event.target == document.body){
    hideDropdown();
  }
});

wcaIdInput.addEventListener('input', () => {
  const inputValue = encodeURIComponent(wcaIdInput.value.toLowerCase());

//  dropdownList.addEventListener('click', (event) => {
//   const clickedElement = event.target;
//   console.log(clickedElement.value); 
// });

fetch(`https://www.worldcubeassociation.org/api/v0/search/users?q=${inputValue}&persons_table=true`)
    .then(response => response.json())
    .then(data => {
      let top3 = [];
      for (let i = 0; i < 3 && i < data.result.length; i++) {
        top3.push({
          name: data.result[i].name,
          id: data.result[i].id,
          avatarUrl: data.result[i].avatar.url
        });
      }
      populateOptions(top3);
    })
    .catch(error => {
      console.error(error);
    });
});

// wcaIdList.addEventListener('change', (event) => {
//   wcaIdInput.value = event.target.value;
// });
// document.addEventListener('click', (event) => {
//   const clickedElement = event.target;
//   if (dropdownList.contains(clickedElement)) {
//     console.log(clickedElement);
//   }
// });

function populateOptions(options) {
  dropdownList.innerHTML = '';

  if (options.length > 1) {
    options.reverse().forEach(option => {
      const optionElement = document.createElement('li');
      optionElement.value = option.id;
      optionElement.innerHTML = `
        <img src="${option.avatarUrl}" alt="Avatar" width="40" height="40">
        <span class="bigger-text">${option.name}</span>
        <span class="smaller-text">${option.id}</span>
      `;
      optionElement.addEventListener('click', () => {
        console.log('yo what?');
        console.log(optionElement); 
        const spanElements = optionElement.querySelectorAll('span');
        const idValue = spanElements[1].innerHTML;

        console.log(idValue);
        wcaIdInput.value = idValue;
        hideDropdown();
        submitWcaId();
      });
      dropdownList.appendChild(optionElement);
    });

    dropdownList.style.display = 'block';
    dropdownList.style.top = `${wcaIdInput.offsetTop + wcaIdInput.offsetHeight}px`;
    dropdownList.style.left = `${wcaIdInput.offsetLeft}px`;
  } else if (options.length === 1) {
    const optionElement = document.createElement('li');
    optionElement.value = options[0].id;
    optionElement.innerHTML = `
      <img src="${options[0].avatarUrl}" alt="Avatar" width="40" height="40">
      <span class="bigger-text">${options[0].name}</span>
    `;
    console.log(optionElement);
    optionElement.addEventListener('click', () => {
      console.log("click moment!");
      console.log('Clicked option:', optionElement); // New console log
      wcaIdInput.value = optionElement.value;
      hideDropdown();
      submitWcaId();
    });
    dropdownList.appendChild(optionElement);

    // Show and position the dropdown list
    dropdownList.style.display = 'block';
    dropdownList.style.top = `${wcaIdInput.offsetTop + wcaIdInput.offsetHeight}px`;
    dropdownList.style.left = `${wcaIdInput.offsetLeft}px`;
  } else {
    hideDropdown();
  }
}
function hideDropdown() {
  dropdownList.style.display = 'none';
}

wcaIdInput.addEventListener('focus', () => {
  if (wcaIdInput.value.trim() !== '') {
    dropdownList.style.display = 'block';
  }
});

// wcaIdInput.addEventListener('blur', () => {
//   hideDropdown();
// });


//unimportant stuff, for actually generating the table after submitWcaId() is run
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

wcaIdInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        submitWcaId();
    }
});

let token = null;
let isTokenFetching = false;

function submitWcaId() {
  // console.log('button pressed')
    const wcaId = wcaIdInput.value.trim();
    if (wcaId !== '') {
        showLoading();
        hideError();
        if (token) {
            fetchCompetitions(wcaId);
        } else {
            fetchAndSetToken()
                .then(() => fetchCompetitions(wcaId))
                .catch(error => {
                    console.log('Failed to fetch token:', error);
                    hideLoading();
                    showError('Failed to fetch token. Please try again.');
                });
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

    const raw1 = JSON.stringify({
        "sqlQuery": `SELECT name AS competition, countryid, start_date AS date FROM Competitions WHERE id IN (SELECT competitionid FROM Results WHERE personid = '${wcaId}' UNION SELECT r.competition_id FROM registrations r JOIN Competitions c ON r.competition_id = c.id WHERE r.user_id = (SELECT id FROM users WHERE wca_id = '${wcaId}') AND c.start_date > CURRENT_DATE() AND r.accepted_at IS NOT NULL AND r.deleted_at IS NULL) AND start_date > CURRENT_DATE() ORDER BY start_date;`,
        "page": 0,
        "size": 20
    });
    console.log(raw1);

    const myHeaders1 = new Headers();
    myHeaders1.append("Content-Type", "application/json");
    myHeaders1.append("Authorization", token);

    const requestOptions1 = {
        method: 'POST',
        headers: myHeaders1,
        body: raw1,
        redirect: 'follow'
    };

    loadingDiv.style.display = 'block';

    try {
        const response1 = await fetch("https://statistics-api.worldcubeassociation.org/database/query", requestOptions1);
        const data1 = await response1.json();

        loadingDiv.style.display = 'none';

        const tableContainer = document.getElementById('tableContainer');
        tableContainer.innerHTML = '';

        if (data1.content.length === 0) {
            const noComps = document.createElement('h2');
            noComps.textContent = 'No Upcoming Competitions';
            noComps.style.marginBottom = '20px';
            noComps.style.textAlign = 'center';
            noComps.style.fontWeight = 'bold';
            tableContainer.appendChild(noComps);
        } else {
            const table1 = data1.content.map(row => ({ Competition: row[0], Country: row[1], Date: row[2] }));
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

            const tableElement1 = createTable(table1);
            tableElement1.style.marginBottom = '20px';
            tableContainer.appendChild(tableElement1);
        }

        const raw2 = JSON.stringify({
            "sqlQuery": `SELECT competition_id
FROM bookmarked_competitions
WHERE user_id = (SELECT id FROM users WHERE wca_id = '${wcaId}') ORDER BY id DESC;
`,
            "page": 0,
            "size": 20
        });
        console.log(raw2);

        const myHeaders2 = new Headers();
        myHeaders2.append("Content-Type", "application/json");
        myHeaders2.append("Authorization", token);

        const requestOptions2 = {
            method: 'POST',
            headers: myHeaders2,
            body: raw2,
            redirect: 'follow'
        };

        const bookResponse = await fetch("https://statistics-api.worldcubeassociation.org/database/query", requestOptions2);
        const data2 = await bookResponse.json();

        loadingDiv.style.display = 'none';

        if (data2.content.length === 0) {
            const noBookmarkedComps = document.createElement('h2');
            noBookmarkedComps.textContent = 'No Bookmarked Competitions';
            noBookmarkedComps.style.marginBottom = '20px';
            noBookmarkedComps.style.textAlign = 'center';
            noBookmarkedComps.style.fontWeight = 'bold';
            tableContainer.appendChild(noBookmarkedComps);
        } else {
            const table2 = data2.content.map(row => ({ Competition: row[0] }));
            
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
                caption.textContent = 'Bookmarked Competitions';
                caption.style.color = txtColor;
                caption.style.textAlign = 'center';
                caption.style.fontWeight = 'bold';
                caption.style.fontSize = '2rem';
                caption.style.marginBottom = '10px';

                table.appendChild(header);
                table.appendChild(tbody);
                return table;
            };
          const tableElement2 = createTable(table2);
            tableElement2.style.marginBottom = '20px';
            tableContainer.appendChild(tableElement2);
          
          
          const raw3 = JSON.stringify({
  "sqlQuery": `SELECT GROUP_CONCAT(user_preferred_events.event_id) AS Preferred_Events
FROM users 
JOIN user_preferred_events ON users.id = user_preferred_events.user_id
WHERE wca_id = '${wcaId}'
GROUP BY users.id, users.name, users.wca_id;`,
  "page": 0,
  "size": 20
});
          console.log(raw3);

          const myHeaders3 = new Headers();
          myHeaders3.append("Content-Type", "application/json");
          myHeaders3.append("Authorization", token);

          const requestOptions3 = {
            method: 'POST',
            headers: myHeaders3,
            body: raw3,
            redirect: 'follow'
          };

          const response3 = await fetch("https://statistics-api.worldcubeassociation.org/database/query", requestOptions3);
          const data3 = await response3.json();

          if (data3.content.length === 0) {
            const noPreferredEvents = document.createElement('h2');
            noPreferredEvents.textContent = 'No Preferred Events';
            noPreferredEvents.style.marginBottom = '20px';
            noPreferredEvents.style.textAlign = 'center';
            noPreferredEvents.style.fontWeight = 'bold';
            tableContainer.appendChild(noPreferredEvents);
        } else {
            const table3 = data3.content.map(row => ({ PreferredEvents: row[0] }));
            
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
            Object.values(rowData).forEach((value) => {
              const row = tbody.insertRow();
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
          caption.textContent = 'Preferred Events';
          caption.style.color = txtColor;
          caption.style.textAlign = 'center';
          caption.style.fontWeight = 'bold';
          caption.style.fontSize = '2rem';
          caption.style.marginBottom = '10px';

          table.appendChild(header);
          table.appendChild(tbody);
          return table;
        };

        const eventsString = table3[0].PreferredEvents;
        const eventsArray = eventsString.split(',');
        const tableData = eventsArray.map((event) => ({ Events: event }));
        const tableElement3 = createTable(tableData);
        tableElement3.style.marginBottom = '20px';
        tableContainer.appendChild(tableElement3);

        }
      }
    } catch (error) {
        console.log(error);
        loadingDiv.style.display = 'none';
        showError('Failed to fetch competitions. Please try again.');
    }
}


async function getToken() {
    try {
      //marker
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

