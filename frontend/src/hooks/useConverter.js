import { useState } from 'react';
import { apiClient } from '../services/api';

export function useConverter() {
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [latestLatency, setLatestLatency] = useState(null);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [targetFormat, setTargetFormat] = useState('pkl');

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setLatestLatency(null);
    setRemoveDuplicates(true);
    setTargetFormat('pkl');
  };

  const convertFile = async (selectedFile, userId, shouldRemoveDuplicates = removeDuplicates, selectedFormat = targetFormat) => {
    if (!selectedFile) return;
    if (!userId) {
      setError('Please select or register an active user session before converting.');
      return;
    }

    setConverting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_id', userId);
    formData.append('remove_duplicates', shouldRemoveDuplicates ? 'true' : 'false');
    formData.append('target_format', selectedFormat || 'pkl');

    try {
      const response = await apiClient.post('/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      setLatestLatency(response.latency);
    } catch (err) {
      setError(err.response?.data?.detail || 'File conversion failed.');
      if (err.latency) setLatestLatency(err.latency);
    } finally {
      setConverting(false);
    }
  };

  const downloadPickle = (fileId, filename, fmt = 'pkl') => {
    const downloadUrl = `http://localhost:8000/api/download/${fileId}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    const baseName = filename ? filename.split('.')[0] : 'converted_file';
    const extension = fmt ? fmt.toLowerCase() : 'pkl';
    link.setAttribute('download', `${baseName}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    file,
    setFile,
    converting,
    result,
    error,
    latestLatency,
    removeDuplicates,
    setRemoveDuplicates,
    targetFormat,
    setTargetFormat,
    convertFile,
    downloadPickle,
    reset
  };
}
