# 📚 Student Resource & Material Sharing Hub

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Django](https://img.shields.io/badge/Django-4.2-green.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Ethiopia](https://img.shields.io/badge/🇪🇹-Ethiopia-green)

**A digital library and collaborative space for Ethiopian university students to share and access academic resources.**

 

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

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for development)
- Git
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

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

</div>
