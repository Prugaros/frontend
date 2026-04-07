import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import AuthService from '../services/auth.service';
import BroadcastService from '../services/broadcast.service';
import './BroadcastModal.component.css';

// Helper: format a duration in ms to a human-readable string
function formatDuration(ms) {
  if (ms <= 0) return null;
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function BroadcastModal({ onClose }) {
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');       // relative path from backend
  const [bannerPreview, setBannerPreview] = useState(''); // full URL for <img>
  const [includeShopLink, setIncludeShopLink] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [subscriberInfo, setSubscriberInfo] = useState(null); // { count, batchSize, batchDelayMs }
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { success, message }
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

  // Fetch subscriber count + batch settings on mount
  useEffect(() => {
    BroadcastService.getSubscriberCount()
      .then(res => setSubscriberInfo(res.data))
      .catch(() => setSubscriberInfo(null));
  }, []);

  // Compute ETA string (null if no delay or only 1 batch)
  const etaString = React.useMemo(() => {
    if (!subscriberInfo) return null;
    const { count, batchSize, batchDelayMs } = subscriberInfo;
    if (!batchDelayMs || batchDelayMs <= 0) return null;
    const totalBatches = Math.ceil(count / batchSize);
    if (totalBatches <= 1) return null;
    const totalDelayMs = (totalBatches - 1) * batchDelayMs;
    return formatDuration(totalDelayMs);
  }, [subscriberInfo]);

  // ── Image upload helpers ───────────────────────────────────────────────────
  const uploadFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('images', file);
      const res = await axios.post(
        `${backendUrl}/api/upload/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...AuthService.getAuthHeader(),
          },
        }
      );
      const relativePath = res.data.imageUrls[0];
      setBannerUrl(relativePath);
      setBannerPreview(`${backendUrl}${relativePath}`);
    } catch (err) {
      setUploadError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [backendUrl]);

  const handleFileChange = (e) => uploadFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggingOver(false);
    uploadFile(e.dataTransfer.files[0]);
  };

  const removeBanner = () => {
    setBannerUrl('');
    setBannerPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!subject.trim() || !bodyText.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await BroadcastService.send({
        subject: subject.trim(),
        bodyText: bodyText.trim(),
        featuredImageUrl: bannerUrl || undefined,
        includeShopLink,
      });
      setResult({ success: true, message: res.data.message });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send broadcast.';
      setResult({ success: false, message: msg });
    } finally {
      setSending(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const canSend = subject.trim() && bodyText.trim() && !sending && !uploading;

  return (
    <div className="bm-backdrop" onClick={handleBackdropClick}>
      <div className="bm-modal" role="dialog" aria-modal="true" aria-labelledby="bm-title">

        {/* ── Header ── */}
        <div className="bm-header">
          <div className="bm-title-row">
            <span className="bm-icon">📢</span>
            <h2 id="bm-title" className="bm-title">Send Broadcast Email</h2>
          </div>
          <button className="bm-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Subscriber pill + ETA ── */}
        {subscriberInfo !== null && (
          <div className="bm-subscriber-pill">
            <span className="bm-pill-dot" />
            <span>
              Will be sent to{' '}
              <strong>{(subscriberInfo.count ?? 0).toLocaleString()}</strong>{' '}
              subscriber{subscriberInfo.count !== 1 ? 's' : ''}
              {etaString && (
                <span className="bm-eta">
                  {' '}· batched over ~{etaString}
                </span>
              )}
            </span>
          </div>
        )}

        {/* ── Form ── */}
        <div className="bm-body">

          {/* Subject */}
          <div className="bm-field">
            <label htmlFor="bm-subject" className="bm-label">Subject Line</label>
            <input
              id="bm-subject"
              type="text"
              className="bm-input"
              placeholder="e.g. 🛍️ New Group Order Now Open!"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={sending}
            />
          </div>

          {/* Body */}
          <div className="bm-field">
            <label htmlFor="bm-body" className="bm-label">Email Content</label>
            <textarea
              id="bm-body"
              className="bm-textarea"
              placeholder="Write your message here..."
              value={bodyText}
              onChange={e => setBodyText(e.target.value)}
              disabled={sending}
              rows={7}
            />
          </div>

          {/* Shop link toggle */}
          <div className="bm-field">
            <label className="bm-checkbox-row" htmlFor="bm-shop-link">
              <span className="bm-custom-checkbox">
                <input
                  id="bm-shop-link"
                  type="checkbox"
                  checked={includeShopLink}
                  onChange={e => setIncludeShopLink(e.target.checked)}
                  disabled={sending}
                />
                <span className="bm-checkmark" />
              </span>
              <span className="bm-checkbox-label">
                Include personalized shop link
                <span className="bm-checkbox-hint">
                  Adds a "Shop Now →" button with each customer's unique store link
                </span>
              </span>
            </label>
          </div>

          {/* Banner image */}
          <div className="bm-field">
            <label className="bm-label">
              Banner Image <span className="bm-optional">(optional)</span>
            </label>

            {bannerPreview ? (
              <div className="bm-preview-wrap">
                <img src={bannerPreview} alt="Banner preview" className="bm-preview-img" />
                <button className="bm-remove-btn" onClick={removeBanner} disabled={sending}>
                  Remove Image
                </button>
              </div>
            ) : (
              <div
                className={`bm-dropzone${draggingOver ? ' bm-dropzone--over' : ''}${uploading ? ' bm-dropzone--uploading' : ''}`}
                onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
                onDragLeave={() => setDraggingOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="bm-uploading">
                    <div className="bm-spinner" />
                    <span>Uploading…</span>
                  </div>
                ) : (
                  <>
                    <span className="bm-dropzone-icon">🖼️</span>
                    <span className="bm-dropzone-text">Drag & drop or <u>browse</u></span>
                    <span className="bm-dropzone-hint">PNG, JPG, WebP — max 20 MB</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="bm-file-input"
                  onChange={handleFileChange}
                  disabled={uploading || sending}
                />
              </div>
            )}

            {uploadError && <p className="bm-error">{uploadError}</p>}
          </div>
        </div>

        {/* ── Result banner ── */}
        {result && (
          <div className={`bm-result ${result.success ? 'bm-result--success' : 'bm-result--error'}`}>
            <span>{result.success ? '✅' : '❌'}</span>
            <span>{result.message}</span>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="bm-footer">
          <button className="bm-cancel-btn" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            id="bm-send-btn"
            className="bm-send-btn"
            onClick={handleSend}
            disabled={!canSend}
          >
            {sending ? (
              <><div className="bm-spinner bm-spinner--sm" /> Sending…</>
            ) : (
              '📤 Send Broadcast'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
