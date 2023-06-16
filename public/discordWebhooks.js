async function sendMessage() {
  const query = `query {
  recentRecords{ 
    attemptResult
    id
    result{
      average
      best
      averageRecordTag
      singleRecordTag
      id
      person{
        name
        country{
          iso2
          name
        }
        avatar{thumbUrl}
				wcaId
      }
      attempts{
        result
      }
      round{
        competitionEvent{
          competition{name id wcaId}
        }
      }
    }
    tag
    type
  }
}`
  const webhookURL = 'https://discord.com/api/webhooks/1119265675366645790/RiMtxwxVvyAnsjx9cT8fz0WWrPvcCWG_wuazzJ6XNT916EGH9pX02k7-3g4oP_HBKcsS';
  let records = await fetch('https://live.worldcubeassociation.org/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query }),
    });
  let res = await records.json()
  try {
    await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: {
  "embeds": [
    {
      "title": "Meow!",
      "color": 1127128
    },
    {
      "title": "Meow-meow!",
      "color": 14177041
    }
  ]
} }),
    });
    console.log('Message sent successfully!');
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

module.exports = { sendMessage };
