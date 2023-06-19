const { MongoClient } = require('mongodb');

async function sendMessage(webhookURLs, page = 1, uri, webhooks) {
  const currentDate = new Date().toISOString().split('T')[0];

  let response = await fetch(
    `https://www.worldcubeassociation.org/api/v0/competitions?start=${currentDate}&country_iso2=CA&page=${page}`
  );

  let res = await response.json();
  console.log(res);

  // Connect to MongoDB
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('webhook_competitions');
    const collection = database.collection('sent_competitions');

    if (res.length > 0) {
      for (let i = 0; i < res.length; i++) {
        const competition = res[i];
        const competitionId = competition.id;

        // get random helpful thing
        let driv = await fetch(`https://algs.vercel.app/drive?to=${encodeURIComponent(competition.venue_address)}`);
        let drive = await driv.text();

        // Check if competition has already been sent
        const competitionSent = await collection.findOne({ id: competitionId });

        if (!competitionSent) {
          // Competition not sent before, send it
          let preWcif = await fetch(`https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif/public`);
          let wcif = await preWcif.json();
          console.log(wcif.events[0].rounds.length);

          let embed = {
            embeds: [
              {
                title: competition.name,
                url: competition.website,
                color: 16711680,
                description: `**Events:** ${res[i].event_ids.map(eventId => eventMapping[eventId]).join(' ')}\nRegistration opens <t:${unix(competition.registration_open.split('T')[0])}:R> and closes <t:${unix(
                  competition.registration_close.split('T')[0]
                )}:R>\n**Competitor Limit:** ${competition.competitor_limit}\n**City:** ${competition.city} \n**Address:** [${
                  competition.venue_address
                }](https://www.google.com/maps/dir//${encodeURIComponent(competition.venue_address)} "${drive}")\n**Schedule:**`,
                footer: {
                  text: 'Competition went live at ' + (new Date(competition.announced_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })).toString().replace(/:([^:]*)$/, '.$1')
,
                },
              },
            ],
  "allowed_mentions": {
    "parse": ["users"],
  }
          };

          // Loop through venues and rooms to add fields to the embed
          wcif.schedule.venues.forEach((venue) => {
            venue.rooms.forEach((room) => {
              let groupedActivities = groupActivitiesByDay(room.activities);
              embed.embeds[0].description += `\n${room.name}`;
              groupedActivities.forEach((group) => {
                embed.embeds[0].description += `\n\n__${formatDate(group.day)}__`;
                group.activities.forEach((activity) => {
                  embed.embeds[0].description += `\n<t:${unix(activity.startTime)}:t> - <t:${unix(
                    activity.endTime
                  )}:t>: ${activity.name}`;
                });
              });
            });
          });

          try {
            for (const url of webhookURLs) {
              let webhookURL = url;
              if (competition.city.toLowerCase().includes('ontario')) {
                if(webhookURL.endsWith("HBKcsS")){
                  embed['content'] = "\n<@616981104011771904>"
                }
              }

              await fetch(webhookURL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(embed),
              });

              // Save sent competition in the database
              await collection.insertOne({ id: competitionId });
              console.log('Competition', competitionId, 'sent successfully to:', url);
            }
          } catch (error) {
            console.error('Error sending message:', error);
          }
        } else {
          console.log(`Competition ${competitionId} already sent.`);
        }
      }

      // Continue to the next page
      await sendMessage(webhookURLs, page + 1);
    } else {
      console.log('No more competitions to send.');
    }
  } catch (error) {
    console.error('Error accessing database:', error);
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

sendMessage([webhooks]);

const eventMapping = {
  '333': '<:333:1120126464034095154>',
  '222': '<:222:1120126396338020535>',
  '444': '<:444:1120126502298730496>',
  '555': '<:555:1120126510599262229>',
  '666': '<:666:1120126513937920031>',
  '777': '<:777:1120126515556921426>',
  '333bf': '<:333bf:1120126497290719273>',
  '333fm': '<:333fm:1120126498620317698>',
  '333mbf': '<:333mbf:1120126500285448232>',
  '333oh': '<:333oh:1120126501233377395>',
  '444bf': '<:444bf:1120126509470986301>',
  '555bf': '<:555bf:1120126511865933884>',
  'minx': '<:minx:1120126517482102884>',
  'pyram': '<:pyram:1120126518581022740>',
  'skewb': '<:skewb:1120126553695719424>',
  'sq1': '<:sq1:1120126555348271275>',
  'clock': '<:clock:1120127499565809705>'
};
function unix(dateString) {
  const estDate = new Date(dateString);
  return Math.floor(estDate.getTime() / 1000);
}

function groupActivitiesByDay(activities) {
  let grouped = [];
  activities.forEach((activity) => {
    let dayIndex = grouped.findIndex((group) => isSameDay(group.day, activity.startTime));
    if (dayIndex === -1) {
      grouped.push({
        day: new Date(activity.startTime),
        activities: [activity],
      });
    } else {
      grouped[dayIndex].activities.push(activity);
    }
  });
  return grouped;
}

function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
}

module.exports = { sendMessage };
