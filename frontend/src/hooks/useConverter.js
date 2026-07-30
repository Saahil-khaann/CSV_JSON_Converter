import { useState } from 'react';
import { apiClient, API_BASE_URL } from '../services/api';

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
    const downloadUrl = `${API_BASE_URL}/api/download/${fileId}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    const baseName = filename ? filename.split('.')[0] : 'converted_file';
    const extension = fmt ? fmt.toLowerCase() : 'pkl';
    link.setAttribute('download', `${baseName}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addRecordRow = async (fileId, newRow) => {
    try {
      setError(null);
      const res = await apiClient.post(`/api/records/${fileId}`, newRow);
      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          row_count: res.data.row_count,
          pickle_size_bytes: res.data.pickle_size_bytes,
          preview_rows: res.data.rows,
          raw_output_snippet: res.data.raw_output_snippet
        };
      });
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add row.');
      return false;
    }
  };

  const updateRecordRow = async (fileId, rowIndex, updatedRow) => {
    try {
      setError(null);
      const res = await apiClient.put(`/api/records/${fileId}/${rowIndex}`, updatedRow);
      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          row_count: res.data.row_count,
          pickle_size_bytes: res.data.pickle_size_bytes,
          preview_rows: res.data.rows,
          raw_output_snippet: res.data.raw_output_snippet
        };
      });
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update row.');
      return false;
    }
  };

  const deleteRecordRow = async (fileId, rowIndex) => {
    try {
      setError(null);
      const res = await apiClient.delete(`/api/records/${fileId}/${rowIndex}`);
      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          row_count: res.data.row_count,
          pickle_size_bytes: res.data.pickle_size_bytes,
          preview_rows: res.data.rows,
          raw_output_snippet: res.data.raw_output_snippet
        };
      });
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete row.');
      return false;
    }
  };

  return {
    file,
    setFile,
    converting,
    result,
    setResult,
    error,
    latestLatency,
    removeDuplicates,
    setRemoveDuplicates,
    targetFormat,
    setTargetFormat,
    convertFile,
    downloadPickle,
    addRecordRow,
    updateRecordRow,
    deleteRecordRow,
    reset
  };
}
