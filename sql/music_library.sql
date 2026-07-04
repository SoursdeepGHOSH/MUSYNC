-- Music Library Database Schema for XAMPP MySQL
-- Run this script in phpMyAdmin or MySQL command line

CREATE DATABASE IF NOT EXISTS music_library;
USE music_library;

-- Table to store media file metadata
CREATE TABLE IF NOT EXISTS media_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    file_type ENUM('audio', 'video') NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    duration INT DEFAULT 0 COMMENT 'Duration in seconds',
    title VARCHAR(255),
    artist VARCHAR(255) DEFAULT 'Unknown Artist',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(500) NOT NULL,
    
    INDEX idx_file_type (file_type),
    INDEX idx_upload_date (upload_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional)
-- INSERT INTO media_files (filename, original_name, file_type, mime_type, file_size, title, artist, file_path)
-- VALUES ('sample.mp3', 'My Song.mp3', 'audio', 'audio/mpeg', 5242880, 'My Song', 'Artist Name', '/uploads/sample.mp3');

-- Table to store user accounts
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash',
    profile_image VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- http://localhost:3000/libraries.html