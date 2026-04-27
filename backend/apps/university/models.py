from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class University(models.Model):
    """Model for universities"""
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='university_logos/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Universities'
    
    def __str__(self):
        return self.name

class Department(models.Model):
    """Model for university departments"""
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['university', 'name']
        unique_together = ['university', 'code']
    
    def __str__(self):
        return f"{self.university.name} - {self.name}"

class Course(models.Model):
    """Model for courses within departments"""
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    year = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    semester = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(2)])
    credits = models.DecimalField(max_digits=3, decimal_places=1)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['department', 'year', 'semester', 'code']
        unique_together = ['department', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"
