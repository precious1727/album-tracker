import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AlbumPlayback from "../components/AlbumPlayback.jsx";
import StatusSelect from "../components/StatusSelect.jsx";
import Stars from "../components/Stars.jsx";
import { useCollection } from "../context/CollectionContext.jsx";
import useLocalStorage from "../hooks/useLocalStorage.js";
import {
  bigArt,
  getAlbumTracks,
  spotifySearchUrl,
  youtubeSearchUrl,
} from "../services/itunes.js";

// Extract the Spotify album ID from a pasted link or URI
function extractSpotifyAlbumId(input = "") {
  const match = input.trim().match(/album[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export default function AlbumDetail({ albumId: propAlbumId, back }) {
  const { id: routeId } = useParams();
  const albumId = routeId || propAlbumId;

  const { albums, save, update, remove } = useCollection();
  const [spotifyLinks, setSpotifyLinks] = useLocalStorage(
    "album-tracker:spotify-links",
    {}
  );
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!albumId) return;
    setData(null);
    setError("");
    getAlbumTracks(albumId)
      .then((res) => {
        setData(res);
        // Backfill primaryGenreName if this album was saved before Extension 3
        if (
          res.album &&
          albums[res.album.collectionId] &&
          !albums[res.album.collectionId].primaryGenreName
        ) {
          update(res.album.collectionId, {
            primaryGenreName: res.album.primaryGenreName ?? "",
          });
        }
      })
      .catch((e) => setError(e.message));
  }, [albumId]);

  if (error)
    return (
      <section className="page">
        <p className="notice error">{error}</p>
      </section>
    );
  if (!data)
    return (
      <section className="page">
        <p className="notice">Loading album...</p>
      </section>
    );

  const { album, tracks } = data;
  const saved = albums[album.collectionId];
  const spotifyUrl = spotifyLinks[album.collectionId] ?? "";
  const spotifyEmbedId = extractSpotifyAlbumId(spotifyUrl);

  const handleSpotifyChange = (val) => {
    setSpotifyLinks((prev) => ({
      ...prev,
      [album.collectionId]: val,
    }));
  };

  return (
    <section className="page">
      <button className="link-btn" onClick={back}>
        ← Back
      </button>
      <div className="detail-head">
        <img
          src={bigArt(album.artworkUrl100, 500)}
          alt={`${album.collectionName} cover`}
        />
        <div>
          <h2 className="page-title">{album.collectionName}</h2>
          <p className="detail-artist">{album.artistName}</p>
          <p className="card-meta">
            {album.releaseDate?.slice(0, 4)} · {album.primaryGenreName} ·{" "}
            {album.trackCount} tracks
          </p>
          <div className="where">
            <span>Listen on</span>
            <a
              href={spotifySearchUrl(album.collectionName, album.artistName)}
              target="_blank"
              rel="noreferrer"
            >
              Spotify
            </a>
            <a
              href={youtubeSearchUrl(album.collectionName, album.artistName)}
              target="_blank"
              rel="noreferrer"
            >
              YouTube
            </a>
            {album.collectionViewUrl && (
              <a
                href={album.collectionViewUrl}
                target="_blank"
                rel="noreferrer"
              >
                Apple Music
              </a>
            )}
          </div>

          {saved ? (
            <div className="tracker">
              <StatusSelect
                value={saved.status}
                onChange={(status) => update(album.collectionId, { status })}
              />
              <Stars
                value={saved.rating}
                onChange={(rating) => update(album.collectionId, { rating })}
              />
              <textarea
                value={saved.notes}
                onChange={(e) =>
                  update(album.collectionId, { notes: e.target.value })
                }
                placeholder="Notes about this album"
                rows={3}
              />
              <button
                className="link-btn danger"
                onClick={() => remove(album.collectionId)}
              >
                Remove from collection
              </button>
            </div>
          ) : (
            <button className="primary" onClick={() => save(album)}>
              Save to collection
            </button>
          )}

          {/* Appendix C: Spotify Embed Link Field */}
          <div className="spotify-box">
            <input
              type="url"
              value={spotifyUrl}
              onChange={(e) => handleSpotifyChange(e.target.value)}
              placeholder="Paste a Spotify album link (https://open.spotify.com/album/...)"
              aria-label="Spotify album link"
            />
            {spotifyUrl && !spotifyEmbedId && (
              <p className="card-meta">
                Paste a valid Spotify album URL containing /album/ID to load the player.
              </p>
            )}
          </div>
        </div>
      </div>

      {spotifyEmbedId && (
        <div className="spotify-embed">
          <iframe
            title="Spotify album player"
            src={`https://open.spotify.com/embed/album/${spotifyEmbedId}?utm_source=generator`}
            width="100%"
            height="352"
            style={{ border: 0, borderRadius: 12 }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}

      <AlbumPlayback
        title={album.collectionName}
        artist={album.artistName}
        tracks={tracks}
      />
    </section>
  );
}