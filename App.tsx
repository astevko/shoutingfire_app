import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Audio } from 'expo-av';
import { useState, useRef, useEffect } from 'react';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage utility for cross-platform state persistence
const Storage = {
  async save(key: string, value: any) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log('Error saving to storage:', error);
    }
  },
  
  async load(key: string) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.log('Error loading from storage:', error);
      return null;
    }
  }
};

// Audio Player Component
function ListenScreen() {
  const STREAM_URL = 'https://shoutingfire-ice.streamguys1.com/smartmetadata-live';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [songHistory, setSongHistory] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
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

  // Fetch current song info
  useEffect(() => {
    const fetchCurrentSong = async () => {
      try {
        // Fetch from Icecast status page instead of stream headers
        const response = await fetch('https://shoutingfire-ice.streamguys1.com/status.xsl');
        
        if (response.ok) {
          const html = await response.text();
          
          // Look for the smartmetadata-live mount point and extract current song
          const smartMetadataMatch = html.match(/Mount Point \/smartmetadata-live[\s\S]*?Current Song:<\/td>\s*<td class="streamdata">([^<]+)<\/td>/);
          
          if (smartMetadataMatch && smartMetadataMatch[1]) {
            const songInfo = smartMetadataMatch[1].trim();
            if (songInfo && songInfo !== 'Shouting Fire is Currently Unavailable') {
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
            // Fallback: try to get any current song info
            const anySongMatch = html.match(/Current Song:<\/td>\s*<td class="streamdata">([^<]+)<\/td>/);
            if (anySongMatch && anySongMatch[1]) {
              const songInfo = anySongMatch[1].trim();
              if (songInfo && songInfo !== 'Shouting Fire is Currently Unavailable') {
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
          }
        } else {
          setCurrentSong('Live Radio - Currently Playing');
        }
      } catch (e) {
        console.log('Error fetching song info:', e);
        setCurrentSong('Live Radio - Currently Playing');
      }
    };

    fetchCurrentSong();
    
    // Update song info every 30 seconds
    const interval = setInterval(fetchCurrentSong, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = async () => {
    setError(null);
    
    // Enable audio on first interaction
    if (!audioEnabled) {
      setAudioEnabled(true);
    }
    
    if (isPlaying) {
      setIsPlaying(false);
      setIsLoading(true);
      try {
        await soundRef.current?.stopAsync();
        await soundRef.current?.unloadAsync();
        soundRef.current = null;
        // Save state
        await Storage.save('audioState', { isPlaying: false });
      } catch (e) {
        setError('Error stopping stream');
      }
      setIsLoading(false);
    } else {
      setIsLoading(true);
      try {
        // Initialize audio session for better compatibility
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: STREAM_URL },
          { shouldPlay: false }, // Don't auto-play initially
          (status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying ?? false);
            } else if ('error' in status && status.error) {
              setError('Playback error: ' + status.error);
              setIsPlaying(false);
            }
          }
        );
        soundRef.current = sound;
        
        // Try to play after a short delay to ensure user interaction
        setTimeout(async () => {
          try {
            await sound.playAsync();
            setIsPlaying(true);
            // Save state
            await Storage.save('audioState', { isPlaying: true });
          } catch (playError) {
            console.log('Play error:', playError);
            if (playError instanceof Error && playError.message.includes('autoplay')) {
              setError('Please tap play again to start streaming (browser autoplay policy)');
            } else {
              setError('Could not start playback. Please try again.');
            }
            setIsPlaying(false);
          }
        }, 100);
        
      } catch (e) {
        console.log('Stream loading error:', e);
        if (e instanceof Error && e.message.includes('autoplay')) {
          setError('Please tap play again to start streaming (browser autoplay policy)');
        } else {
          setError('Could not load stream. Please check your connection and try again.');
        }
        setIsPlaying(false);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  return (
    <View style={styles.listenContainer}>
      {/* Background Image */}
      <Image 
        source={require('./assets/sfire.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Content Overlay */}
      <View style={styles.contentOverlay}>
        {/* <Text style={styles.title}>ShoutingFire</Text> */}
        <Text style={styles.description}>Global Burner Radio Network</Text>
        {isLoading && <ActivityIndicator size="large" color="#ffd700" />}
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          title={isPlaying ? 'Pause' : audioEnabled ? 'Play' : 'Enable Audio'}
          onPress={handlePlayPause}
          disabled={isLoading}
        />
        <Text style={styles.status}>
          {isLoading
            ? 'Buffering...'
            : isPlaying
            ? 'Playing live stream'
            : audioEnabled
            ? 'Paused'
            : 'Tap to enable audio'}
        </Text>
        
        {/* Song History Panel */}
        <View style={styles.songHistoryContainer}>
          <ScrollView style={styles.songHistoryScroll} showsVerticalScrollIndicator={false}>
            {songHistory.length > 0 ? (
              songHistory.map((song, index) => (
                <View key={`${song}-${index}`} style={[
                  styles.songHistoryItem,
                  index === songHistory.length - 1 && styles.lastSongHistoryItem
                ]}>
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Text style={styles.songHistoryText}>
                      {song}
                    </Text>
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent(song)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: 8, fontSize: 12, color: '#1DB954', textDecoration: 'none', opacity: 0.8 }}
                      title="Search on Spotify"
                    >
                      Spotify
                    </a>
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
    </View>
  );
}

// Chat Component
function ChatScreen() {
  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Live Chat</Text> */}
      <Text style={styles.description}>
        Join the conversation with DJ and other listeners!
      </Text>
      <View style={styles.chatContainer}>
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
      </View>
    </View>
  );
}

// Links Component
function LinksScreen() {
  const socialLinks = [
    {
      name: 'ShoutingFire.com',
      url: 'https://www.shoutingfire.com/',
      icon: '🌐'
    },
    {
      name: 'X @Shouting_Fire',
      url: 'https://x.com/Shouting_Fire',
      icon: '🐦'
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
      name: 'Patreon',
      url: 'https://www.patreon.com/ShoutingFire',
      icon: '❤️'
    }
  ];

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
            onPress={() => window.open(link.url, '_blank')}
          >
            <Text style={styles.linkIcon}>{link.icon}</Text>
            <Text style={styles.linkText}>{link.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
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
      case 'links':
        return <LinksScreen />;
      default:
        return <ListenScreen />;
    }
  };

  return (
    <View style={styles.appContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ShoutingFire</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'listen' && styles.activeTab]}
          onPress={() => handleTabChange('listen')}
        >
          <Text style={[styles.tabText, activeTab === 'listen' && styles.activeTabText]}>🎵 Listen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => handleTabChange('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>💬 Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
          onPress={() => handleTabChange('schedule')}
        >
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>📅 Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'links' && styles.activeTab]}
          onPress={() => handleTabChange('links')}
        >
          <Text style={[styles.tabText, activeTab === 'links' && styles.activeTabText]}>🔗 Links</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#000',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ffd700',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
    minHeight: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderTopWidth: 2,
    borderTopColor: '#ffd700',
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
    marginTop: 16,
    fontSize: 16,
    color: '#ffd700',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#ffd700',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  errorNote: {
    fontSize: 12,
    color: '#ffd700',
    marginTop: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  songInfo: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    minWidth: 300,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  songText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#ffd700',
  },
  songHistoryContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 10,
    marginTop: 20,
    minWidth: 300,
    maxWidth: 400,
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
  },
  eventItem: {
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: 300,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  eventTime: {
    fontSize: 14,
    color: '#ffd700',
    marginTop: 5,
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
  scheduleContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scheduleContent: {
    alignItems: 'center',
    padding: 20,
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
});

