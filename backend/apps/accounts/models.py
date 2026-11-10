from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.conf import settings
import re

class User(AbstractUser):
    """Custom User model with university email validation"""
    email = models.EmailField(unique=True)
    university = models.ForeignKey(
        'university.University',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    department = models.ForeignKey(
        'university.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    # Student Profile Details
    university_name = models.CharField(max_length=200, blank=True, default='')
    department_name = models.CharField(max_length=200, blank=True, default='')
    year_of_study = models.PositiveSmallIntegerField(null=True, blank=True)
    student_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    profile_picture = models.FileField(upload_to='profile_pics/', null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    
    # Student Settings & Preferences
    theme_preference = models.CharField(max_length=10, default='light')
    notify_new_resources = models.BooleanField(default=True)
    notify_comments = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=False)
    show_name_on_publish = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Add these fields to avoid clashes with the default User model
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions'
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        ordering = ['-date_joined']
        
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def clean(self):
        """Validate and normalize email and student_id"""
        super().clean()
        if self.email:
            self.email = self.email.lower().strip()
        if not self.student_id or not str(self.student_id).strip():
            self.student_id = None
        else:
            self.student_id = str(self.student_id).strip()
            
    def save(self, *args, **kwargs):
        if not self.student_id or not str(self.student_id).strip():
            self.student_id = None
        else:
            self.student_id = str(self.student_id).strip()
        self.full_clean()
        super().save(*args, **kwargs)


class EmailOTP(models.Model):
    """Stores 6-digit one-time passcodes for email verification upon registration"""
    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='email_otps',
        null=True,
        blank=True
    )
    email = models.EmailField(db_index=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email OTP'
        verbose_name_plural = 'Email OTPs'

    def __str__(self):
        return f"OTP for {self.email} ({self.otp}) - Used: {self.is_used}"

    def is_valid(self):
        from django.utils import timezone
        return (not self.is_used) and (timezone.now() <= self.expires_at)

