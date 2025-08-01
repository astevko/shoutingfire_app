import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator, ScrollView, TouchableOpacity, Image, Linking, Platform, useWindowDimensions } from 'react-native';
import { Audio } from 'expo-av';
import { useState, useRef, useEffect } from 'react';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

// @ts-ignore
import * as rssParser from 'react-native-rss-parser';

// Import OWASP HTML sanitizer utilities
import { 
  decodeHtmlEntities, 
  sanitizeExternalContent, 
  safeRegexExtract,
  extractTextFromHtml 
} from './utils/htmlSanitizer';
import { 
  validateUrl, 
  safeOpenUrl, 
  buildSafeSearchUrl 
} from './utils/urlValidator';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://dc66b01d5a5155b51f413d808d92d32a@o4509691986378752.ingest.us.sentry.io/4509691987689472',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Audio Player Context
const AudioContext = React.createContext<any>(null);

// Audio Player Provider Component
function AudioProvider({ children }: { children: React.ReactNode }) {
  const STREAM_URL = 'https://shoutingfire-ice.streamguys1.com/smartmetadata-live';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [songHistory, setSongHistory] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load saved state on component mount
  useEffect(() => {
    const loadSavedState = async () => {
      const savedState = await Storage.load('audioState');
      const savedHistory = await Storage.load('songHistory');
      
      if (savedHistory) {
        setSongHistory(savedHistory);
      }
      
      if (savedState && savedState.isPlaying) {
        // Auto-resume if it was playing before
        setAudioEnabled(true);
        handlePlayPause();
      }
    };
    
    loadSavedState();
  }, []);

  // Monitor actual audio playback status
  useEffect(() => {
    const monitorAudioStatus = async () => {
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            const actuallyPlaying = status.isPlaying && !status.isBuffering;
            setIsActuallyPlaying(actuallyPlaying);
            
            // If we think we're playing but audio has stopped, update UI state
            if (isPlaying && !actuallyPlaying && !isLoading) {
              console.log('Audio stopped unexpectedly, updating state');
              setIsPlaying(false);
              setError('Stream interrupted - tap play to reconnect');
            }
          }
        } catch (e) {
          console.log('Error monitoring audio status:', e);
          setIsActuallyPlaying(false);
        }
      } else {
        setIsActuallyPlaying(false);
      }
    };

    // Monitor audio status every 3 seconds when we think we're playing
    if (isPlaying) {
      const statusInterval = setInterval(monitorAudioStatus, 3000);
      return () => clearInterval(statusInterval);
    } else {
      setIsActuallyPlaying(false);
    }
  }, [isPlaying, isLoading]);

  // Fetch current song info only when actually playing
  useEffect(() => {
    if (!isActuallyPlaying) {
      // Don't fetch song info when not actually playing
      return;
    }

    const fetchCurrentSong = async () => {
      try {
        // Fetch from XSPF playlist file for more reliable metadata
        const response = await fetch('https://shoutingfire-ice.streamguys1.com/smartmetadata-live.xspf');
        
        if (response.ok) {
          const xmlText = await response.text();
          
          // Extract song title from XSPF XML format
          const titleMatch = xmlText.match(/<title[^>]*>([^<]+)<\/title>/);
          
          if (titleMatch && titleMatch[1]) {
            const songInfo = decodeHtmlEntities(titleMatch[1].trim());
            console.log('Fetched song info from XSPF:', songInfo);
            
            if (songInfo && songInfo !== 'Shouting Fire is Currently Unavailable' && songInfo.length > 0) {
              // Update current song and add to history if it's different
              setCurrentSong(songInfo);
              setSongHistory(prevHistory => {
                const splitParts = (s: string) => s.split(' - ').map(p => p.trim());
                const newParts = splitParts(songInfo);
                const prevParts = prevHistory.length > 0 ? splitParts(prevHistory[0]) : [];

                // If previous is "Artist - Title" and new is "Title - Artist - Album"
                if (prevParts.length === 2 && newParts.length === 3) {
                  const prevArtist = prevParts[0].toLowerCase();
                  const newArtist = newParts[1].toLowerCase();
                  if (prevArtist === newArtist) {
                    // Replace head with enhanced metadata
                    const updatedHistory = [songInfo, ...prevHistory.slice(1)];
                    Storage.save('songHistory', updatedHistory.slice(0, 20));
                    return updatedHistory.slice(0, 20);
                  }
                }

                // Fallback: remove duplicates by normalized string
                const normalizedSongInfo = songInfo.trim().toLowerCase();
                const filteredHistory = prevHistory.filter(
                  song => song.trim().toLowerCase() !== normalizedSongInfo
                );
                const newHistory = [songInfo, ...filteredHistory];
                Storage.save('songHistory', newHistory.slice(0, 20));
                return newHistory.slice(0, 20);
              });
            } else {
              setCurrentSong('Live Radio - Currently Playing');
            }
          } else {
            setCurrentSong('Live Radio - Currently Playing');
          }
        } else {
          setCurrentSong('Live Radio - Currently Playing');
        }
      } catch (e) {
        const errorMessage = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
        console.log('Error fetching song info from XSPF:', errorMessage);
        setCurrentSong('Live Radio - Currently Playing');
      }
    };

    // Fetch immediately when starting to play
    fetchCurrentSong();
    
    // Update song info every 30 seconds while actually playing
    const interval = setInterval(fetchCurrentSong, 30000);
    return () => clearInterval(interval);
  }, [isActuallyPlaying]); // Depend on actual playback state

  const handlePlayPause = async () => {
    setError(null);
    
    // Enable audio on first interaction
    if (!audioEnabled) {
      setAudioEnabled(true);
    }
    
    if (isPlaying) {
      setIsPlaying(false);
      setIsActuallyPlaying(false);
      setIsLoading(true);
      try {
        await soundRef.current?.stopAsync();
        await soundRef.current?.unloadAsync();
        soundRef.current = null;
        // Save state
        await Storage.save('audioState', { isPlaying: false });
      } catch (e) {
        const errorMessage = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
        setError('Error stopping stream: ' + errorMessage);
      }
      setIsLoading(false);
    } else {
      setIsLoading(true);
      try {
        // Initialize audio session for better compatibility
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } catch (audioModeError) {
          console.log('Audio mode error (non-critical):', audioModeError);
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: STREAM_URL },
          { shouldPlay: true, isLooping: false }
        );

        // Set up status callback to track actual playback state
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            const actuallyPlaying = status.isPlaying && !status.isBuffering;
            setIsActuallyPlaying(actuallyPlaying);
          }
        });

        soundRef.current = sound;
        setIsPlaying(true);
        setIsActuallyPlaying(true); // Assume it starts playing, monitoring will verify
        // Save state
        await Storage.save('audioState', { isPlaying: true });
      } catch (e) {
        const errorMessage = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
        setError('Error starting stream: ' + errorMessage);
      }
      setIsLoading(false);
    }
  };

  const handleSpotifySearch = async (song: string) => {
    try {
      const searchUrl = buildSafeSearchUrl('https://open.spotify.com/search/', song);
      if (searchUrl) {
        const result = await safeOpenUrl(searchUrl, Linking);
        if (!result.success) {
          console.warn('Failed to open Spotify:', result.error);
        }
      } else {
        console.warn('Invalid search query for Spotify');
      }
    } catch (error) {
      console.log('Error opening Spotify:', error);
    }
  };

  const value = {
    isPlaying,
    isLoading,
    error,
    currentSong,
    songHistory,
    handlePlayPause,
    handleSpotifySearch
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

// Header Component with Audio Player
function AppHeader() {
  const audioContext = React.useContext(AudioContext);
  
  if (!audioContext) {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ShoutingFire</Text>
      </View>
    );
  }

  const { isPlaying, isLoading, currentSong, handlePlayPause, handleSpotifySearch } = audioContext;

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>ShoutingFire</Text>
        <TouchableOpacity
          style={styles.headerPlayButton}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.headerPlayButtonText}>
              {isPlaying ? '⏸️' : '▶️'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {currentSong && (
        <View style={styles.headerNowPlaying}>
          <Text style={styles.headerNowPlayingText} numberOfLines={1}>
            {currentSong}
          </Text>
          <TouchableOpacity
            style={styles.headerSpotifyButton}
            onPress={() => handleSpotifySearch(currentSong)}
          >
            <Text style={styles.headerSpotifyButtonText}>🎵</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Storage utility for cross-platform state persistence
const Storage = {
  async save(key: string, value: any) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
      console.log('Error saving to storage:', errorMessage);
    }
  },
  
  async load(key: string) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
      console.log('Error loading from storage:', errorMessage);
      return null;
    }
  }
};

