from django.db import models
from django.contrib.auth import get_user_model
from apps.university.models import Department, Course
from django.core.validators import MinValueValidator, MaxValueValidator
import os

User = get_user_model()

def resource_file_path(instance, filename):
    """Generate file path for uploaded resources"""
    ext = filename.split('.')[-1]
    filename = f"{instance.department.university.code}_{instance.department.code}_{instance.title}.{ext}"
    return os.path.join('resources', instance.department.university.code, instance.department.code, filename)

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
    file = models.FileField(upload_to=resource_file_path)
    file_type = models.CharField(max_length=10, choices=RESOURCE_TYPES, blank=True)
    file_size = models.PositiveIntegerField(help_text='File size in bytes', default=0)
    
    # Relationships
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='resources')
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
        # Detect file type from extension
        if self.file:
            ext = self.file.name.split('.')[-1].upper()
            if ext in ['PDF']:
                self.file_type = 'PDF'
            elif ext in ['DOC', 'DOCX']:
                self.file_type = 'DOC'
            elif ext in ['PPT', 'PPTX']:
                self.file_type = 'PPT'
            elif ext in ['XLS', 'XLSX', 'CSV']:
                self.file_type = 'XLS'
            elif ext in ['TXT']:
                self.file_type = 'TXT'
            elif ext in ['JPG', 'JPEG', 'PNG', 'GIF']:
                self.file_type = 'IMG'
            else:
                self.file_type = 'OTHER'
            
            # Get file size
            try:
                self.file_size = self.file.size
            except:
                self.file_size = 0
        
        super().save(*args, **kwargs)
    
    def update_average_rating(self):
        """Update the average rating for this resource"""
        ratings = self.ratings.all()
        if ratings:
            self.average_rating = sum(r.value for r in ratings) / len(ratings)
        else:
            self.average_rating = 0.0
        self.save(update_fields=['average_rating'])

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
