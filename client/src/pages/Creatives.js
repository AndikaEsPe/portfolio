import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../config';

function Creatives() {
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global search
  const [searchTerm, setSearchTerm] = useState('');

  // Per-section filters: category → tag (same pattern for all 3)
  const [photoCategoryFilter, setPhotoCategoryFilter] = useState('all');
  const [photoTagFilter, setPhotoTagFilter] = useState('all');

  const [videoCategoryFilter, setVideoCategoryFilter] = useState('all');
  const [videoTagFilter, setVideoTagFilter] = useState('all');

  const [othersCategoryFilter, setOthersCategoryFilter] = useState('all');
  const [othersTagFilter, setOthersTagFilter] = useState('all');

  // Flip cards & video player
  const [flippedCards, setFlippedCards] = useState({});
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [photoRes, videoRes, othersRes] = await Promise.all([
        axios.get(`${API_URL}/api/photography`),
        axios.get(`${API_URL}/api/videos`),
        axios.get(`${API_URL}/api/creatives`)
      ]);
      
      setPhotos(photoRes.data.filter(p => p.featured));
      setVideos(videoRes.data.filter(v => v.featured));
      setOthers(othersRes.data.filter(o => o.featured));
    } catch (error) {
      console.error('Error fetching creatives:', error);
      if (error.response?.status === 429) {
        setError('Too many requests. Please wait a moment and refresh the page.');
      } else {
        setError('Failed to load creative works. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFlip = (id) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper: check if item matches global search
  const matchesSearch = (item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term) ||
      (item.category || '').toLowerCase().includes(term) ||
      (item.tags || []).some(t => t.toLowerCase().includes(term))
    );
  };

  // =============================================
  // PHOTOGRAPHY: categories + scoped tags
  // =============================================
  const photoCategories = useMemo(() => {
    return [...new Set(photos.map(p => p.category).filter(Boolean))];
  }, [photos]);

  const photoTags = useMemo(() => {
    let scoped = photos;
    if (photoCategoryFilter !== 'all') {
      scoped = photos.filter(p => p.category === photoCategoryFilter);
    }
    return [...new Set(scoped.flatMap(p => p.tags || []))].filter(Boolean);
  }, [photos, photoCategoryFilter]);

  const filteredPhotos = useMemo(() => {
    return photos
      .filter(matchesSearch)
      .filter(p => photoCategoryFilter === 'all' || p.category === photoCategoryFilter)
      .filter(p => photoTagFilter === 'all' || (p.tags || []).includes(photoTagFilter));
  }, [photos, searchTerm, photoCategoryFilter, photoTagFilter]);

  // Reset tag when category changes
  useEffect(() => { setPhotoTagFilter('all'); }, [photoCategoryFilter]);

  // =============================================
  // VIDEOGRAPHY: categories + scoped tags
  // =============================================
  const videoCategories = useMemo(() => {
    return [...new Set(videos.map(v => v.category).filter(Boolean))];
  }, [videos]);

  const videoTags = useMemo(() => {
    let scoped = videos;
    if (videoCategoryFilter !== 'all') {
      scoped = videos.filter(v => v.category === videoCategoryFilter);
    }
    return [...new Set(scoped.flatMap(v => v.tags || []))].filter(Boolean);
  }, [videos, videoCategoryFilter]);

  const filteredVideos = useMemo(() => {
    return videos
      .filter(matchesSearch)
      .filter(v => videoCategoryFilter === 'all' || v.category === videoCategoryFilter)
      .filter(v => videoTagFilter === 'all' || (v.tags || []).includes(videoTagFilter));
  }, [videos, searchTerm, videoCategoryFilter, videoTagFilter]);

  useEffect(() => { setVideoTagFilter('all'); }, [videoCategoryFilter]);

  // =============================================
  // OTHERS: categories + scoped tags
  // =============================================
  const othersCategories = useMemo(() => {
    return [...new Set(others.map(o => o.category).filter(Boolean))];
  }, [others]);

  const othersTags = useMemo(() => {
    let scoped = others;
    if (othersCategoryFilter !== 'all') {
      scoped = others.filter(o => o.category === othersCategoryFilter);
    }
    return [...new Set(scoped.flatMap(o => o.tags || []))].filter(Boolean);
  }, [others, othersCategoryFilter]);

  const filteredOthers = useMemo(() => {
    return others
      .filter(matchesSearch)
      .filter(o => othersCategoryFilter === 'all' || o.category === othersCategoryFilter)
      .filter(o => othersTagFilter === 'all' || (o.tags || []).includes(othersTagFilter));
  }, [others, searchTerm, othersCategoryFilter, othersTagFilter]);

  useEffect(() => { setOthersTagFilter('all'); }, [othersCategoryFilter]);

  // =============================================
  // Section visibility
  // =============================================
  const hasPhotos = photos.length > 0;
  const hasVideos = videos.length > 0;
  const hasOthers = others.length > 0;

  const showPhotos = hasPhotos && (filteredPhotos.length > 0 || !searchTerm);
  const showVideos = hasVideos && (filteredVideos.length > 0 || !searchTerm);
  const showOthers = hasOthers && (filteredOthers.length > 0 || !searchTerm);

  const totalResults = filteredPhotos.length + filteredVideos.length + filteredOthers.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const FilterButtons = ({ options, active, onSelect, label }) => {
    if (options.length === 0) return null;
    return (
      <div className="creatives-filter-row">
        {label && <span className="creatives-filter-label">{label}</span>}
        <div className="creatives-filter-buttons">
          <button
            onClick={() => onSelect('all')}
            className={`filter-btn ${active === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`filter-btn ${active === opt ? 'active' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading creatives...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1 className="page-title">Creatives</h1>
        <p className="page-subtitle">My creative outlet</p>
        <div className="empty-state">
          <h3>⚠️ {error}</h3>
        </div>
      </div>
    );
  }

  if (!hasPhotos && !hasVideos && !hasOthers) {
    return (
      <motion.div
        className="page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="page-title">Creatives</h1>
        <p className="page-subtitle">My creative outlet</p>
        <div className="empty-state">
          <h3>Coming soon</h3>
          <p>Creative works will be showcased here. Stay tuned!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="page-title">Creatives</h1>
        <p className="page-subtitle">My creative outlet — photography, videography, and more</p>
      </motion.div>

      {/* GLOBAL SEARCH */}
      <div className="creatives-search">
        <input
          type="text"
          placeholder="Search all creatives..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="creatives-search-input"
        />
        {searchTerm && (
          <p className="creatives-search-results">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
            <button onClick={() => setSearchTerm('')} className="creatives-search-clear">Clear</button>
          </p>
        )}
      </div>

      {/* No results message */}
      {searchTerm && totalResults === 0 && (
        <div className="empty-state">
          <h3>No results found</h3>
          <p>Try adjusting your search term</p>
        </div>
      )}

      {/* ==================== PHOTOGRAPHY ==================== */}
      {showPhotos && (
        <section className="creatives-section">
          <motion.h2
            className="creatives-section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Photography
            {searchTerm && <span className="section-count">({filteredPhotos.length})</span>}
          </motion.h2>

          <FilterButtons
            options={photoCategories}
            active={photoCategoryFilter}
            onSelect={setPhotoCategoryFilter}
            label="Category"
          />
          <FilterButtons
            options={photoTags}
            active={photoTagFilter}
            onSelect={setPhotoTagFilter}
            label="Tag"
          />

          {filteredPhotos.length === 0 ? (
            <p className="section-no-results">No photos match the current filters.</p>
          ) : (
            <motion.div
              className="photo-flip-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {filteredPhotos.map((photo) => (
                <motion.div
                  key={photo._id}
                  className={`photo-flip-card ${flippedCards[photo._id] ? 'flipped' : ''}`}
                  variants={itemVariants}
                  onClick={() => toggleFlip(photo._id)}
                >
                  <div className="photo-flip-inner">
                    <div className="photo-flip-front">
                      <img src={photo.imageUrl} alt={photo.title} loading="lazy" />
                      <div className="photo-flip-hint">
                        <span>Tap to see details</span>
                      </div>
                    </div>
                    <div className="photo-flip-back">
                      <h3>{photo.title}</h3>
                      {photo.description && <p className="photo-flip-desc">{photo.description}</p>}
                      {photo.category && (
                        <span className="photo-flip-category">
                          {photo.category.charAt(0).toUpperCase() + photo.category.slice(1)}
                        </span>
                      )}
                      <a 
                        href={photo.imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="photo-flip-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Full Image →
                      </a>
                      {photo.tags && photo.tags.length > 0 && (
                        <div className="photo-flip-tags">
                          {photo.tags.map((tag, i) => (
                            <span key={i} className="photo-flip-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      )}

      {/* ==================== VIDEOGRAPHY ==================== */}
      {showVideos && (
        <section className="creatives-section">
          <motion.h2
            className="creatives-section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Videography
            {searchTerm && <span className="section-count">({filteredVideos.length})</span>}
          </motion.h2>

          <FilterButtons
            options={videoCategories}
            active={videoCategoryFilter}
            onSelect={setVideoCategoryFilter}
            label="Category"
          />
          <FilterButtons
            options={videoTags}
            active={videoTagFilter}
            onSelect={setVideoTagFilter}
            label="Tag"
          />

          {filteredVideos.length === 0 ? (
            <p className="section-no-results">No videos match the current filters.</p>
          ) : (
            <motion.div
              className="video-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {filteredVideos.map((video) => (
                <motion.div
                  key={video._id}
                  className="video-card"
                  variants={itemVariants}
                >
                  {activeVideo === video._id ? (
                    <div className="video-player">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="video-thumbnail" onClick={() => setActiveVideo(video._id)}>
                      <img 
                        src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                        alt={video.title}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                        }}
                      />
                      <div className="video-play-btn">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                          <circle cx="24" cy="24" r="24" fill="rgba(0,0,0,0.6)" />
                          <polygon points="19,14 19,34 35,24" fill="white" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="video-info">
                    <h3>{video.title}</h3>
                    {video.description && <p>{video.description}</p>}
                    <div className="video-meta-row">
                      {video.category && <span className="video-category">{video.category}</span>}
                      {video.tags && video.tags.length > 0 && (
                        <div className="video-tags">
                          {video.tags.map((tag, i) => (
                            <span key={i} className="video-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      )}

      {/* ==================== OTHERS ==================== */}
      {showOthers && (
        <section className="creatives-section">
          <motion.h2
            className="creatives-section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Others
            {searchTerm && <span className="section-count">({filteredOthers.length})</span>}
          </motion.h2>

          <FilterButtons
            options={othersCategories}
            active={othersCategoryFilter}
            onSelect={setOthersCategoryFilter}
            label="Category"
          />
          <FilterButtons
            options={othersTags}
            active={othersTagFilter}
            onSelect={setOthersTagFilter}
            label="Tag"
          />

          {filteredOthers.length === 0 ? (
            <p className="section-no-results">No items match the current filters.</p>
          ) : (
            <motion.div
              className="others-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {filteredOthers.map((item) => (
                <motion.div
                  key={item._id}
                  className="others-card"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  {item.imageUrl && (
                    <div className="others-card-image">
                      <img src={item.imageUrl} alt={item.title} loading="lazy" />
                    </div>
                  )}
                  <div className="others-card-content">
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                    {item.category && <span className="others-category">{item.category}</span>}
                    {item.linkUrl && (
                      <a 
                        href={item.linkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="others-link"
                      >
                        View →
                      </a>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="others-tags">
                        {item.tags.map((tag, i) => (
                          <span key={i} className="others-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      )}
    </motion.div>
  );
}

export default Creatives;