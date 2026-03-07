# 📚 Student Resource & Material Sharing Hub

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Django](https://img.shields.io/badge/Django-4.2-green.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Ethiopia](https://img.shields.io/badge/🇪🇹-Ethiopia-green)

**A digital library and collaborative space for Ethiopian university students to share and access academic resources.**

[Features](#✨-features) • [Demo](#🚀-demo) • [Installation](#📦-installation) • [Usage](#💻-usage) • [Contributing](#🤝-contributing) • [License](#📄-license)

</div>

---

## 🌟 Overview

Student Resource Hub is a platform designed to break down financial and logistical barriers to educational materials in Ethiopian universities. Students can share and access academic resources including PDFs, lecture notes, past exams, and research papers.

### Why This Project?

- **💰 Combat High Book Costs**: Imported textbooks are incredibly expensive in Ethiopia
- **🏛️ Preserve Local Knowledge**: Store valuable theses and research done in Ethiopian universities
- **🤝 Foster Collaboration**: Connect students across different universities (AAU, ASTU, Bahir Dar, etc.)

---

## ✨ Features

### ✅ Core Functionality (MVP)

| Feature | Description |
|---------|-------------|
| **User Authentication** | Register with university email (.edu.et) to ensure authenticity |
| **Department Structure** | Content organized by university and department |
| **File Upload** | Upload PDFs, Word docs, PowerPoints with titles and descriptions |
| **File Download/Preview** | Browse, search, and view/download resources |
| **Rating System** | Upvote/downvote to highlight quality materials |
| **Discussion Forum** | Comment section per resource |

### 🎨 UI/UX Highlights

- **Clean Academic Interface** - Distraction-free digital library experience
- **Easy Navigation** - Dropdown menus for University → Department → Year
- **Visual Preview** - File icons and thumbnails for easy browsing
- **Amharic Support** - Full support for Ethiopian languages

---

## 🏗️ Tech Stack

### Backend
```
🐍 Django 4.2           - Web framework
🛠️ Django REST Framework - API building
🐘 PostgreSQL           - Database
🔐 JWT Authentication   - Security
📁 AWS S3              - File storage
```

### Frontend
```
⚛️ React 18            - UI library
🎨 Tailwind CSS        - Styling
📡 React Query         - API state management
📝 React Hook Form     - Form handling
🧭 React Router        - Navigation
```

---

## 📸 Screenshots

<div align="center">
<table>
  <tr>
    <td><strong>🏠 Home Page</strong><br/>Browse top resources</td>
    <td><strong>📄 Resource Detail</strong><br/>View and download</td>
  </tr>
  <tr>
    <td><strong>📤 Upload Form</strong><br/>Share your materials</td>
    <td><strong>👤 Dashboard</strong><br/>Manage your uploads</td>
  </tr>
</table>
</div>

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for development)
- Git

### 📦 Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/student-resource-hub.git
cd student-resource-hub
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure database
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

#### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/swagger

---

## 💻 Usage Guide

### For Students 👨‍🎓

1. **Register** with your university email (.edu.et)
2. **Browse** resources by university and department
3. **Upload** your notes, past exams, or research
4. **Rate** and **comment** on helpful materials
5. **Download** resources for offline study

### For Administrators 👨‍💼

1. **Manage** universities, departments, and courses
2. **Review** uploaded content
3. **Monitor** user activity
4. **Generate** usage reports

---

## 📁 Project Structure

```
student-resource-hub/
├── backend/                 # Django backend
│   ├── core/                # Project settings
│   ├── apps/                
│   │   ├── accounts/        # User authentication
│   │   ├── university/      # Uni/Dept models
│   │   ├── resources/       # File, comment, rating
│   │   └── api/             # DRF views/serializers
│   └── manage.py
│
└── frontend/                # React frontend
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/           # Page components
    │   ├── hooks/           # Custom hooks
    │   ├── services/        # API calls
    │   └── App.js
    └── package.json
```

---

## 🐳 Docker Setup

Run the entire application with Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` in the `backend` folder:
```env
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=student_hub
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

Create `.env` in the `frontend` folder:
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_MAX_FILE_SIZE=50
REACT_APP_UNIVERSITY_DOMAIN=.edu.et
```

---

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 📊 API Documentation

Interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | User registration |
| POST | `/api/auth/login/` | User login |
| GET | `/api/resources/` | List resources |
| POST | `/api/resources/` | Upload resource |
| GET | `/api/resources/{id}/` | Resource details |
| POST | `/api/resources/{id}/download/` | Download counter |

---

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] User authentication with .edu.et emails
- [x] Basic CRUD for resources
- [x] Comments and ratings
- [x] Department-based organization

### Phase 2 (Coming Soon) 🚧
- [ ] Resource bookmarks
- [ ] User notifications
- [ ] Advanced search with filters
- [ ] Mobile app (React Native)

### Phase 3 (Future) 🌟
- [ ] Peer-to-peer chat
- [ ] Study groups
- [ ] Resource recommendations
- [ ] Analytics dashboard

---

## 👥 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8
- **JavaScript**: Use Prettier and ESLint
- **CSS**: Follow Tailwind best practices

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Bug description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Addis Ababa University** - For inspiring this project
- **All Ethiopian Students** - Who struggle with expensive textbooks
- **Open Source Community** - For amazing tools and libraries

---

## 📞 Contact & Support

- **Email**: support@studenthub.edu.et
- **Telegram**: [t.me/studenthub](https://t.me/studenthub)
- **Twitter**: [@studenthub](https://twitter.com/studenthub)

---

<div align="center">

**Made with ❤️ for Ethiopian Students**

[🇪🇹](#) [🇺🇸](#) [🇫🇷](#)

</div>

---

## 🚦 Quick Commands Cheat Sheet

```bash
# Backend
cd backend
source venv/bin/activate
python manage.py runserver
python manage.py migrate
python manage.py createsuperuser

# Frontend
cd frontend
npm start
npm run build
npm test

# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f

# Git
git add .
git commit -m "message"
git push origin main
```

---

## 🏆 Contributors

<a href="https://github.com/yourusername/student-resource-hub/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=yourusername/student-resource-hub" />
</a>

---

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

</div>
