import { reelData } from './reelData';

const categoryToModeMap = {
  // Humor
  memes: 'HUMOR',
  oldmeme: 'HUMOR',
  wtf: 'HUMOR',
  comic: 'HUMOR',
  // Aprender
  science: 'APRENDER',
  // Ahora
  news: 'AHORA',
  // Calma
  food: 'CALMA',
  animals: 'CALMA',
  music: 'CALMA',
  wholesome: 'CALMA',
  // Descubrir
  sports: 'DESCUBRIR',
  games: 'DESCUBRIR',
  anime: 'DESCUBRIR',
  cosplay: 'DESCUBRIR',
  motorvehicles: 'DESCUBRIR',
  lifestyle: 'DESCUBRIR',
  // Profundo
  relationship: 'PROFUNDO',
  politics: 'PROFUNDO',
};

// Fisher-Yates (aka Knuth) Shuffle
function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export function getReels(mode) {
  let filteredData;

  if (mode === 'CAOS') {
    // All categories for CAOS
    filteredData = reelData;
  } else {
    // Get categories for the selected mode
    const targetCategories = Object.keys(categoryToModeMap).filter(
      (category) => categoryToModeMap[category] === mode
    );
    
    filteredData = reelData.filter((reel) => targetCategories.includes(reel.category));
  }

  // Shuffle the filtered data to ensure random order and no repeats until exhausted.
  // We return a new shuffled array every time.
  const reels = filteredData.map(r => ({
    id: r.url, // Use URL as a unique ID
    authorName: r.category,
    title: `Reel de ${r.category}`,
    type: 'video',
    url: r.url,
    thumbUrl: `https://avatars.dicebear.com/api/jdenticon/${r.category}.svg`, // Placeholder thumbnail
    contentType: categoryToModeMap[r.category] || 'CAOS'
  }));

  return shuffle(reels);
}
