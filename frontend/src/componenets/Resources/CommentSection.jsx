import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { commentsAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const CommentSection = ({ resourceId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', resourceId],
    queryFn: () => commentsAPI.getByResource(resourceId).then(res => res.data),
  });

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: (text) => commentsAPI.create(resourceId, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', resourceId]);
      setNewComment('');
      toast.success('Comment added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    },
  });

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: ({ commentId, text }) => commentsAPI.update(resourceId, commentId, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', resourceId]);
      setEditingComment(null);
      setEditText('');
      toast.success('Comment updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update comment');
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentsAPI.delete(resourceId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', resourceId]);
      toast.success('Comment deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    },
  });

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim()) return;
    createMutation.mutate(newComment.trim());
  };

  const handleEdit = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  const handleUpdate = (commentId) => {
    if (!editText.trim()) return;
    updateMutation.mutate({ commentId, text: editText.trim() });
  };

  const handleDelete = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate(commentId);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <label htmlFor="comment" className="block text-lg font-semibold">
          Comments
        </label>
        <textarea
          id="comment"
          rows="3"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Share your thoughts... (Amharic supported)" : "Please login to comment"}
          disabled={!user}
          className="input-field font-amharic"
          style={{ fontFamily: 'inherit' }}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!user || !newComment.trim() || createMutation.isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isLoading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : comments?.results?.length > 0 ? (
          comments.results.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              {editingComment === comment.id ? (
                // Edit mode
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="input-field font-amharic"
                    rows="2"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      disabled={!editText.trim() || updateMutation.isLoading}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {comment.user.full_name?.charAt(0) || comment.user.username?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {comment.user.full_name || comment.user.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    {user && comment.user.id === user.id && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(comment)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mt-2 font-amharic">
                    {comment.text}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
