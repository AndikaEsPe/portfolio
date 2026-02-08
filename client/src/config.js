// API Configuration
// This file centralizes the API URL configuration
// In development: uses localhost:5000
// In production: uses your deployed API URL

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';