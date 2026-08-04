import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import Canvas from '../components/Canvas';
import CollaboratorBar from '../components/CollaboratorBar';
import ShareModal from '../components/ShareModal';

export default function WhiteboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const [titleValue, setTitleValue] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [collaborators, setCollaborators] = useState([]);
  const [sharing, setSharing] = useState(false); //if sharing popup is avaialable
  const titleTimer = useRef(null); //to debounce title updates - one request is send after typing stops

  useEffect(() => {
    api
      .get(`/whiteboards/${id}`)
      .then((res) => {
        setBoard(res.data.board);
        setTitleValue(res.data.board.title);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not open this board'));
  }, [id]);

  //runs whenever title changes
  const commitTitle = (value) => {
    setTitleValue(value);
    clearTimeout(titleTimer.current);
    
    titleTimer.current = setTimeout(() => {
      api.put(`/whiteboards/${id}`, { title: value });
    }, 700);
  };

  if (error) {
    return (
      <div className="full-screen-center">
        <div>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to boards
          </button>
        </div>
      </div>
    );
  }

  if (!board) return <div className="full-screen-center">Opening board…</div>;

  return (
    <div className="board-page">
      <header className="board-header">
        <button className="icon-back" onClick={() => navigate('/dashboard')} title="Back to boards">←</button>
        {editingTitle ? (
          <input
            autoFocus
            className="board-title-input"
            value={titleValue}
            onChange={(e) => commitTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
          />
        ) : (
          <h1 className="board-title" onClick={() => setEditingTitle(true)} title="Click to rename">
            {titleValue}
          </h1>
        )}
        <span className={`save-indicator ${saveStatus}`}>
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save failed' : 'Saved'}
        </span>
        <div className="board-header-spacer" />
        <CollaboratorBar collaborators={collaborators} connected={connected} />
        <button className="btn btn-ghost" onClick={() => setSharing(true)}>Share</button>
      </header>

      <Canvas
        boardId={id}
        initialData={board.data}
        socket={socket}
        onCollaboratorsChange={setCollaborators}
        onSaveStatus={setSaveStatus}
      />

      {sharing && (
        <ShareModal board={board} onClose={() => setSharing(false)} onUpdated={setBoard} />
      )}
    </div>
  );
}
