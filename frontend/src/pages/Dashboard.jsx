import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ShareModal from '../components/ShareModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [sharingBoard, setSharingBoard] = useState(null);
  const [error, setError] = useState('');

  //fetches all boards
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/whiteboards');
      setBoards(res.data.boards);
    } 
    catch (err) {
      setError('Could not load your boards.');
    } 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);


  //creating whiteboard
  const createBoard = async () => {
    const res = await api.post('/whiteboards', { title: 'Untitled board' });
    navigate(`/board/${res.data.board._id}`);
  };

  //renaming board
  const startRename = (board) => {
    setRenamingId(board._id);
    setRenameValue(board.title);
  };

  //runs when - user presses enter or clicks elsewhere
  const commitRename = async (id) => {
    if (renameValue.trim()) {
      await api.put(`/whiteboards/${id}`, { title: renameValue.trim() });
      //only update the current board
      setBoards(
        (prev) => 
        prev.map((b) => 
        (b._id === id ? { ...b, title: renameValue.trim() } : b)));
    }
    setRenamingId(null);
  };

  //delete board
  const removeBoard = async (id) => {
    if (!window.confirm('Delete this whiteboard? This cannot be undone.')) return;
    await api.delete(`/whiteboards/${id}`);

    setBoards((prev) => prev.filter((b) => b._id !== id));
  };


  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="brand-mark">
          <span className="brand-dot" />
          Boardroom
        </div>
        <div className="dashboard-header-actions">
          <Link to="/profile" className="user-chip">
            <span className="avatar-circle">{user?.name?.[0]?.toUpperCase()}</span>
            {user?.name}
          </Link>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-toolbar">
          <h1>Your boards</h1>
          <button className="btn btn-primary" onClick={createBoard}>+ New whiteboard</button>
        </div>

        {error && <div className="form-error">{error}</div>}

       
        {
        loading ? ( 
          <div className="empty-state">Loading boards…</div>
        ) 
        :boards.length === 0 ? 
        (
          <div className="empty-state">
            <p>No boards yet. Create your first whiteboard to start sketching.</p>
            <button className="btn btn-primary" onClick={createBoard}>+ New whiteboard</button>
          </div>
          
        ) 
        :
         (
          <div className="board-grid">
            {boards.map((board) => (
              <div className="board-card" key={board._id}>
                <div className="board-card-preview" onClick={() => navigate(`/board/${board._id}`)}>
                  <div className="board-card-grid" />
                </div>
                <div className="board-card-body">
                  {renamingId === board._id ? (
                    <input
                      autoFocus
                      className="rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(board._id)}
                      onKeyDown={(e) => e.key === 'Enter' && commitRename(board._id)}
                    />
                  ) : (
                    <h3 onClick={() => navigate(`/board/${board._id}`)}>{board.title}</h3>
                  )}

                  <p className="board-card-meta">
                    {board.owner._id === user._id ? 'Owned by you' : `Shared by ${board.owner.name}`} ·{' '}
                    {new Date(board.updatedAt).toLocaleDateString()}
                  </p>
                  
                  <div className="board-card-actions">
                    <button onClick={() => startRename(board)} title="Rename">Rename</button>
                    {board.owner._id === user._id && (
                      <>
                        <button onClick={() => setSharingBoard(board)} title="Share">Share</button>
                        <button className="danger" onClick={() => removeBoard(board._id)} title="Delete">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {sharingBoard && (
        <ShareModal
          board={sharingBoard}
          onClose={() => setSharingBoard(null)}
          onUpdated={(updated) =>
            setBoards((prev) => prev.map((b) => (b._id === updated._id ? updated : b)))
          }
        />
      )}
    </div>
  );
}
