const fetch = require('node-fetch');

// HTML entity decoder function
const decodeHtmlEntities = (text) => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

async function testNowOnAir() {
  try {
    console.log('Testing Now On Air data extraction...');
    const response = await fetch('https://shoutingfire.com/');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('✅ HTML fetched successfully');
    
    // Extract data using regex patterns
    const showData = {
      title: '',
      dj: '',
      time: '',
      link: '',
      backgroundImage: ''
    };
    
    // Extract title and link
    const titleMatch = html.match(/<h1 class="qt-title qt-capfont">\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    if (titleMatch) {
      showData.link = titleMatch[1];
      showData.title = decodeHtmlEntities(titleMatch[2]);
      console.log('✅ Title found:', showData.title);
      console.log('✅ Link found:', showData.link);
    } else {
      console.log('❌ Title not found');
    }
    
    // Extract DJ name
    const djMatch = html.match(/<h4 class="qt-capfont">\s*([^<]+)\s*<\/h4>/);
    if (djMatch) {
      showData.dj = decodeHtmlEntities(djMatch[1].trim());
      console.log('✅ DJ found:', showData.dj);
    } else {
      console.log('❌ DJ not found');
    }
    
    // Extract time - look for the specific pattern with dripicons
    const timeMatch = html.match(/<p class="qt-small">\s*([^<]+?)\s*<i class="dripicons-arrow-thin-right"><\/i>\s*([^<]+?)\s*<\/p>/);
    if (timeMatch) {
      showData.time = decodeHtmlEntities(`${timeMatch[1].trim()} → ${timeMatch[2].trim()}`);
      console.log('✅ Time found:', showData.time);
    } else {
      // Fallback for different time format
      const timeMatch2 = html.match(/<p class="qt-small">\s*([^<]+)\s*<\/p>/);
      if (timeMatch2) {
        showData.time = decodeHtmlEntities(timeMatch2[1].trim());
        console.log('✅ Time found (fallback):', showData.time);
      } else {
        console.log('❌ Time not found');
      }
    }
    
    // Extract background image - look for the specific div with data-bgimage
    const bgMatch = html.match(/data-bgimage="([^"]+)"/);
    if (bgMatch) {
      showData.backgroundImage = bgMatch[1];
      console.log('✅ Background image found:', showData.backgroundImage);
    } else {
      // Fallback for style-based background
      const bgMatch2 = html.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
      if (bgMatch2) {
        showData.backgroundImage = bgMatch2[1];
        console.log('✅ Background image found (fallback):', showData.backgroundImage);
      } else {
        console.log('❌ Background image not found');
      }
    }
    
    console.log('\n📊 Final extracted data:');
    console.log(JSON.stringify(showData, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing Now On Air data:', error.message);
  }
}

testNowOnAir(); 