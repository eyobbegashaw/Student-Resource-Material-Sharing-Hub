import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { commentsAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const CommentSection = ({ resourceId }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  // Fetch comments
  const { data: comments, isLoading } = useQuery(
    ['comments', resourceId],
    () => commentsAPI.getByResource(resourceId).then((res) => res.data?.results || res.data || [])
  );

  // Create comment mutation
  const createMutation = useMutation(
    (text) => commentsAPI.create(resourceId, { text }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', resourceId]);
        setNewComment('');
        toast.success('Comment posted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to post comment');
      },
    }
  );

  // Update comment mutation
  const updateMutation = useMutation(
    ({ commentId, text }) => commentsAPI.update(resourceId, commentId, { text }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', resourceId]);
        setEditingComment(null);
        setEditText('');
        toast.success('Comment updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update comment');
      },
    }
  );

  // Delete comment mutation
  const deleteMutation = useMutation(
    (commentId) => commentsAPI.delete(resourceId, commentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', resourceId]);
        toast.success('Comment deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete comment');
      },
    }
  );

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to participate in the resource discussion');
      return;
    }
    if (!newComment.trim()) return;
    createMutation.mutate(newComment.trim());
  };

  const handleEdit = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = (commentId) => {
    if (!editText.trim()) return;
    updateMutation.mutate({ commentId, text: editText.trim() });
  };

  const commentList = Array.isArray(comments) ? comments : [];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-xl p-6 sm:p-8 transition-colors">
      <div className="flex items-center space-x-2.5 mb-6">
        <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('comments_forum_title')} ({commentList.length})
        </h2>
      </div>

      {/* New Comment Input */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex items-start space-x-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('comments_placeholder')}
                className="input-field text-sm font-amharic"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={createMutation.isLoading || !newComment.trim()}
                  className="btn-primary py-2 px-5 text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
                >
                  <PaperAirplaneIcon className="h-3.5 w-3.5" />
                  <span>{createMutation.isLoading ? t('comments_posting') : t('comments_post_btn')}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 mb-8 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
          <span>{t('comments_login_prompt')}</span>
          <a href="/login" className="font-bold underline ml-2">
            {t('nav_login')}
          </a>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex items-start space-x-3">
              <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : commentList.length > 0 ? (
        <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800/80">
          {commentList.map((c) => (
            <div key={c.id} className="pt-4 first:pt-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {(c.user?.full_name?.[0] || c.user?.username?.[0] || 'S').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {c.user?.full_name || c.user?.username || 'Student'}
                      </span>
                      {c.user?.university_name && (
                        <span className="text-[11px] text-gray-400">
                          &bull; {c.user.university_name}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {c.created_at && formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {editingComment === c.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="input-field text-xs font-amharic"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(c.id)}
                            className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold"
                          >
                            {t('comments_save')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingComment(null)}
                            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs"
                          >
                            {t('comments_cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line font-amharic">
                        {c.text}
                      </p>
                    )}
                  </div>
                </div>

                {user && user.id === c.user?.id && editingComment !== c.id && (
                  <div className="flex items-center space-x-1 text-gray-400">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-1 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this comment?')) {
                          deleteMutation.mutate(c.id);
                        }
                      }}
                      className="p-1 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-gray-400">
          No comments yet. Be the first to start the discussion!
        </div>
      )}
    </div>
  );
};

export default CommentSection;
