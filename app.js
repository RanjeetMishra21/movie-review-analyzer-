const TMDB_API_KEY = "f13d037eb0499a60942e2ff48d4c05f6"; // Replace with your TMDb API key
async function validateMovieName(movieName) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}`
        );
        if (!response.ok) {
            throw new Error("Failed to fetch movie data.");
        }

        const data = await response.json();
        console.log("TMDb Response:", data); // Log response for debugging

        // Check if at least one result matches
        if (data.results && data.results.length > 0) {
            const movie = data.results[0]; // Use the first result
            return {
                title: movie.title,
                posterPath: `https://image.tmdb.org/t/p/w500${movie.poster_path}`, // Construct full poster URL
            };
        } else {
            return null; // No matching movie found
        }
    } catch (error) {
        console.error("Movie validation error:", error);
        return null; // Treat as invalid if API call fails
    }
}


async function analyzeSentiment() {
    const movieInput = document.getElementById("movieInput").value.trim();
    const reviewInput = document.getElementById("reviewInput").value.trim();
    const resultDiv = document.getElementById("result");

    resultDiv.innerHTML = ""; // Clear previous results

    // Validate inputs
    if (!movieInput) {
        resultDiv.innerHTML = "<p style='color: red;'>Please enter a movie name.</p>";
        return;
    }
    if (!reviewInput) {
        resultDiv.innerHTML = "<p style='color: red;'>Please enter a valid review.</p>";
        return;
    }

    resultDiv.innerHTML = "Validating movie name...";
    
    const movieDetails = await validateMovieName(movieInput);
    if (!movieDetails) {
        resultDiv.innerHTML = "<p style='color: red;'>The movie name entered is not valid. Please try again.</p>";
        return;
    }

    resultDiv.innerHTML = "Analyzing sentiment...";

    try {
        // Fetch sentiment analysis from Hugging Face API
        const response = await fetch("https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english", {
            method: "POST",
            headers: {
                "Authorization": "Bearer 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",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: reviewInput }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", errorText);
            throw new Error("Failed to analyze sentiment.");
        }

        const data = await response.json();
        console.log("API Response:", data); // Log full response for debugging

        // Check for the correct structure in the response
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length > 0) {
            const sentimentData = data[0][0]; // Access the first element in the nested array
            const sentiment = sentimentData.label || "Unknown";
            const confidence = sentimentData.score ? sentimentData.score.toFixed(2) : "0.00";

            resultDiv.innerHTML = `
                <p>Movie: <strong>${movieDetails.title}</strong></p>
                <img src="${movieDetails.posterPath}" alt="${movieDetails.title}" style="max-width: 200px; display: block; margin: 10px 0;">
                <p>Sentiment: <strong>${sentiment}</strong></p>
                <p>Confidence: <strong>${confidence}</strong></p>
            `;
        } else {
            throw new Error("Unexpected response structure.");
        }
    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = "<p style='color: red;'>An error occurred while analyzing the sentiment.</p>";
    }
}

