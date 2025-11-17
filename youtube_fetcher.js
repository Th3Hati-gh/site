// AIzaSyD4fVXGNsKp72bBZzjVr-RjyQrveWmeV50


// YouTube Data API Fetcher for Channel Videos
// You need to get an API key from: https://console.cloud.google.com/apis/credentials

const API_KEY = 'AIzaSyD4fVXGNsKp72bBZzjVr-RjyQrveWmeV50';
const CHANNEL_USERNAME = 'TheHati';

async function getChannelId(username) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${username}&key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            return data.items[0].id;
        }
        
        // If forUsername doesn't work, try custom URL search
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${API_KEY}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (searchData.items && searchData.items.length > 0) {
            return searchData.items[0].id.channelId;
        }
        
        throw new Error('Channel not found');
    } catch (error) {
        console.error('Error fetching channel ID:', error);
        throw error;
    }
}

async function getChannelVideos(channelId, maxResults = 50) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.items) {
            throw new Error('No videos found');
        }
        
        // Get video IDs to fetch statistics
        const videoIds = data.items.map(item => item.id.videoId).join(',');
        
        // Fetch video statistics (views, etc.)
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${API_KEY}`;
        const statsResponse = await fetch(statsUrl);
        const statsData = await statsResponse.json();
        
        // Create a map of video statistics
        const statsMap = {};
        statsData.items.forEach(item => {
            statsMap[item.id] = item.statistics;
        });
        
        // Format data as requested
        const videosFromDB = data.items.map((item, index) => {
            const videoId = item.id.videoId;
            const stats = statsMap[videoId] || {};
            const publishedDate = new Date(item.snippet.publishedAt);
            
            // Format date in Russian style: "16 ноября 2025"
            const months = [
                'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
            ];
            const formattedDate = `${publishedDate.getDate()} ${months[publishedDate.getMonth()]} ${publishedDate.getFullYear()}`;
            
            return {
                id: index + 1,
                link: `https://youtu.be/${videoId}`,
                name: item.snippet.title,
                channel: CHANNEL_USERNAME.toLowerCase(),
                view: parseInt(stats.viewCount) || 0,
                date: formattedDate,
                previe: item.snippet.thumbnails.maxres?.url || 
                        item.snippet.thumbnails.high?.url || 
                        item.snippet.thumbnails.medium.url
            };
        });
        
        return videosFromDB;
    } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
    }
}

// Function to download JSON file in browser
function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 4);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Global variable to store videos
let videosFromDB = [];

// Main function to get all data
async function fetchChannelData() {
    try {
        console.log(`Fetching data for channel: ${CHANNEL_USERNAME}`);
        
        // Get channel ID
        const channelId = await getChannelId(CHANNEL_USERNAME);
        console.log(`Channel ID: ${channelId}`);
        
        // Get videos
        const videos = await getChannelVideos(channelId);
        
        console.log(`Found ${videos.length} videos`);
        
        // Save to global variable
        videosFromDB = videos;
        
        return videos;
    } catch (error) {
        console.error('Error:', error);
    }
}

// Execute and make data available
fetchChannelData();

window.videosReady = fetchChannelData()

// Example usage after data loads:
// console.log(videosFromDB); // View all videos
// console.log(videosFromDB[0]); // First video
// console.log(videosFromDB.length); // Number of videos

// Example output format:
// const videosFromDB = [
//     {
//         "id": 1,
//         "link": "https://youtu.be/0BRe6i-7RhY",
//         "name": "Набор на сервер ютуберов — КОР",
//         "channel": "thehati",
//         "view": 2245,
//         "date": "16 ноября 2025",
//         "previe": "https://i.ytimg.com/vi/0BRe6i-7RhY/maxresdefault.jpg"
//     }
// ];