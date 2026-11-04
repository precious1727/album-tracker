import { useState } from "react";
import AlbumCard from "../components/AlbumCard.jsx";
import { useCollection } from "../context/CollectionContext.jsx";
import { getAlbumTracks, searchAlbums } from "../services/itunes.js";
import { getRecommendations } from "../services/ai.js";

const MIN_ALBUMS = 3;

export default function AiPicks({ openAlbum }) {
  const { albums, update } = useCollection();
  const [picks, setPicks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // No-AI Genre Recommender states
  const [genrePicks, setGenrePicks] = useState(null);
  const [topGenres, setTopGenres] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [genreError, setGenreError] = useState("");

  const saved = Object.values(albums);
  const ratedCount = saved.filter((a) => a.rating > 0).length;

  const ask = async () => {
    setLoading(true);
    setError("");
    try {
      const taste = [...saved]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 40)
        .map((a) => ({
          title: a.name,
          artist: a.artist,
          rating: a.rating,
          status: a.status,
        }));

      const { albums: suggestions } = await getRecommendations(taste);

      const found = await Promise.all(
        suggestions.map(async (s) => {
          const [match] = await searchAlbums(`${s.title} ${s.artist}`);
          return match ? { album: match, reason: s.reason } : null;
        })
      );

      const seen = new Set();
      setPicks(
        found.filter((f) => {
          if (
            !f ||
            albums[f.album.collectionId] ||
            seen.has(f.album.collectionId)
          )
            return false;
          seen.add(f.album.collectionId);
          return true;
        })
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Appendix C: No-AI recommender scoring primaryGenreName from ratings
  const recommendByGenre = async () => {
    setGenreLoading(true);
    setGenreError("");
    try {
      // Backfill primaryGenreName for any album saved prior to Extension 3
      const enriched = await Promise.all(
        saved.map(async (item) => {
          if (item.primaryGenreName) return item;
          try {
            const { album } = await getAlbumTracks(item.collectionId);
            const genre = album?.primaryGenreName ?? "";
            if (genre) update(item.collectionId, { primaryGenreName: genre });
            return { ...item, primaryGenreName: genre };
          } catch {
            return item;
          }
        })
      );

      // Score genres based on star ratings (unrated albums count as 2 points)
      const scores = {};
      for (const item of enriched) {
        const genre = item.primaryGenreName;
        if (!genre) continue;
        const weight = item.rating > 0 ? item.rating : 2;
        scores[genre] = (scores[genre] || 0) + weight;
      }

      const rankedGenres = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre, score]) => ({ genre, score }));

      if (rankedGenres.length === 0) {
        throw new Error("Could not find genre metadata for your saved albums.");
      }

      setTopGenres(rankedGenres);

      const resultsPerGenre = await Promise.all(
        rankedGenres.map(async ({ genre, score }) => {
          const res = await searchAlbums(genre);
          return res.slice(0, 8).map((album) => ({
            album,
            reason: `Top genre: ${genre} (score: ${score}★)`,
          }));
        })
      );

      const seen = new Set();
      const merged = resultsPerGenre.flat().filter((entry) => {
        const id = entry.album.collectionId;
        if (albums[id] || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      setGenrePicks(merged.slice(0, 12));
    } catch (e) {
      setGenreError(e.message);
    } finally {
      setGenreLoading(false);
    }
  };

  return (
    <section className="page">
      <h2 className="page-title">Recommendations</h2>
      {saved.length < MIN_ALBUMS ? (
        <p className="notice">
          Save at least {MIN_ALBUMS} albums to your collection so there's a
          listening pattern to learn from. You have {saved.length}.
        </p>
      ) : (
        <>
          <p className="notice">
            Based on the {saved.length} albums in your collection
            {ratedCount > 0 ? `, ${ratedCount} of them rated` : ""}.
            {ratedCount === 0 &&
              " Add star ratings on the album pages for better results."}
          </p>
          <div className="search">
            <button className="primary" onClick={ask} disabled={loading}>
              {loading
                ? "Analyzing your taste…"
                : picks
                ? "Get new AI picks"
                : "Get AI recommendations"}
            </button>
            <button
              className="btn-link"
              onClick={recommendByGenre}
              disabled={genreLoading}
            >
              {genreLoading
                ? "Scoring genres…"
                : "Get No-AI Genre Picks"}
            </button>
          </div>
        </>
      )}

      {error && <p className="notice error">{error}</p>}
      {picks?.length === 0 && (
        <p className="notice">
          No new matching albums found. Try again for a different set.
        </p>
      )}
      {picks && picks.length > 0 && (
        <>
          <h3 className="sub-title">AI Recommendations</h3>
          <div className="grid">
            {picks.map(({ album, reason }) => (
              <AlbumCard
                key={album.collectionId}
                title={album.collectionName}
                artist={album.artistName}
                art={album.artworkUrl100}
                meta={reason}
                onOpen={() => openAlbum(album.collectionId)}
              />
            ))}
          </div>
        </>
      )}

      {genreError && <p className="notice error">{genreError}</p>}
      {genrePicks && (
        <div className="genre-section">
          <h3 className="sub-title">
            No-AI Genre Picks (
            {topGenres.map((g) => `${g.genre}: ${g.score}★`).join(", ")})
          </h3>
          <div className="grid">
            {genrePicks.map(({ album, reason }) => (
              <AlbumCard
                key={album.collectionId}
                title={album.collectionName}
                artist={album.artistName}
                art={album.artworkUrl100}
                meta={reason}
                onOpen={() => openAlbum(album.collectionId)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}