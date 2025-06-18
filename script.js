let currentQuery = ""

function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll(".section")
  sections.forEach((section) => section.classList.remove("active"))

  // Show selected section
  document.getElementById(sectionName).classList.add("active")
}

function handleKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault()
    searchAnime()
  }
}

async function loadHeroContent() {
  // Add delay to respect API rate limits
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  // Load top anime
  try {
    const topResponse = await fetch("https://api.jikan.moe/v4/top/anime?limit=6")
    if (topResponse.ok) {
      const topData = await topResponse.json()
      displayHeroAnime(topData.data, "topAnime")
    } else {
      throw new Error("Failed to fetch top anime")
    }
  } catch (error) {
    console.error("Error loading top anime:", error)
    document.getElementById("topAnime").innerHTML =
      '<div style="grid-column: 1/-1; color: rgba(255,255,255,0.8); text-align: center;">Failed to load</div>'
  }

  // Wait before next API call
  await delay(1000)

  // Load trending anime (current season)
  try {
    const trendingResponse = await fetch("https://api.jikan.moe/v4/seasons/now?limit=6")
    if (trendingResponse.ok) {
      const trendingData = await trendingResponse.json()
      displayHeroAnime(trendingData.data, "trendingAnime")
    } else {
      throw new Error("Failed to fetch trending anime")
    }
  } catch (error) {
    console.error("Error loading trending anime:", error)
    document.getElementById("trendingAnime").innerHTML =
      '<div style="grid-column: 1/-1; color: rgba(255,255,255,0.8); text-align: center;">Failed to load</div>'
  }
}

function displayHeroAnime(animeList, containerId) {
  const container = document.getElementById(containerId)

  const animeCards = animeList
    .slice(0, 6)
    .map((anime) => {
      const title = anime.title || anime.title_english || "Unknown Title"
      const image = anime.images?.jpg?.image_url || "/placeholder.svg?height=160&width=120"
      const score = anime.score || "N/A"

      return `
            <div class="hero-anime-card" onclick="openAnimeModal(${anime.mal_id})">
                <img src="${image}" alt="${title}" class="hero-anime-image" onerror="this.src='/placeholder.svg?height=160&width=120'">
                <div class="hero-anime-title">${title}</div>
                ${score !== "N/A" ? `<div class="hero-anime-score">★ ${score}</div>` : ""}
            </div>
        `
    })
    .join("")

  container.innerHTML = animeCards
}

async function searchAnime() {
  const query = document.getElementById("searchInput").value.trim()
  if (!query) {
    alert("Please enter a search term")
    return
  }

  currentQuery = query
  const resultsContainer = document.getElementById("searchResults")

  // Show loading state
  resultsContainer.innerHTML = '<div class="loading">Searching for anime...</div>'

  // Make sure we're on the home section
  showSection("home")

  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.data && data.data.length > 0) {
      displayAnimeResults(data.data)
    } else {
      resultsContainer.innerHTML =
        '<div class="no-results">No anime found for your search. Try different keywords!</div>'
    }
  } catch (error) {
    console.error("Error fetching anime data:", error)
    resultsContainer.innerHTML =
      '<div class="no-results">Error loading anime data. Please check your connection and try again.</div>'
  }
}

function displayAnimeResults(animeList) {
  const resultsContainer = document.getElementById("searchResults")

  const animeGrid = animeList
    .map((anime) => {
      const title = anime.title || anime.title_english || "Unknown Title"
      const image = anime.images?.jpg?.image_url || "/placeholder.svg?height=200&width=150"
      const synopsis = anime.synopsis || "No synopsis available."
      const score = anime.score || "N/A"
      const episodes = anime.episodes || "Unknown"
      const status = anime.status || "Unknown"
      const year = anime.aired?.from ? new Date(anime.aired.from).getFullYear() : "Unknown"

      return `
            <div class="anime-card" onclick="openAnimeModal(${anime.mal_id})">
                <img src="${image}" alt="${title}" class="anime-image" onerror="this.src='/placeholder.svg?height=200&width=150'">
                <div class="anime-info">
                    <div class="anime-title">${title}</div>
                    <div class="anime-details">
                        <strong>Year:</strong> ${year} | <strong>Episodes:</strong> ${episodes} | <strong>Status:</strong> ${status}
                    </div>
                    <div class="anime-synopsis">${synopsis}</div>
                    ${score !== "N/A" ? `<div class="score">★ ${score}</div>` : ""}
                </div>
            </div>
        `
    })
    .join("")

  resultsContainer.innerHTML = `
        <h2 style="margin-bottom: 1rem; color: #1f2937;">Search Results for "${currentQuery}"</h2>
        <div class="anime-grid">${animeGrid}</div>
    `
}

async function openAnimeModal(animeId) {
  const modal = document.getElementById("animeModal")
  modal.classList.add("active")
  document.body.style.overflow = "hidden"

  // Show loading in modal
  document.getElementById("modalTitle").textContent = "Loading..."
  document.getElementById("modalDetails").innerHTML = '<div class="loading">Loading anime details...</div>'
  document.getElementById("modalSynopsis").textContent = ""
  document.getElementById("modalGenres").innerHTML = ""

  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch anime details")
    }

    const data = await response.json()
    const anime = data.data

    // Update modal content
    document.getElementById("modalImage").src =
      anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "/placeholder.svg?height=300&width=600"
    document.getElementById("modalImage").alt = anime.title
    document.getElementById("modalTitle").textContent = anime.title || "Unknown Title"

    // Create details grid
    const details = [
      { label: "Score", value: anime.score ? `★ ${anime.score}` : "N/A" },
      { label: "Episodes", value: anime.episodes || "Unknown" },
      { label: "Status", value: anime.status || "Unknown" },
      { label: "Year", value: anime.aired?.from ? new Date(anime.aired.from).getFullYear() : "Unknown" },
      { label: "Duration", value: anime.duration || "Unknown" },
      { label: "Rating", value: anime.rating || "Unknown" },
      { label: "Source", value: anime.source || "Unknown" },
      { label: "Studio", value: anime.studios?.[0]?.name || "Unknown" },
    ]

    document.getElementById("modalDetails").innerHTML = details
      .map(
        (detail) => `
            <div class="detail-item">
                <div class="detail-label">${detail.label}</div>
                <div class="detail-value">${detail.value}</div>
            </div>
        `,
      )
      .join("")

    // Add genres
    if (anime.genres && anime.genres.length > 0) {
      document.getElementById("modalGenres").innerHTML = anime.genres
        .map((genre) => `<span class="genre-tag">${genre.name}</span>`)
        .join("")
    }

    // Add synopsis
    document.getElementById("modalSynopsis").textContent = anime.synopsis || "No synopsis available."
  } catch (error) {
    console.error("Error loading anime details:", error)
    document.getElementById("modalTitle").textContent = "Error Loading Details"
    document.getElementById("modalDetails").innerHTML =
      '<div class="no-results">Failed to load anime details. Please try again.</div>'
  }
}

function closeModal(event) {
  if (event && event.target !== event.currentTarget) return

  const modal = document.getElementById("animeModal")
  modal.classList.remove("active")
  document.body.style.overflow = "auto"
}

// Close modal with Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal()
  }
})

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  showSection("home")
  loadHeroContent()
})
