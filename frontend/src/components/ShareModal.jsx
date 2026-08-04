import React, { useState } from 'react';
import api from '../api/axios';

//props -> board - current board, onclose - function to close the modal, 
// onupdated - called whenever collaborators change
export default function ShareModal({ board, onClose, onUpdated }) {
  const [email, setEmail] = useState('');  //input mail
  const [error, setError] = useState(''); 
  const [busy, setBusy] = useState(false); //tracks api request

  const addCollaborator = async (e) => {
    e.preventDefault(); //prevent refresh
    setError(''); //clear prev error
    setBusy(true);
    try {
      const res = await api.post(`/whiteboards/${board._id}/share`, { email });
      onUpdated(res.data.board);  //update parent
      setEmail('');
    } 
    catch (err) {
      setError(err.response?.data?.message || 'Could not share board');
    } 
    finally {
      setBusy(false);
    }
  };

  const removeCollaborator = async (userId) => {
    const res = await api.delete(`/whiteboards/${board._id}/share/${userId}`);
    onUpdated(res.data.board);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>

      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Share "{board.title}"</h2>

        <p className="modal-sub">Invite a teammate by the email they registered with.</p>
        {error && <div className="form-error">{error}</div>}

        <form onSubmit={addCollaborator} className="share-form">
          <input
            type="email"
            required
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary" disabled={busy} type="submit">Invite</button>
        </form>

        <div className="collaborator-list">
          {(board.collaborators || []).length === 0 && (
            <p className="modal-sub">No one else has access yet.</p>
          )}
          
          {(board.collaborators || []).map((c) => (
            <div className="collaborator-row" key={c._id}>
              <span>{c.name} <span className="dim">({c.email})</span></span>
              <button className="link-danger" onClick={() => removeCollaborator(c._id)}>Remove</button>
            </div>
          ))}
        </div>

        <button className="btn btn-ghost btn-block" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
