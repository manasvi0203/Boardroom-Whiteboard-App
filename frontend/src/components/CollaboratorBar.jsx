import React from 'react';

export default function CollaboratorBar({ collaborators, connected }) {
  return (
    <div className="collaborator-bar">

      {/*assigns classname according to connected status(true/false)*/}
      <span className={`live-dot 
        ${connected 
          ? 'live' 
          : 'offline'}`} />

      
      <span className="collaborator-bar-label">{
         connected 
         ? 'Live' 
         : 'Reconnecting…'}
        </span>

      {/*Groups all collaborators avatar together showing only first letter of their names*/}
      <div className="collaborator-avatars">
        {collaborators.map((c) => (
          <span
            key={c.socketId}
            className="avatar-circle small"
            style={{ background: c.color }}
            title={c.name}
          >
            {c.name?.[0]?.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

