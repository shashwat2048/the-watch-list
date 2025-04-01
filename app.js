document.addEventListener("DOMContentLoaded", () => {
    const movieInput = document.getElementById("movieInput");
    const searchBtn = document.getElementById("search-btn");
    const resultsSection = document.getElementById("results");
    const loader = document.getElementById("loader");
    const favoritesSection = document.getElementById("favorites-section");
    const favoritesContainer = document.getElementById("favorites");
    const toggleFavBtn = document.getElementById("toggleFavBtn");
    const header = document.querySelector("header");
    const movieModal = new bootstrap.Modal(document.getElementById("movieModal"));
    const modalTitle = document.getElementById("movieModalLabel");
    const modalPoster = document.getElementById("modalPoster");
    const modalOverview = document.getElementById("modalOverview");
    const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwM2IwNDcxOGEwN2Y1YTFhOWEyZDEyMTYxMGExYzI5YSIsIm5iZiI6MTc0MzUzMzgzOC4xMzUsInN1YiI6IjY3ZWMzNzBlYzU0NDIzM2Q4ZjJmYzZkZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.lWAXuoCKONRqB7HnKTVSLoqdAcRD1_k1y6dSYiitOPg';

    let favoriteIds = new Set();

    const apiOptions = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_TOKEN}`
      }
    };
    fetchPopularMovies();
    loadFavorites();
  
    movieInput.addEventListener("keypress",(e)=>{
        if(e.key === "Enter"){
            e.preventDefault();
            searchBtn.click();
        }
    });

    searchBtn.addEventListener("click", () => {
      const movieName = movieInput.value.trim();
      movieInput.value="";
      if (!movieName) {
        resultsSection.innerHTML = "<p class='error'>please enter a movie name.</p>";
        return;
      }
      favoritesSection.classList.add("d-none");
      resultsSection.innerHTML = "";
      showLoader();
      fetchMovie(movieName);
    });
  
    let favOpen = false;
    toggleFavBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if(favOpen){
        favOpen = false;
        favoritesSection.classList.add("d-none");
        resultsSection.innerHTML = "";
      } else {
        favOpen = true;
        favoritesSection.classList.remove("d-none");
        resultsSection.innerHTML = "";
        loadFavorites();
      }
    });

    header.addEventListener("click", (e) => {
      if(e.target.id !== "toggleFavBtn") {
        favoritesSection.classList.add("d-none");
        resultsSection.innerHTML = "";
        showLoader();
        fetchPopularMovies();
      }
    });
  
    async function fetchMovie(movieName) {
      const url = `https://api.themoviedb.org/3/search/movie?query=${
        movieName
      }&include_adult=false&language=en-US&page=1`;
      try {
        const res = await fetch(url, apiOptions);
        const data = await res.json();
        hideLoader();
        resultsSection.innerHTML = `<h4>Showing results for "${movieName}"...</h4>`
        displayResults(data.results);
      } catch (err) {
        console.error(err);
        hideLoader();
      }
    }

    async function fetchPopularMovies() {
      const url = 'https://api.themoviedb.org/3/movie/popular?language=en-US&page=1';
      try {
        const res = await fetch(url, apiOptions);
        const data = await res.json();
        hideLoader();
        resultsSection.innerHTML = `<h3>Popular Movies</h3>`
        displayResults(data.results);
      } catch (err) {
        console.error(err);
        hideLoader();
      }
    }

    function displayResults(movies) {
      if (!movies || movies.length === 0) {
        resultsSection.innerHTML = `<p class="text-center">No movies found.</p>`;
        return;
      }
      movies.forEach(movie => {
        const col = document.createElement("div");
        col.className = "col-md-4 mb-3 position-relative";
  
        const card = document.createElement("div");
        card.className = "card bg-secondary text-light h-100 position-relative";
  
        const heartBtn = document.createElement("button");
        heartBtn.className = "heart-btn";
        heartBtn.innerHTML = favoriteIds.has(movie.id)
          ? '<i class="bi bi-heart-fill"></i>'
          : '<i class="bi bi-heart"></i>';
        if (favoriteIds.has(movie.id)) {
          heartBtn.classList.add("favorited");
        }
        heartBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!favoriteIds.has(movie.id)) {
            addToFavorites(movie.id)
              .then(() => {
                favoriteIds.add(movie.id);
                heartBtn.innerHTML = '<i class="bi bi-heart-fill"></i>';
                heartBtn.classList.add("favorited");
                loadFavorites();
              })
              .catch(err => console.error(err));
          } else {
            removeFromFavorites(movie.id)
              .then(() => {
                favoriteIds.delete(movie.id);
                heartBtn.innerHTML = '<i class="bi bi-heart"></i>';
                heartBtn.classList.remove("favorited");
                loadFavorites();
              })
              .catch(err => console.error(err));
          }
        });
  
        const img = document.createElement("img");
        img.className = "card-img-top";
        img.alt = movie.title;
        img.src = movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "movieAppIcon.png";
  
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        const title = document.createElement("h5");
        title.className = "card-title";
        title.textContent = movie.title;
  
        cardBody.appendChild(title);
        card.appendChild(heartBtn);
        card.appendChild(img);
        card.appendChild(cardBody);
        card.addEventListener("click", () => {
          openModal(movie);
        });
        col.appendChild(card);
        resultsSection.appendChild(col);
      });
    }
  
    async function addToFavorites(movieID) {
      const url = 'https://api.themoviedb.org/3/account/21920641/favorite';
      const postOptions = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({ media_type: 'movie', media_id: parseInt(movieID), favorite: true })
      };
      const response = await fetch(url, postOptions);
      const data = await response.json();
      console.log("Favorite added:", data);
    }

    async function removeFromFavorites(movieID) {
      const url = 'https://api.themoviedb.org/3/account/21920641/favorite';
      const postOptions = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({ media_type: 'movie', media_id: parseInt(movieID), favorite: false })
      };
      const response = await fetch(url, postOptions);
      const data = await response.json();
      console.log("Favorite removed:", data);
    }
  
    async function loadFavorites() {
      favoritesContainer.innerHTML = "";
      showLoader();
      const favorites = await getFavorites();
      hideLoader();
      favoriteIds.clear();
      if (!favorites || favorites.length === 0) {
        favoritesContainer.innerHTML = "<p class='text-center'>No favorite movies yet.</p>";
        return;
      }
      favorites.forEach(movie => {
        favoriteIds.add(movie.id);
        const col = document.createElement("div");
        col.className = "col-md-3 mb-3";
  
        const card = document.createElement("div");
        card.className = "card bg-secondary text-light h-100 position-relative";
  
        const img = document.createElement("img");
        img.className = "card-img-top";
        img.alt = movie.title;
        img.src = movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "movieAppIcon.png";
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        const title = document.createElement("h5");
        title.className = "card-title";
        title.textContent = movie.title;
        cardBody.appendChild(title);
  
        const heartBtn = document.createElement("button");
        heartBtn.className = "heart-btn";
        heartBtn.innerHTML = favoriteIds.has(movie.id)
          ? '<i class="bi bi-heart-fill"></i>'
          : '<i class="bi bi-heart"></i>';
        if (favoriteIds.has(movie.id)) {
          heartBtn.classList.add("favorited");
        }
        heartBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!favoriteIds.has(movie.id)) {
            addToFavorites(movie.id)
              .then(() => {
                favoriteIds.add(movie.id);
                heartBtn.innerHTML = '<i class="bi bi-heart-fill"></i>';
                heartBtn.classList.add("favorited");
                loadFavorites();
              })
              .catch(err => console.error(err));
          } else {
            removeFromFavorites(movie.id)
              .then(() => {
                favoriteIds.delete(movie.id);
                heartBtn.innerHTML = '<i class="bi bi-heart"></i>';
                heartBtn.classList.remove("favorited");
                loadFavorites();
              })
              .catch(err => console.error(err));
          }
        });
  
        card.appendChild(heartBtn);
        card.appendChild(img);
        card.appendChild(cardBody);
        card.addEventListener("click", () => {
          openModal(movie);
        });
        col.appendChild(card);
        favoritesContainer.appendChild(col);
      });
    }
  
    async function getFavorites() {
      const url = 'https://api.themoviedb.org/3/account/21920641/favorite/movies?language=en-US&page=1&sort_by=created_at.asc';
      try {
        const response = await fetch(url, apiOptions);
        const data = await response.json();
        console.log(data);
        return data.results;
      } catch (err) {
        console.error(err);
      }
    }
  
    function openModal(movie) {
      modalTitle.textContent = movie.title;
      modalOverview.textContent = movie.overview || "No overview available.";
      modalPoster.src = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "movieAppIcon.png";
      movieModal.show();
    }

    function showLoader() {
      loader.classList.remove("d-none");
    }
    function hideLoader() {
      loader.classList.add("d-none");
    }
});