// Audio Player Component (simplified for ListenScreen)
function ListenScreen() {
  const audioContext = React.useContext(AudioContext);
  const [onAirData, setOnAirData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  if (!audioContext) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Audio context not available</Text>
      </View>
    );
  }

  const { songHistory, handleSpotifySearch } = audioContext;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Fetch Now On Air data
  useEffect(() => {
    fetchNowOnAir();
  }, []);

  const fetchNowOnAir = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://shoutingfire.com/');
      const html = await response.text();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Fallback: look for any qt-qtonairhero section (might be "Upcoming")
      let  onAirSection = html.match(/<div[^>]*qt-qtonairhero[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
      
      if (!onAirSection) {
        setError('No show information section found');
        return;
      }
      
      const sectionHtml = onAirSection[0];
      console.log('Found show section:', sectionHtml.substring(0, 200) + '...');
      
      // Initialize data structure
      const showData = {
        title: '',
        subtitle: '',
        time: '',
        link: '',
        backgroundImage: '',
        status: 'upcoming' // default
      };
      
      // Check if this is "Now On Air" or "Upcoming"
      const statusMatch = sectionHtml.match(/<h5[^>]*>[\s\S]*?<span>\s*(Now On Air|Upcoming)\s*<\/span>/i);
      if (statusMatch && statusMatch[1]) {
        showData.status = statusMatch[1].toLowerCase().includes('now') ? 'now' : 'upcoming';
      }
      
      // Extract title and link from <h1> tag within this section
      const titleMatch = sectionHtml.match(/<h1 class="qt-title qt-capfont">\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
      if (titleMatch && titleMatch[1] && titleMatch[2]) {
        const urlValidation = validateUrl(titleMatch[1]);
        if (urlValidation.isValid) {
          showData.link = urlValidation.sanitizedUrl!;
        }
        // Properly decode HTML entities in the title
        showData.title = titleMatch[2]
          .replace(/&#(\d+);/g, (match: string, dec: string) => String.fromCharCode(parseInt(dec, 10)))
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&nbsp;/g, ' ');
      }
      
      // Extract subtitle from first <h4> tag within this section
      const subtitleMatch = sectionHtml.match(/<h4 class="qt-capfont">\s*([^<]+)\s*<\/h4>/);
      if (subtitleMatch && subtitleMatch[1]) {
        showData.subtitle = subtitleMatch[1]
          .replace(/&#(\d+);/g, (match: string, dec: string) => String.fromCharCode(parseInt(dec, 10)))
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .trim();
      }
      
      // Extract time from <p> tag within this section
      const timeMatch = sectionHtml.match(/<p class="qt-small">\s*([^<]+?)\s*<i class="dripicons-arrow-thin-right"><\/i>\s*([^<]+?)\s*<\/p>/);
      if (timeMatch && timeMatch[1] && timeMatch[2]) {
        showData.time = `${timeMatch[1].trim()} → ${timeMatch[2].trim()}`;
      } else {
        // Fallback for different time format
        const timeFallback = sectionHtml.match(/<p class="qt-small">\s*([^<]+)\s*<\/p>/);
        if (timeFallback && timeFallback[1]) {
          showData.time = timeFallback[1].trim();
        }
      }
      
      // Extract background image from data-bgimage within this section
      const bgMatch = sectionHtml.match(/data-bgimage="([^"]+)"/);
      if (bgMatch && bgMatch[1]) {
        const urlValidation = validateUrl(bgMatch[1]);
        if (urlValidation.isValid) {
          showData.backgroundImage = urlValidation.sanitizedUrl!;
        }
      } else {
        // Fallback for CSS background-image
        const bgFallback = sectionHtml.match(/background-image:\s*url\(['""]?([^'""]+)['""]?\)/);
        if (bgFallback && bgFallback[1]) {
          const urlValidation = validateUrl(bgFallback[1]);
          if (urlValidation.isValid) {
            showData.backgroundImage = urlValidation.sanitizedUrl!;
          }
        }
      }
      
      if (showData.title) {
        // Add status information to the displayed data
        const displayData = {
          ...showData,
          dj: showData.subtitle // Use subtitle as DJ name for compatibility
        };
        setOnAirData(displayData);
        
        if (showData.status === 'upcoming') {
          console.log('Note: Showing upcoming show as no current "Now On Air" show found');
        }
      } else {
        setError('No show information found');
      }
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      console.log('Error fetching Now On Air data:', errorMessage);
      setError('Failed to load current show information.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowPress = async (url: string) => {
    try {
      const result = await safeOpenUrl(url, Linking);
      if (!result.success) {
        console.warn('Failed to open show link:', result.error);
      }
    } catch (error) {
      console.log('Error opening show link:', error);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Now On Air Section */}
      <View style={styles.nowOnAirSection}>
        <Text style={styles.sectionTitle}>
          {onAirData && onAirData.status === 'upcoming' ? 'Upcoming Show' : 'Now On Air'}
        </Text>
        
        {loading ? (
          <View style={styles.onAirCard}>
            <ActivityIndicator size="large" color="#ffd700" />
            <Text style={styles.status}>Loading current show...</Text>
          </View>
        ) : error ? (
          <View style={styles.onAirCard}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.playButton} onPress={fetchNowOnAir}>
              <Text style={styles.playButtonIcon}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : onAirData ? (
          <TouchableOpacity
            style={styles.onAirCard}
            onPress={() => handleShowPress(onAirData.link)}
          >
            {onAirData.backgroundImage && (
              <Image
                source={{ uri: onAirData.backgroundImage }}
                style={styles.onAirBackground}
                resizeMode="cover"
              />
            )}
            
            <View style={styles.onAirOverlay}>
              <View style={styles.onAirContent}>
                <Text style={styles.onAirTitle} numberOfLines={2}>
                  {onAirData.title}
                </Text>
                
                {onAirData.dj && (
                  <Text style={styles.onAirDJ}>
                    {onAirData.dj}
                  </Text>
                )}
                
                {onAirData.time && (
                  <Text style={styles.onAirTime}>
                    {onAirData.time}
                  </Text>
                )}
                
                <View style={styles.onAirFooter}>
                  <Text style={styles.onAirLink}>Tap to view show details →</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.onAirCard}>
            <Text style={styles.description}>No show information available.</Text>
          </View>
        )}
      </View>

      {/* Recent Songs Section */}
      <View style={styles.recentSongsSection}>
        <Text style={styles.sectionTitle}>Recent Songs</Text>
        <Text style={styles.description}>Song history from the live stream</Text>
        
        <View style={styles.songHistoryContainer}>
          <ScrollView 
            style={styles.songHistoryScroll} 
            contentContainerStyle={styles.songHistoryContent}
            showsVerticalScrollIndicator={false}
          >
            {songHistory.length > 0 ? (
              songHistory.map((song: string, index: number) => (
                <View key={`${song}-${index}`} style={[
                  styles.songHistoryItem,
                  index === songHistory.length - 1 && styles.lastSongHistoryItem
                ]}>
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Text style={styles.songHistoryText}>
                      {song}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleSpotifySearch(song)}
                      style={styles.spotifyButton}
                    >
                      <Text style={styles.spotifyButtonText}>Spotify</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.songHistoryItem}>
                <Text style={styles.songHistoryText}>No recent songs available</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

// Chat Component
function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Join the conversation with DJ and other listeners!
      </Text>
      <View style={styles.chatContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            src="https://minnit.chat/ShoutingFireChat"
            style={{
              width: '100%',
              height: '500px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#2d2d2d',
            }}
            title="ShoutingFire Chat"
            allow="microphone; camera; fullscreen; display-capture"
          />
        ) : (
          <WebView
            source={{ uri: 'https://minnit.chat/ShoutingFireChat' }}
            style={styles.webview}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>
    </View>
  );
}

// Schedule Component
function ScheduleScreen() {
  // Get today and tomorrow's dates in YYYYMMDD format
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const tomorrowStr = tomorrow.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Use today as start date and day after tomorrow as end date to include both today and tomorrow
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().slice(0, 10).replace(/-/g, '');
  
  const calendarUrl = `https://calendar.google.com/calendar/embed?src=shoutingfirehq%40gmail.com&ctz=America%2FLos_Angeles&mode=AGENDA&dates=${todayStr}%2F${dayAfterTomorrowStr}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Shows</Text>
      <Text style={styles.description}>
        Today and tomorrow's ShoutingFire schedule
      </Text>
      <View style={styles.calendarContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            src={calendarUrl}
            style={{
              width: '100%',
              height: '600px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#2d2d2d',
            }}
            title="ShoutingFire Schedule"
            frameBorder="0"
            scrolling="no"
          />
        ) : (
          <WebView
            source={{ uri: calendarUrl }}
            style={styles.webview}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>
    </View>
  );
}

// Links Component
function LinksScreen() {
  const socialLinks = [
    {
      name: 'Patreon',
      url: 'https://www.patreon.com/ShoutingFire',
      icon: '❤️'
    },
    {
      name: 'ShoutingFire.com',
      url: 'https://www.shoutingfire.com/',
      icon: '🌐'
    },
    {
      name: 'SoundCloud',
      url: 'https://soundcloud.com/shoutingfire',
      icon: '🎵'
    },
    {
      name: 'Insta',
      url: 'https://www.instagram.com/shouting_fire/',
      icon: '📷'
    },
    {
      name: 'Meta',
      url: 'https://www.facebook.com/shoutingfire/',
      icon: '📘'
    },
    {
      name: 'iHeartRadio',
      url: 'https://www.iheart.com/live/shouting-fire-6378/',
      icon: '🎧'
    },
    {
      name: 'StreamGuys',
      url: 'https://www.streamguys.com/',
      icon: '🎧'
    },
  ];

  const handleLinkPress = async (url: string) => {
    try {
      const result = await safeOpenUrl(url, Linking);
      if (!result.success) {
        console.warn('Failed to open link:', result.error);
      }
    } catch (e) {
      const errorMessage = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      console.log('Error opening link:', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect With Us</Text>
      <Text style={styles.description}>
        Follow ShoutingFire across all platforms
      </Text>
      <View style={styles.linksContainer}>
        {socialLinks.map((link, index) => (
          <TouchableOpacity
            key={index}
            style={styles.linkItem}
            onPress={() => handleLinkPress(link.url)}
          >
            <Text style={styles.linkIcon}>{link.icon}</Text>
            <Text style={styles.linkText}>{link.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Regionals Screen Component
function RegionalsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://shoutingfire.com/event/feed/');
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const feed = await rssParser.parse(responseText);
      setEvents(feed.items || []);
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      console.log('Error fetching events:', errorMessage);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = async (url: string) => {
    try {
      const result = await safeOpenUrl(url, Linking);
      if (!result.success) {
        console.warn('Failed to open event link:', result.error);
      }
    } catch (error) {
      console.log('Error opening event link:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Date unavailable';
    }
  };

  const stripHtml = (html: string) => {
    return extractTextFromHtml(html);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffd700" />
        <Text style={styles.status}>Loading events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.playButton} onPress={fetchEvents}>
          <Text style={styles.playButtonIcon}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.regionalsContainer} contentContainerStyle={styles.regionalsContent}>
      <Text style={styles.title}>Regional Events</Text>
      {events.length === 0 ? (
        <Text style={styles.description}>No events available at the moment.</Text>
      ) : (
        events.map((event, index) => (
          <TouchableOpacity
            key={event.id || index}
            style={styles.eventCard}
            onPress={() => handleEventPress(event.links[0]?.url || '')}
          >
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.eventDate}>
                {formatDate(event.published)}
              </Text>
            </View>
            {event.description && (
              <Text style={styles.eventDescription} numberOfLines={3}>
                {stripHtml(event.description)}
              </Text>
            )}
            <View style={styles.eventFooter}>
              <Text style={styles.eventLink}>Tap to view details →</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// Now On Air Component


export default Sentry.wrap(function App() {
  const [activeTab, setActiveTab] = useState('listen');

  // Load saved tab state on app start
  useEffect(() => {
    const loadSavedTab = async () => {
      const savedTab = await Storage.load('activeTab');
      if (savedTab) {
        setActiveTab(savedTab);
      }
    };
    
    loadSavedTab();
  }, []);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    // Save the active tab
    await Storage.save('activeTab', tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'listen':
        return <ListenScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'schedule':
        return <ScheduleScreen />;
      case 'regionals':
        return <RegionalsScreen />;
      case 'links':
        return <LinksScreen />;
      default:
        return <ListenScreen />;
    }
  };

  return (
    <AudioProvider>
      <View style={styles.appContainer}>
        <StatusBar style="light" />
        
        {/* Header with Audio Player */}
        <AppHeader />

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'listen' && styles.activeTab]}
            onPress={() => handleTabChange('listen')}
          >
            <Text style={[styles.tabText, activeTab === 'listen' && styles.activeTabText]}>
              Listen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => handleTabChange('chat')}
          >
            <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
              Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
            onPress={() => handleTabChange('schedule')}
          >
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>
              Schedule
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'regionals' && styles.activeTab]}
            onPress={() => handleTabChange('regionals')}
          >
            <Text style={[styles.tabText, activeTab === 'regionals' && styles.activeTabText]}>
              Regionals
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'links' && styles.activeTab]}
            onPress={() => handleTabChange('links')}
          >
            <Text style={[styles.tabText, activeTab === 'links' && styles.activeTabText]}>
              Links
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderTabContent()}
        </View>
      </View>
    </AudioProvider>
  );
});

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#ffd700',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#ffd700',
    position: 'relative',
    zIndex: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ffd700',
  },
  tabText: {
    fontSize: 12,
    color: '#ffd700',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffd700',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#ffd700',
  },
  status: {
    marginTop: 8, // was 16
    fontSize: 14, // was 16
    color: '#ffd700',
  },
  currentSongText: {
    marginTop: 8,
    fontSize: 12,
    color: '#ffd700',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 8,
    textAlign: 'center',
  },
  songHistoryContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    maxWidth: 900,
    borderWidth: 1,
    borderColor: '#ffd700',
    padding: 0,
    maxHeight: 300,
  },
  songHistoryScroll: {
    maxHeight: 300,
  },
  songHistoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#444',
  },
  lastSongHistoryItem: {
    borderBottomWidth: 0,
  },
  songHistoryText: {
    fontSize: 14,
    color: '#ffd700',
    lineHeight: 18,
    flex: 1,
  },
  spotifyButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  spotifyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  chatContainer: {
    width: '100%',
    height: 500,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2d2d2d',
  },
  calendarContainer: {
    width: '100%',
    height: 600,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2d2d2d',
  },
  webview: {
    flex: 1,
    backgroundColor: '#2d2d2d',
  },
  linksContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  linkIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  linkText: {
    fontSize: 16,
    color: '#ffd700',
    fontWeight: '500',
  },
  listenContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
    minHeight: 0,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.3,
    zIndex: 1,
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 2,
    position: 'relative',
    minHeight: 0,
  },
  playButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonIcon: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  responsiveContainer: {
    flexDirection: 'column',
    width: '100%',
    maxWidth: 900,
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 8, // was 24, now much tighter
    paddingVertical: 8, // add a little vertical padding
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
    marginBottom: 8, // was 24, now tighter
    paddingVertical: 0, // remove extra padding
  },
  historySection: {
    flex: 1,
    minWidth: 300,
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 0, // remove extra margin
  },
  historyTitle: {
    fontSize: 16, // was 18
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 4, // was 8
    textAlign: 'center',
  },
  regionalsContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  regionalsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  eventCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd700',
    flex: 1,
    marginRight: 12,
  },
  eventDate: {
    fontSize: 12,
    color: '#ffd700',
    opacity: 0.8,
    textAlign: 'right',
  },
  eventDescription: {
    fontSize: 14,
    color: '#ffd700',
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.9,
  },
  eventFooter: {
    alignItems: 'flex-end',
  },
  eventLink: {
    fontSize: 12,
    color: '#ffd700',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  nowOnAirContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  onAirCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  onAirBackground: {
    width: '100%',
    height: 300,
  },
  onAirOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onAirContent: {
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  onAirTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  onAirDJ: {
    fontSize: 18,
    color: '#ffd700',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.9,
  },
  onAirTime: {
    fontSize: 16,
    color: '#ffd700',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  onAirFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  onAirLink: {
    fontSize: 14,
    color: '#ffd700',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  // Header styles
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerPlayButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlayButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  headerNowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  headerNowPlayingText: {
    fontSize: 12,
    color: '#ffd700',
    flex: 1,
    marginRight: 8,
  },
  headerSpotifyButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  headerSpotifyButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  // Listen screen section styles
  nowOnAirSection: {
    marginBottom: 30,
    width: '100%',
    maxWidth: 900,
  },
  recentSongsSection: {
    marginBottom: 20,
    width: '100%',
    maxWidth: 900,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 15,
    textAlign: 'center',
  },
  scrollContent: {
    justifyContent: 'center',
    padding: 20,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  songHistoryContent: {
    padding: 0,
  },
});