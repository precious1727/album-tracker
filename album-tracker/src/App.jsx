import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Player from "./components/Player.jsx";
import Discover from "./pages/Discover.jsx";
import AlbumDetail from "./pages/AlbumDetail.jsx";
import Collection from "./pages/Collection.jsx";
import AiPicks from "./pages/AiPicks.jsx";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const openAlbum = (id) => navigate(`/album/${id}`);

  return (
    <>
      <Navbar />
      <main>
        {/* Keep Discover mounted so search results survive navigation */}
        <div hidden={location.pathname !== "/"}>
          <Discover openAlbum={openAlbum} />
        </div>
        <Routes>
          <Route path="/" element={null} />
          <Route
            path="/album/:id"
            element={<AlbumDetail back={() => navigate(-1)} />}
          />
          <Route
            path="/collection"
            element={<Collection openAlbum={openAlbum} />}
          />
          <Route
            path="/recommendations"
            element={<AiPicks openAlbum={openAlbum} />}
          />
        </Routes>
      </main>
      <Player />
    </>
  );
}