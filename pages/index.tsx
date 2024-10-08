import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaFileImage, FaFilePdf, FaFileAlt, FaDownload, FaTrash, FaShareAlt, FaCog, FaSearch, FaList, FaThLarge } from 'react-icons/fa';
import { useIdleTimer } from 'react-idle-timer';
import { FileUploader } from '../components/FileUploader';
import ConfirmModal from '../components/ConfirmModal';
import StorageChart from '../components/StorageChart';
import styles from '../styles/Dashboard.module.css';

type FileType = {
  name: string;
  size: string;
  url: string;
};

type FilesByFormatType = {
  [key: string]: {
    files: FileType[];
    totalSize: number;
  };
};

export default function Dashboard() {
  const [filesByFormat, setFilesByFormat] = useState<FilesByFormatType>({});
  const [filteredFiles, setFilteredFiles] = useState<FilesByFormatType>({});
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    capacity: 100 * 1024, // Capacity in MB
    totalFiles: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<string>(''); // Updated state for sort type
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [layoutMode, setLayoutMode] = useState('list'); // State for layout mode
  const [showIdleModal, setShowIdleModal] = useState(false); // State for idle warning modal
  const [logoutTimer, setLogoutTimer] = useState<NodeJS.Timeout | null>(null); // Timer for automatic logout
  const router = useRouter();

  // Idle timer logic
  const handleOnIdle = () => {
    setShowIdleModal(true); // Show the idle warning modal
    const timer = setTimeout(() => {
      handleLogout();
    }, 60000); // 1 minute
    setLogoutTimer(timer);
  };

  const handleStayConnected = () => {
    setShowIdleModal(false); // Hide the idle warning modal
    if (logoutTimer) clearTimeout(logoutTimer); // Clear the logout timer
  };

  const idleTimer = useIdleTimer({
    timeout: 1000 * 60 * 14, // 14 minutes before showing the warning
    onIdle: handleOnIdle,
    debounce: 500,
  });

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify-token', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUserId(data.user.id);
        setUsername(data.user.username);
        fetchFiles(data.user.id);
        fetchStorageInfo();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed', error);
      router.push('/login');
    }
  };

  checkAuth();
}, []);


  // Fetch storage info (current storage and max storage)
  const fetchStorageInfo = async () => {
    try {
      const response = await fetch('/api/storage-info', {
        credentials: 'include', // Include cookies with the request
      });

      const data = await response.json();

      if (response.ok) {
        // Correctly update the storage information, including total files
        setStorageInfo({
          used: data.currentStorage / (1024 * 1024), // Convert from bytes to MB
          capacity: data.maxStorage / (1024 * 1024), // Convert from bytes to MB
          totalFiles: data.totalFiles || 0, // Update total files if available
        });
      } else {
        console.error('Failed to fetch storage info:', data.error);
        if (response.status === 401) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Error fetching storage info:', error);
    }
  };

  const fetchFiles = async (userId: string) => {
    try {
      const response = await fetch(`/api/fetchFiles?userId=${userId}`, {
        credentials: 'include', // Include cookies with the request
      });

      if (response.ok) {
        const { filesByFormat, totalFiles, totalSize } = await response.json();
        setFilesByFormat(filesByFormat);
        setFilteredFiles(filesByFormat);

        // Correctly update the used storage and total files
        setStorageInfo((prevInfo) => ({
          ...prevInfo,
          used: totalSize / (1024 * 1024), // Convert from bytes to MB
          totalFiles,
        }));
      } else {
        const errorData = await response.json();
        console.error('Error fetching files:', errorData.error);
        if (response.status === 401) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleDeleteClick = (fileName: string) => {
    setFileToDelete(fileName);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
      try {
        const response = await fetch(`/api/deleteFile?name=${encodeURIComponent(fileToDelete)}&userId=${userId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) {
          fetchFiles(userId!); // Refresh the file list after deletion
        } else {
          const errorData = await response.json();
          console.error('Error deleting file:', errorData.error);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      } finally {
        setIsModalOpen(false);
        setFileToDelete(null);
      }
    }
  };

  const handleShareClick = async (fileName: string) => {
    try {
      const response = await fetch(`/api/shareFile?name=${encodeURIComponent(fileName)}&userId=${userId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setShareLink(data.url);
        setIsShareModalOpen(true);
      } else {
        const errorData = await response.json();
        console.error('Error generating share link:', errorData.error);
      }
    } catch (error) {
      console.error('Error generating share link:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  

  const handleTwoFactorSubmit = async () => {
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: twoFactorToken, userId }),
      });

      if (response.ok) {
        setRequires2FA(false); // Disable 2FA prompt after successful verification
      } else {
        const errorData = await response.json();
        console.error('Invalid 2FA token:', errorData.error);
      }
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
    }
  };

  const getFileTypeIcon = (fileName: string) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <FaFileImage className={styles.fileIcon} />;
    } else if (fileName.match(/\.(pdf)$/i)) {
      return <FaFilePdf className={styles.fileIcon} />;
    } else if (fileName.match(/\.(xlsx|csv)$/i)) {
      return <FaFileAlt className={styles.fileIcon} />;
    } else {
      return <FaFileAlt className={styles.fileIcon} />;
    }
  };

  const calculatePercentage = (used: number, capacity: number) => {
    return (used / capacity) * 100;
  };

  const formatStorage = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
    return `${sizeInMB.toFixed(2)} MB`;
  };

  const extractFileName = (filePath: string) => {
    return filePath.split('/').pop();
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard - File Vaults Manager</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <nav className={styles.nav}>
          <h1 className={styles.logo}>File Vaults Manager</h1>
          <ul className={styles.navLinks}>
            <li><Link href="/landing">Home</Link></li>
            <li><Link href="/plans">Plans</Link></li>
            <li><Link href="/settings">Settings</Link></li>
            <li>
              <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
            </li>
          </ul>
        </nav>
      </header>

      <main className={styles.main}>
        {requires2FA && (
          <div className={styles.twoFactorContainer}>
            <h3>Enter 2FA Token</h3>
            <input
              type="text"
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value)}
              className={styles.twoFactorInput}
            />
            <button onClick={handleTwoFactorSubmit} className={styles.twoFactorButton}>
              Submit
            </button>
          </div>
        )}

        {!requires2FA && (
          <>
            <div className={styles.storageInfo}>
              <div className={styles.storageDetails}>
                <p className={styles.username}>Hello, {username}</p>
                <div className={styles.storageStats}>
                  <div className={styles.storageStat}>
                    <span className={styles.storageStatValue}>{formatStorage(storageInfo.used)}</span>
                    <span className={styles.storageStatLabel}>used</span>
                  </div>
                  <div className={styles.storageStat}>
                    <span className={styles.storageStatValue}>{formatStorage(storageInfo.capacity - storageInfo.used)}</span>
                    <span className={styles.storageStatLabel}>remaining</span>
                  </div>
                  <div className={styles.storageStat}>
                    <span className={styles.storageStatValue}>{storageInfo.totalFiles}</span>
                    <span className={styles.storageStatLabel}>total files</span>
                  </div>
                </div>
              </div>
              <div className={styles.chartContainer}>
                <StorageChart used={storageInfo.used} capacity={storageInfo.capacity} />
              </div>
            </div>

            <div className={styles.fileTypeSummary}>
              {Object.keys(filesByFormat).map((format, index) => (
                <div key={index} className={styles.fileTypeItem}>
                  <div className={styles.iconContainer}>
                    {getFileTypeIcon(format)}
                  </div>
                  <div className={styles.fileTypeText}>
                    <span>{format.toUpperCase()}</span>
                    <span>{formatStorage(filesByFormat[format].totalSize)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.searchAndSortContainer}>
              <div className={styles.searchContainer}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.sortContainer}>
                <select
                  className={styles.sortSelect}
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                >
                  <option value="">Sort by Type</option>
                  <option value="image">Images</option>
                  <option value="pdf">PDFs</option>
                  <option value="document">Documents</option>
                  <option value="other">Others</option>
                </select>
              </div>
            </div>

            <div className={styles.layoutSwitchContainer}>
              <button onClick={() => setLayoutMode('list')} className={styles.layoutButton}>
                <FaList />
              </button>
              <button onClick={() => setLayoutMode('grid')} className={styles.layoutButton}>
                <FaThLarge />
              </button>
            </div>

            <div className={`${styles.fileList} ${layoutMode === 'grid' ? styles.gridLayout : ''}`}>
              <h2>Your Files</h2>
              {Object.keys(filteredFiles).length > 0 ? (
                Object.entries(filteredFiles).map(([format, data]) => (
                  <div key={format} className={styles.fileFormatSection}>
                    <h3>{format.toUpperCase()} Files ({data.files.length})</h3>
                    <ul className={styles.fileListSection}>
                      {data.files.map((file, index) => (
                        <li key={index} className={`${styles.fileItem} ${layoutMode === 'grid' ? styles.gridItem : ''}`}>
                          <div className={styles.fileIconContainer}>
                            {getFileTypeIcon(file.name)}
                          </div>
                          <div className={styles.fileDetails}>
                            <span className={styles.fileName} title={`File: ${extractFileName(file.name)}\nSize: ${file.size}`}>
                              {extractFileName(file.name)}
                            </span>
                            <span className={styles.fileSize}>{file.size}</span>
                          </div>
                          {file.url && (
                            <div className={styles.fileActions}>
                              <button
                                className={styles.actionButton}
                                onClick={() => handleDownload(file.url)}
                                title="Download"
                              >
                                <FaDownload />
                              </button>
                              <button
                                className={styles.actionButton}
                                onClick={() => handleShareClick(file.name)}
                                title="Share"
                              >
                                <FaShareAlt />
                              </button>
                              <button
                                className={styles.actionButton}
                                onClick={() => handleDeleteClick(file.name)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p>Total size for {format.toUpperCase()} files: {formatStorage(data.totalSize)}</p>
                  </div>
                ))
              ) : (
                <p className={styles.noFilesMessage}>Your storage is currently empty.</p>
              )}
            </div>

            <div className={styles.uploadContainer}>
              <h2>Upload Files</h2>
              {userId && (
                <FileUploader
                  userId={userId}
                  onUploadSuccess={(result) => {
                    fetchFiles(userId); // Refresh the file list after a successful upload
                  }}
                />
              )}
            </div>
          </>
        )}
      </main>

      <ConfirmModal
        show={isModalOpen}
        message={`Are you sure you want to delete "${extractFileName(fileToDelete || '')}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsModalOpen(false)}
      />

      {/* Idle Warning Modal */}
      {showIdleModal && (
        <div className={styles.idleModal}>
          <div className={styles.idleModalContent}>
            <h2>Are you still there?</h2>
            <p>You will be logged out due to inactivity. Click "Stay Connected" to remain logged in.</p>
            <button className={styles.stayConnectedButton} onClick={handleStayConnected}>
              Stay Connected
            </button>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <p>&copy; 2024 SwiftInfoTech.com.au. All rights reserved.</p>
        <ul className={styles.footerLinks}>
          <li><Link href="/contact">Contact</Link></li>
          <li><Link href="/privacypolicy">Privacy Policy</Link></li>
        </ul>
      </footer>
    </div>
  );
}
