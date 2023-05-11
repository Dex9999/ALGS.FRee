async function searchWca(res, event, region, type){
  const conversions = {
  '3x3': '333',
  '3': '333',
  '3 by 3': '333',
  '3x3x3 cube': '333',
  '33': '333',
  'three': '333',
  '3x3x3': '333',
  '333':'333',
  'clock': 'clock',
  'clk': 'clock',
  'c': 'clock',
  '🕰️': 'clock',
  '🎛️': 'clock',
  '2':'222',
  '2x2':'222',
  '222':'222',
  '3bld':'333bf',
  '4bld':'444bf',
  '5bld':'555bf',
  'oh':'333oh',
  'a':'average',
  's':'single'
  };
  
  //type = capital(res.query.id) || 'average'
  var parsedEvent = conversions[event]
  var parsedType = conversions[type]
  
  var baseUrl = `https://www.worldcubeassociation.org/results/rankings/${parsedEvent}/average?region=${region}`
  
  res.send(event+region+type+baseUrl)
 
  function capital(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

module.exports = { searchWca };
