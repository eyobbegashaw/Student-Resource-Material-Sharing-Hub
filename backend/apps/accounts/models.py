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
    year_of_study = models.PositiveSmallIntegerField(null=True, blank=True)
    student_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
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
        """Validate university email domain"""
        super().clean()
        if self.email:
            # Check if email ends with .edu.et
            if not self.email.lower().endswith('.edu.et'):
                raise ValidationError({'email': 'Only university email addresses (.edu.et) are allowed.'})
            
            # Additional validation for specific universities can be added here
            
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
