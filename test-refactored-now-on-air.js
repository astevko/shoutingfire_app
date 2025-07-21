const fetch = require('node-fetch');

async function testRefactoredNowOnAir() {
  try {
    console.log('🔧 Testing Refactored Now On Air extraction...\n');
    
    const response = await fetch('https://shoutingfire.com/');
    const html = await response.text();
    console.log('✅ HTML fetched successfully\n');
    
    // Look for qt-qtonairhero section
    const onAirSection = html.match(/<div[^>]*qt-qtonairhero[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    
    if (!onAirSection) {
      console.log('❌ No show section found');
      return;
    }
    
    const sectionHtml = onAirSection[0];
    console.log('✅ Found show section');
    
    // Check status (Now On Air vs Upcoming)
    const statusMatch = sectionHtml.match(/<h5[^>]*>[\s\S]*?<span>\s*(Now On Air|Upcoming)\s*<\/span>/i);
    const status = statusMatch && statusMatch[1] ? 
      (statusMatch[1].toLowerCase().includes('now') ? 'now' : 'upcoming') : 'unknown';
    
    // Extract show data
    const titleMatch = sectionHtml.match(/<h1 class="qt-title qt-capfont">\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    const subtitleMatch = sectionHtml.match(/<h4 class="qt-capfont">\s*([^<]+)\s*<\/h4>/);
    const timeMatch = sectionHtml.match(/<p class="qt-small">\s*([^<]+?)\s*<i class="dripicons-arrow-thin-right"><\/i>\s*([^<]+?)\s*<\/p>/);
    const bgMatch = sectionHtml.match(/data-bgimage="([^"]+)"/);
    
    const showData = {
      status: status,
      title: titleMatch ? titleMatch[2] : '',
      subtitle: subtitleMatch ? subtitleMatch[1] : '',
      time: timeMatch ? `${timeMatch[1].trim()} → ${timeMatch[2].trim()}` : '',
      link: titleMatch ? titleMatch[1] : '',
      backgroundImage: bgMatch ? bgMatch[1] : ''
    };
    
    console.log('📊 Extracted Data:');
    console.log(JSON.stringify(showData, null, 2));
    
    if (showData.title) {
      console.log('\n🎉 SUCCESS! Refactored extraction working!');
      console.log(`✅ Status: ${status.toUpperCase()}`);
      console.log(`✅ App will show: "${status === 'upcoming' ? 'Upcoming Show' : 'Now On Air'}"`);
      console.log(`✅ Title: "${showData.title}"`);
      console.log(`✅ Subtitle: "${showData.subtitle}"`);
      console.log(`✅ Time: "${showData.time}"`);
    } else {
      console.log('\n❌ No title extracted');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRefactoredNowOnAir();
