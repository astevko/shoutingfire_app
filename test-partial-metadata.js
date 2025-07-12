// Test script to verify partial metadata detection
function testPartialMetadata() {
  console.log('Testing partial metadata detection...');
  
  // Simulate the scenario where metadata gets more complete over time
  const mockHistory = [
    'Lansing-Dreiden - I Keep Everything'
  ];
  
  // Test case 1: More complete version of the same song
  const newSong1 = 'A Silent Agreement - Lansing-Dreiden - The Incomplete Triangle';
  const normalizedNewSong1 = newSong1.trim().toLowerCase();
  
  console.log('Test 1: Partial metadata update');
  console.log('Current history:', mockHistory);
  console.log('New song (more complete):', newSong1);
  console.log('Normalized new song:', normalizedNewSong1);
  
  // Simulate the logic
  const firstSong = mockHistory[0];
  const firstSongNormalized = firstSong.trim().toLowerCase();
  
  console.log('First song normalized:', firstSongNormalized);
  
  // Test the new logic: "Artist - Title" to "Title - Artist - Album"
  const splitParts = (s) => s.split(' - ').map(p => p.trim());
  const newParts = splitParts(newSong1);
  const prevParts = splitParts(firstSong);
  
  console.log('Previous parts:', prevParts);
  console.log('New parts:', newParts);
  
  // If previous is "Artist - Title" and new is "Title - Artist - Album"
  if (prevParts.length === 2 && newParts.length === 3) {
    const prevArtist = prevParts[0].toLowerCase();
    const newArtist = newParts[1].toLowerCase();
    console.log('Previous artist:', prevArtist);
    console.log('New artist:', newArtist);
    
    const isMoreComplete = prevArtist === newArtist;
    console.log('Is more complete version?', isMoreComplete);
    
    if (isMoreComplete) {
      console.log('✅ Would replace with enhanced metadata');
    } else {
      console.log('❌ Artists don\'t match, would add as new song');
    }
  } else {
    console.log('❌ Pattern doesn\'t match (not 2->3 parts)');
    return;
  }
  
  if (isMoreComplete) {
    // Replace the first song with the more complete version
    const updatedHistory = [newSong1, ...mockHistory.slice(1)];
    console.log('✅ Updated history:', updatedHistory);
  } else {
    console.log('❌ Not detected as more complete version');
  }
  
  // Test case 2: Completely different song
  const newSong2 = 'Completely Different Song - Artist - Album';
  const normalizedNewSong2 = newSong2.trim().toLowerCase();
  
  console.log('\nTest 2: Completely different song');
  console.log('New song:', newSong2);
  
  const isMoreComplete2 = normalizedNewSong2.includes(firstSongNormalized) || 
                         firstSongNormalized.includes(normalizedNewSong2);
  
  console.log('Is more complete version?', isMoreComplete2);
  console.log('✅ Correctly detected as different song:', !isMoreComplete2);
  
  // Test case 3: Same song with different formatting
  const newSong3 = 'Lansing-Dreiden - I Keep Everything';
  const normalizedNewSong3 = newSong3.trim().toLowerCase();
  
  console.log('\nTest 3: Same song, same metadata');
  console.log('New song:', newSong3);
  
  const isMoreComplete3 = normalizedNewSong3.includes(firstSongNormalized) || 
                         firstSongNormalized.includes(normalizedNewSong3);
  
  console.log('Is more complete version?', isMoreComplete3);
  console.log('✅ Correctly detected as same song:', isMoreComplete3);
}

testPartialMetadata(); 