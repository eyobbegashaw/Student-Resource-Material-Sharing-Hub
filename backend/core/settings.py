"""
Django settings for core project.
"""

from pathlib import Path
from decouple import config
import dj_database_url
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = ['*'] if DEBUG else [h.strip() for h in config('ALLOWED_HOSTS', default='localhost,127.0.0.1,*.app.github.dev,*.githubpreview.dev,.onrender.com,*.onrender.com').split(',') if h.strip()]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    'django_filters',
    'drf_yasg',
    'storages',
    
    # Local apps
    'apps.accounts',
    'apps.university',
    'apps.resources',
    'apps.api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database - Supabase PostgreSQL configuration
DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=config('CONN_MAX_AGE', default=0, cast=int),
            conn_health_checks=True,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='postgres'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default=''),
            'PORT': config('DB_PORT', default='6543'),
            'CONN_MAX_AGE': config('CONN_MAX_AGE', default=0, cast=int),
            'OPTIONS': {
                'sslmode': config('DB_SSLMODE', default='require'),
            },
        }
    }

# Fallback to local SQLite only if explicitly requested
if config('USE_SQLITE', default=False, cast=bool):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Addis_Ababa'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Static & Media Storage Configuration
USE_S3 = config('USE_S3', default=False, cast=bool)
if USE_S3 and config('AWS_STORAGE_BUCKET_NAME', default=''):
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='eu-west-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_DEFAULT_ACL = 'private'
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    
    # S3 static settings
    STATIC_LOCATION = 'static'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{STATIC_LOCATION}/'
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    
    # S3 media settings
    DEFAULT_FILE_STORAGE = 'core.storage_backends.MediaStorage'
else:
    # Production Whitenoise storage for static assets
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.authentication.CsrfExemptSessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = DEBUG or config('CORS_ALLOW_ALL_ORIGINS', default=False, cast=bool)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
if config('CORS_ALLOWED_ORIGINS', default=''):
    for origin in config('CORS_ALLOWED_ORIGINS').split(','):
        cleaned = origin.strip()
        if cleaned and cleaned not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(cleaned)

CORS_ALLOW_CREDENTIALS = True

# Automatically allow Vercel deployment and preview URLs
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
]

# CSRF settings for frontend SPA
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://*.app.github.dev',
    'https://*.githubpreview.dev',
    'https://*.vercel.app',
    'https://*.onrender.com',
]
if config('CSRF_TRUSTED_ORIGINS', default=''):
    for origin in config('CSRF_TRUSTED_ORIGINS').split(','):
        cleaned = origin.strip()
        if cleaned and cleaned not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(cleaned)

# Email settings (supports console for development, SMTP for production)
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com').strip()
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='').strip()
# Automatically clean spaces or dashes from Google 16-letter App Passwords (e.g. 'abcd efgh ijkl mnop' -> 'abcdefghijklmnop')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='').replace(' ', '').replace('-', '').strip()

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    raw_from = config('DEFAULT_FROM_EMAIL', default='').strip()
    if raw_from and '<' in raw_from:
        DEFAULT_FROM_EMAIL = raw_from
    elif raw_from:
        DEFAULT_FROM_EMAIL = f'StudentHub <{raw_from}>'
    else:
        DEFAULT_FROM_EMAIL = f'StudentHub <{EMAIL_HOST_USER}>'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'StudentHub <noreply@studenthub.et>'

# University email domain for authentication
ALLOWED_EMAIL_DOMAINS = ['edu.et', 'student.ethiouniversity.edu.et']  # Add more as needed

# Google OAuth Configuration
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')
GOOGLE_CALLBACK_URL = config('GOOGLE_CALLBACK_URL', default='http://localhost:8000/api/auth/google/')
