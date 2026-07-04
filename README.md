# MUSYNC 🎵

An immersive, interactive music library and streaming platform. MUSYNC is designed to deliver a premium audio experience featuring dynamic audio visualizers, a full-featured music player, and seamless integration with the Audius API.

## 🚀 Features

- **Dynamic Audio Visualizers**: High-fidelity 15-bar audio-reactive equalizer and full-page ambient wave background that responds in real-time to the beats of the music.
- **Audius Integration**: Stream a vast library of free music via integration with the Audius API.
- **Main Library & File Uploads**: Users can create personalized libraries, upload custom `.mp3` tracks, and store their metadata securely.
- **Beautiful Dark UI**: A modern, sleek, and premium user interface optimized for the best web experience.
- **Premium Memberships**: Support for varied subscription tiers for advanced features.
- **Backend & Database**: Fully backed by MySQL and a lightweight Node.js server to handle custom uploads safely.

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js & Express (with compatibility for XAMPP/Tomcat environments setup)
- **Database**: MySQL (via XAMPP)
- **Third-Party APIs**: Audius Music API
- **Deployment**: GitHub Pages (Static hosting) with GitHub Actions

## 📂 Project Structure

- `index.html`, `libraries.html`, `premium.html` - Core interface pages.
- `*.css` - Modular, modern dark-themed styles for corresponding pages.
- `server.js` & `db.js` - Configuration for the backend API and database connection.
- `/uploads/` - Directory constructed for processing user-uploaded tracks.
- `/sql/` - Contains the `music_library.sql` script necessary to configure the proper tables and columns required for MySQL. 

## ⚙️ How to Run Locally

If you just want to run the frontend design, you can simply open `index.html` in your browser. 
To utilize the full backend and database features:

1. **Database Setup**: Enable Apache and MySQL via XAMPP. Navigate to phpMyAdmin and import the `sql/music_library.sql` script.
2. **Install Dependencies**: Run `npm install` within the project root to install all required Node.js packages.
3. **Start the Server**: Run `node server.js` to begin the backend API.
4. **View Application**: Navigate to `http://localhost:3000` (or your defined port) to start listening!

## 📜 License
This project is for educational and showcase purposes.
