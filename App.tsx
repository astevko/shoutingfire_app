import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
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
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load saved state on component mount
  useEffect(() => {
    const loadSavedState = async () => {
      const savedState = await Storage.load('audioState');
      if (savedState && savedState.isPlaying) {
        // Auto-resume if it was playing before
        handlePlayPause();
      }
    };
    
    loadSavedState();
  }, []);

  // Fetch current song info
  useEffect(() => {
    const fetchCurrentSong = async () => {
      try {
        const response = await fetch('https://shoutingfire-ice.streamguys1.com/smartmetadata-live', {
          method: 'HEAD',
        });

        if (response.ok) {
          // Try to get song metadata from headers or show stream info
          const icyName = response.headers.get('icy-name');
          const icyGenre = response.headers.get('icy-genre');
          const icyDescription = response.headers.get('icy-description');
          
          if (icyName || icyGenre || icyDescription) {
            const metadata = [icyName, icyGenre, icyDescription].filter(Boolean).join(' - ');
            setCurrentSong(metadata);
          } else {
            setCurrentSong('Live Radio - Currently Playing');
          }
        }
      } catch (e) {
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
        const { sound } = await Audio.Sound.createAsync(
          { uri: STREAM_URL },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying ?? false);
            } else if (status.error) {
              setError('Playback error: ' + status.error);
              setIsPlaying(false);
            }
          }
        );
        soundRef.current = sound;
        setIsPlaying(true);
        // Save state
        await Storage.save('audioState', { isPlaying: true });
      } catch (e) {
        setError('Could not load stream.');
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
    <View style={styles.container}>
      <Text style={styles.title}>ShoutingFire Radio</Text>
      <Text style={styles.description}>Streaming via smartmetadata-live</Text>
      {isLoading && <ActivityIndicator size="large" color="#ffd700" />}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title={isPlaying ? 'Pause' : 'Play'}
        onPress={handlePlayPause}
        disabled={isLoading}
      />
      <Text style={styles.status}>
        {isLoading
          ? 'Buffering...'
          : isPlaying
          ? 'Playing live stream'
          : 'Paused'}
      </Text>
      {currentSong && (
        <View style={styles.songInfo}>
          <Text style={styles.songText}>{currentSong}</Text>
        </View>
      )}
    </View>
  );
}

// Chat Component
function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Chat</Text>
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
      default:
        return <ListenScreen />;
    }
  };

  return (
    <View style={styles.appContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ShoutingFire Radio</Text>
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
    fontSize: 16,
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
});
