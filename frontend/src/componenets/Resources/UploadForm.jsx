import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { resourcesAPI, universityAPI } from '../../services/api';
import { XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

const UploadForm = ({ onSuccess, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedUni, setSelectedUni] = useState('');
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm();

  // Load universities
  const { data: universities } = useQuery('universities', () =>
    universityAPI.getAll().then(res => res.data.results || res.data)
  );

  // Load departments when university changes
  useEffect(() => {
    if (selectedUni) {
      universityAPI.getDepartments(selectedUni)
        .then(res => setDepartments(res.data.results || res.data))
        .catch(err => console.error('Failed to load departments:', err));
    }
  }, [selectedUni]);

  // Load courses when department changes
  const departmentId = watch('department');
  useEffect(() => {
    if (departmentId) {
      universityAPI.getCourses(departmentId)
        .then(res => setCourses(res.data.results || res.data))
        .catch(err => console.error('Failed to load courses:', err));
    }
  }, [departmentId]);

  // File dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setSelectedFile(file);
        setValue('file', file);
      }
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
    maxFiles: 1,
  });

  const removeFile = () => {
    setSelectedFile(null);
    setValue('file', null);
  };

  const uploadMutation = useMutation(
    (data) => resourcesAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Resource uploaded successfully!');
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload resource');
      },
    }
  );

  const onSubmit = (data) => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = {
      ...data,
      file: selectedFile,
    };

    uploadMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          File *
        </label>
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
          >
            <input {...getInputProps()} />
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the file here'
                : 'Drag & drop a file here, or click to select'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, Word, PowerPoint, or Image (max 50MB)
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <DocumentArrowUpIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="title"
          {...register('title', { required: 'Title is required' })}
          className="input-field"
          placeholder="e.g., Introduction to Algorithms - Lecture Notes"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          rows="4"
          {...register('description', { required: 'Description is required' })}
          className="input-field"
          placeholder="Provide a brief description of the resource..."
          style={{ fontFamily: 'inherit' }} // Supports Amharic
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* University Selection */}
      <div>
        <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
          University *
        </label>
        <select
          id="university"
          onChange={(e) => setSelectedUni(e.target.value)}
          className="input-field"
          required
        >
          <option value="">Select University</option>
          {universities?.map(uni => (
            <option key={uni.id} value={uni.id}>{uni.name}</option>
          ))}
        </select>
      </div>

      {/* Department Selection */}
      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
          Department *
        </label>
        <select
          id="department"
          {...register('department', { required: 'Department is required' })}
          className="input-field"
          disabled={!selectedUni}
        >
          <option value="">Select Department</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
        {errors.department && (
          <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
        )}
      </div>

      {/* Course Selection (Optional) */}
      <div>
        <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
          Course (Optional)
        </label>
        <select
          id="course"
          {...register('course')}
          className="input-field"
          disabled={!departmentId}
        >
          <option value="">Select Course</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Year and Semester */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            id="year"
            {...register('year')}
            className="input-field"
          >
            <option value="">Select Year</option>
            {[1, 2, 3, 4, 5].map(year => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
            Semester
          </label>
          <select
            id="semester"
            {...register('semester')}
            className="input-field"
          >
            <option value="">Select Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          Tags (Optional)
        </label>
        <input
          type="text"
          id="tags"
          {...register('tags')}
          className="input-field"
          placeholder="e.g., exam, lecture, past paper, separated by commas"
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate tags with commas
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploadMutation.isLoading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadMutation.isLoading ? 'Uploading...' : 'Upload Resource'}
        </button>
      </div>
    </form>
  );
};

export default UploadForm;