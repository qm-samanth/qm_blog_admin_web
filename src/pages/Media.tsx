import React from 'react';
import MediaManager from '../components/MediaManager';

export default function Media() {
  // Responsive styles for Media page (similar to Posts)
  const mediaResponsiveStyle = `
    @media (max-width: 700px) {
      .qm-media-container {
        padding: 10vw 2vw 24vw 2vw !important;
      }
      .qm-media-header {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 12px !important;
      }
      .qm-media-header h2 {
        font-size: 20px !important;
      }
    }
    @media (max-width: 400px) {
      .qm-media-header h2 {
        font-size: 16px !important;
      }
    }
  `;

  return (
    <div className="qm-media-container" style={{ padding: 32 }}>
      <style>{mediaResponsiveStyle}</style>
      <div className="qm-media-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>Media</h2>
      </div>
      <MediaManager />
    </div>
  );
}
