from django.db import models
from django.contrib.auth import get_user_model
from apps.university.models import Department, Course
from django.core.validators import MinValueValidator, MaxValueValidator
import os
import re

User = get_user_model()

def extract_extension_type(text):
    """Extract standard file type code from filename, title, or URL"""
    if not text:
        return None
    t = str(text).strip().lower()
    if re.search(r'\.pdf(\b|\?|#|$)', t):
        return 'PDF'
    if re.search(r'\.(docx?|rtf|odt)(\b|\?|#|$)', t) or 'docs.google.com/document' in t:
        return 'DOC'
    if re.search(r'\.(pptx?|pps|odp)(\b|\?|#|$)', t) or 'docs.google.com/presentation' in t:
        return 'PPT'
    if re.search(r'\.(xlsx?|csv|ods)(\b|\?|#|$)', t) or 'docs.google.com/spreadsheets' in t:
        return 'XLS'
    if re.search(r'\.(txt|md|log)(\b|\?|#|$)', t):
        return 'TXT'
    if re.search(r'\.(jpe?g|png|gif|webp|svg|bmp)(\b|\?|#|$)', t):
        return 'IMG'
    return None

def resource_file_path(instance, filename):
    """Generate file path for uploaded resources"""
    ext = filename.split('.')[-1]
    uni_code = 'univ'
    dept_code = 'general'
    if instance.department:
        dept_code = instance.department.code or 'dept'
        if instance.department.university:
            uni_code = instance.department.university.code or 'univ'
    clean_title = "".join(c for c in instance.title if c.isalnum() or c in (' ', '_', '-')).strip()
    safe_filename = f"{uni_code}_{dept_code}_{clean_title[:30]}.{ext}"
    return os.path.join('resources', uni_code, dept_code, safe_filename)

class Resource(models.Model):
    """Model for academic resources"""
    RESOURCE_TYPES = [
        ('PDF', 'PDF Document'),
        ('DOC', 'Word Document'),
        ('PPT', 'PowerPoint Presentation'),
        ('XLS', 'Excel Spreadsheet'),
        ('TXT', 'Text File'),
        ('IMG', 'Image'),
        ('OTHER', 'Other'),
    ]
    
    title = models.CharField(max_length=300)
    description = models.TextField()
    file = models.FileField(upload_to=resource_file_path, blank=True, null=True)
    external_url = models.URLField(max_length=1000, blank=True, null=True, help_text="Direct link, Google Drive, OneDrive, or Dropbox URL")
    file_type = models.CharField(max_length=10, choices=RESOURCE_TYPES, blank=True, default='PDF')
    file_size = models.PositiveIntegerField(help_text='File size in bytes', default=0)
    
    # Manually entered course, university & department
    course_name = models.CharField(max_length=200, blank=True, default='')
    university_name = models.CharField(max_length=200, blank=True, default='')
    department_name = models.CharField(max_length=200, blank=True, default='')
    student_id = models.CharField(max_length=50, blank=True, default='')

    # Relationships (Optional)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='resources')
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='resources')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_resources')
    
    # Metadata
    tags = models.CharField(max_length=500, blank=True, help_text='Comma-separated tags')
    year = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    semester = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(2)], null=True, blank=True)
    
    # Statistics
    downloads = models.PositiveIntegerField(default=0)
    views = models.PositiveIntegerField(default=0)
    average_rating = models.FloatField(default=0.0)
    
    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['department', '-uploaded_at']),
            models.Index(fields=['course', '-uploaded_at']),
            models.Index(fields=['uploaded_by', '-uploaded_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # Auto-fill title from course_name if title is empty
        if not self.title and self.course_name:
            self.title = f"{self.course_name} Study Material"
            
        # Determine file type from file, title (e.g. a.pdf), or external URL
        detected_type = None
        if self.file:
            detected_type = extract_extension_type(self.file.name)
            try:
                self.file_size = self.file.size
            except Exception:
                self.file_size = 0
        if not detected_type and self.title:
            detected_type = extract_extension_type(self.title)
        if not detected_type and self.external_url:
            detected_type = extract_extension_type(self.external_url)

        if detected_type:
            self.file_type = detected_type
        elif not self.file_type or self.file_type == 'OTHER':
            self.file_type = 'PDF'
        
        super().save(*args, **kwargs)
    
    def update_average_rating(self):
        """Update the average rating for this resource"""
        ratings = self.ratings.all()
        if ratings:
            self.average_rating = round(sum(r.value for r in ratings) / len(ratings), 1)
        else:
            self.average_rating = 0.0
        self.save(update_fields=['average_rating'])

class Notification(models.Model):
    """Notification model for students"""
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications_sent')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"

class Rating(models.Model):
    """Model for resource ratings"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='ratings')
    value = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'resource']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} rated {self.resource.title}: {self.value}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.resource.update_average_rating()
    
    def delete(self, *args, **kwargs):
        resource = self.resource
        super().delete(*args, **kwargs)
        resource.update_average_rating()

class Comment(models.Model):
    """Model for resource comments"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.resource.title}"

class Download(models.Model):
    """Model tracking resource downloads by students"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='download_history', null=True, blank=True)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='downloads_logged')
    downloaded_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-downloaded_at']
        indexes = [
            models.Index(fields=['user', '-downloaded_at']),
            models.Index(fields=['resource', '-downloaded_at']),
        ]

    def __str__(self):
        username = self.user.username if self.user else 'Anonymous'
        return f"{username} downloaded {self.resource.title} at {self.downloaded_at}"
