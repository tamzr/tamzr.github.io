const API_KEY = 'AIzaSyACDTjRZu753g6WSyv9W1JSHODQgD3PDGI';

function extractVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|\S+\/?v=|(?:.*[?&]v=))([^"&?/ ]{11}))/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function getVideoDetails(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items[0].snippet.title;
}

async function getVideoComments(videoId) {
  const comments = [];
  let nextPageToken = null;

  do {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&pageToken=${nextPageToken || ''}&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      data.items.forEach(item => {
        const topComment = item.snippet.topLevelComment.snippet.textDisplay;
        const commentId = item.snippet.topLevelComment.id;

        comments.push({
          comment: topComment,
          commentId: commentId,
          replies: item.replies ? item.replies.comments : []
        });
      });

      nextPageToken = data.nextPageToken;
    } catch (error) {
      console.error("Error fetching data from YouTube API:", error);
    }
  } while (nextPageToken);

  return comments;
}

function checkForUTTPWarningGniyd(comments, videoId) {
  const relevantItems = [];

  comments.forEach(comment => {
    if (comment.comment.toLowerCase().includes("gniyd")) {
      relevantItems.push({
        link: `https://www.youtube.com/watch?v=${videoId}&lc=${comment.commentId}`,
        text: comment.comment,
        type: 'Comment'
      });
    }

    comment.replies.forEach(reply => {
      const replyText = reply.snippet.textDisplay.toLowerCase();
      if (replyText.includes("uttp") && replyText.includes("warning")) {
        const replyLink = `https://www.youtube.com/watch?v=${videoId}&lc=${reply.id}`;
        relevantItems.push({
          link: replyLink,
          text: reply.snippet.textDisplay
        });
      }
    });
  });

  return relevantItems;
}

document.getElementById('fetchCommentsBtn').addEventListener('click', async () => {
  const videoUrl = document.getElementById('videoUrl').value;
  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    alert('Please enter a valid YouTube video URL.');
    return;
  }

  const videoTitle = await getVideoDetails(videoId);
  document.getElementById('videoTitle').textContent = `Title: ${videoTitle}`;

  const comments = await getVideoComments(videoId);

  const relevantItems = checkForUTTPWarningGniyd(comments, videoId);

  const outputDiv = document.getElementById('output');
  if (relevantItems.length > 0) {
    outputDiv.innerHTML = "<h2>All UTTP replies on this video:</h2>";
    relevantItems.forEach(item => {
      outputDiv.innerHTML += `
        <p><a href="${item.link}" target="_blank">${item.text}</a></p>
        <hr>
      `;
    });
  } else {
    outputDiv.innerHTML = "<p>No UTTP replies were found.</p>";
  }
});
