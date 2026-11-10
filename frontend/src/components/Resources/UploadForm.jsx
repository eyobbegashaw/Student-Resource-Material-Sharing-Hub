import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { resourcesAPI } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  LinkIcon,
  InformationCircleIcon,
  SparklesIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  BookOpenIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

const detectFormat = (text) => {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  if (/\.pdf(\b|\?|#|$)/.test(t)) return 'PDF';
  if (/\.(docx?|rtf|odt)(\b|\?|#|$)/.test(t) || t.includes('docs.google.com/document')) return 'DOC';
  if (/\.(pptx?|pps|odp)(\b|\?|#|$)/.test(t) || t.includes('docs.google.com/presentation')) return 'PPT';
  if (/\.(xlsx?|csv|ods)(\b|\?|#|$)/.test(t) || t.includes('docs.google.com/spreadsheets')) return 'XLS';
  if (/\.(txt|md|log)(\b|\?|#|$)/.test(t)) return 'TXT';
  if (/\.(jpe?g|png|gif|webp|svg|bmp)(\b|\?|#|$)/.test(t)) return 'IMG';
  return null;
};

const UploadForm = ({ onSuccess, onCancel }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      course_name: '',
      university_name: user?.university_name || '',
      department_name: user?.department_name || '',
      description: '',
      external_url: '',
      title: '',
      year: user?.year_of_study || '',
      semester: '1',
      tags: '',
      file_type: 'PDF',
    }
  });

  // Load distinct universities & departments from student registrations and uploads in DB
  const { data: filterOptions } = useQuery('registered_filter_options', () =>
    resourcesAPI.getFilterOptions().then((res) => res.data).catch(() => ({ universities: [], departments: [] }))
  );

  const uniList = filterOptions?.universities || [];
  const deptList = filterOptions?.departments || [];

  const titleVal = watch('title');
  const urlVal = watch('external_url');

  // Auto-detect file extension when typing title (e.g. a.pdf) or URL
  useEffect(() => {
    const detected = detectFormat(titleVal) || detectFormat(urlVal);
    if (detected) {
      setValue('file_type', detected);
    }
  }, [titleVal, urlVal, setValue]);

  const uploadMutation = useMutation(
    (data) => resourcesAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Learning material successfully posted to database!');
        onSuccess?.();
      },
      onError: (error) => {
        const errorData = error.response?.data;
        if (typeof errorData === 'object' && errorData !== null) {
          const firstErr = Object.values(errorData)[0];
          const msg = Array.isArray(firstErr) ? firstErr[0] : (errorData.message || errorData.detail || JSON.stringify(firstErr));
          toast.error(msg);
        } else {
          toast.error('Failed to post learning material. Please try again.');
        }
      },
    }
  );

  const onSubmit = (formData) => {
    if (!formData.external_url?.trim()) {
      toast.error('Please provide a Google Drive or cloud document URL.');
      return;
    }

    const detected = formData.file_type || detectFormat(formData.title) || detectFormat(formData.external_url) || 'PDF';

    const payload = {
      course_name: formData.course_name.trim(),
      university_name: formData.university_name.trim(),
      department_name: formData.department_name.trim(),
      description: formData.description.trim(),
      external_url: formData.external_url.trim(),
      title: formData.title?.trim() || `${formData.course_name.trim()} - ${formData.department_name.trim()} Notes`,
      file_type: detected,
      year: formData.year || null,
      semester: formData.semester || null,
      tags: formData.tags?.trim() || '',
    };

    uploadMutation.mutate(payload);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 transition-colors max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <CloudArrowUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span>{t('upload_header_title')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('upload_header_desc')}
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        {/* Course Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center space-x-1.5">
            <BookOpenIcon className="h-3.5 w-3.5 text-blue-500" />
            <span>{t('upload_course_name')}</span>
          </label>
          <input
            type="text"
            {...register('course_name', { required: 'Course Name is required' })}
            placeholder={t('upload_course_ph')}
            className="input-field text-sm"
          />
          {errors.course_name && (
            <p className="mt-1 text-xs text-red-500">{errors.course_name.message}</p>
          )}
        </div>

        {/* University Name & Department Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center space-x-1.5">
              <BuildingLibraryIcon className="h-3.5 w-3.5 text-blue-500" />
              <span>{t('upload_uni_name')}</span>
            </label>
            <input
              type="text"
              list="universities-datalist"
              {...register('university_name', { required: 'University Name is required' })}
              placeholder={t('upload_uni_ph')}
              className="input-field text-sm"
            />
            <datalist id="universities-datalist">
              {uniList.map((u, i) => (
                <option key={u.id || u.value || u.name || i} value={u.name || u.value} />
              ))}
            </datalist>
            {errors.university_name && (
              <p className="mt-1 text-xs text-red-500">{errors.university_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center space-x-1.5">
              <AcademicCapIcon className="h-3.5 w-3.5 text-blue-500" />
              <span>{t('upload_dept_name')}</span>
            </label>
            <input
              type="text"
              list="departments-datalist"
              {...register('department_name', { required: 'Department is required' })}
              placeholder={t('upload_dept_ph')}
              className="input-field text-sm"
            />
            <datalist id="departments-datalist">
              {deptList.map((d, i) => (
                <option key={d.id || d.value || d.name || i} value={d.name || d.value} />
              ))}
            </datalist>
            {errors.department_name && (
              <p className="mt-1 text-xs text-red-500">{errors.department_name.message}</p>
            )}
          </div>
        </div>

        {/* Real File URL (Google Drive / Accessible Cloud link) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center space-x-1.5">
            <LinkIcon className="h-3.5 w-3.5 text-blue-500" />
            <span>{t('upload_file_url')}</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <LinkIcon className="h-4 w-4" />
            </div>
            <input
              type="url"
              {...register('external_url', { required: 'File URL is required' })}
              placeholder={t('upload_url_ph')}
              className="input-field text-sm pl-9"
            />
          </div>
          {errors.external_url && (
            <p className="mt-1 text-xs text-red-500">{errors.external_url.message}</p>
          )}

          <div className="mt-2 flex items-start space-x-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <InformationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>
              <strong>Google Drive Sharing:</strong> Open your file in Google Drive, click <em>Share &rarr; Anyone with the link can view</em>, copy the link, and paste it here. Students can view and download it immediately.
            </span>
          </div>
        </div>

        {/* Material Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            {t('upload_desc_label')}
          </label>
          <textarea
            rows={3}
            {...register('description', {
              required: 'Description is required',
              minLength: { value: 10, message: 'Description must be at least 10 characters' }
            })}
            placeholder={t('upload_desc_ph')}
            className="input-field text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Optional Custom Material Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
            <span>{t('upload_title_label')}</span>
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder={t('upload_title_ph')}
            className="input-field text-sm"
          />
        </div>

        {/* File Format / Extension */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
            <span>File Format / Extension</span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Auto-detected from filename (e.g. a.pdf) or URL</span>
          </label>
          <select {...register('file_type')} className="input-field text-sm font-medium">
            <option value="PDF">PDF Document (.pdf)</option>
            <option value="DOC">Word Document (.docx, .doc)</option>
            <option value="PPT">PowerPoint Presentation (.pptx, .ppt)</option>
            <option value="XLS">Excel Spreadsheet (.xlsx, .csv)</option>
            <option value="TXT">Text Notes (.txt, .md)</option>
            <option value="IMG">Image Files (.png, .jpg)</option>
            <option value="OTHER">Other Format</option>
          </select>
        </div>

        {/* Academic Details: Year, Semester & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              {t('upload_field_year')}
            </label>
            <select {...register('year')} className="input-field text-sm">
              <option value="">{t('browse_all_years')}</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              {t('upload_field_semester')}
            </label>
            <select {...register('semester')} className="input-field text-sm">
              <option value="">Any Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              {t('upload_field_tags')}
            </label>
            <input
              type="text"
              {...register('tags')}
              placeholder={t('upload_field_tags_ph')}
              className="input-field text-sm"
            />
          </div>
        </div>

        {/* Student Contributor Attribution Preview */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-4 w-4 text-amber-500" />
            <span>Posting as: <strong className="text-gray-900 dark:text-white">{user?.show_name_on_publish !== false ? (user?.full_name || user?.username) : 'Anonymous Student'}</strong></span>
          </div>
          {user?.show_name_on_publish !== false && user?.student_id && (
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
              ID: {user.student_id}
            </span>
          )}
          {user?.show_name_on_publish === false && (
            <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded text-[11px] font-medium">
              Anonymous Mode
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary text-sm"
            >
              {t('upload_cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={uploadMutation.isLoading}
            className="btn-primary text-sm flex items-center space-x-2 shadow-md shadow-blue-500/20"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            <span>{uploadMutation.isLoading ? t('upload_uploading') : t('upload_submit')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;
