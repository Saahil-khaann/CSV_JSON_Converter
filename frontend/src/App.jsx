import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { UserModal } from './components/UserModal';
import { FileUploader } from './components/FileUploader';
import { DataPreview } from './components/DataPreview';
import { HistorySearch } from './components/HistorySearch';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { useUserSession } from './hooks/useUserSession';
import { useConverter } from './hooks/useConverter';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('converter');
  
  const {
    currentUser,
    allUsers,
    isModalOpen,
    setIsModalOpen,
    registerUser,
    switchUser,
    error: userError
  } = useUserSession();

  const {
    file,
    setFile,
    converting,
    result,
    error: convertError,
    latestLatency,
    removeDuplicates,
    setRemoveDuplicates,
    targetFormat,
    setTargetFormat,
    convertFile,
    downloadPickle,
    reset
  } = useConverter();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenUserModal={() => setIsModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '0 24px 40px', flex: 1 }}>
        
        {/* Global Error Banner */}
        {(userError || convertError) && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid var(--accent-rose)',
            padding: '14px 20px',
            borderRadius: '14px',
            color: 'var(--accent-rose)',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}>
            <AlertCircle size={18} />
            <span>{userError || convertError}</span>
          </div>
        )}

        {/* Tab 1: Converter & Preview */}
        {activeTab === 'converter' && (
          <div>
            <FileUploader
              file={file}
              setFile={setFile}
              onConvert={convertFile}
              converting={converting}
              currentUser={currentUser}
              removeDuplicates={removeDuplicates}
              setRemoveDuplicates={setRemoveDuplicates}
              targetFormat={targetFormat}
              setTargetFormat={setTargetFormat}
            />

            {result && (
              <DataPreview
                result={result}
                latency={latestLatency}
                onDownload={downloadPickle}
              />
            )}
          </div>
        )}

        {/* Tab 2: History & Search */}
        {activeTab === 'history' && (
          <HistorySearch onDownload={downloadPickle} />
        )}

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        PickleFoge &copy; 2026 | High-Performance Data Converter
      </footer>

      {/* User Registration Modal */}
      <UserModal  
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onRegister={registerUser}
        onSwitch={switchUser}
      />

    </div>
  );
}

export default App;
